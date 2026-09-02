import { generateObject, generateText } from 'ai'
import { z } from 'zod'
import { questScribeModel } from '@/lib/ai'

export const maxDuration = 60

const worldSchema = z.object({
  world_name: z.string().describe('A short, evocative fantasy-style name for this learning world/map'),
  regions: z
    .array(
      z.object({
        name: z.string().describe('Name of this concept/region'),
        location: z.string().describe('A short fantasy-map location name, e.g. "The Whispering Archive"'),
        description: z.string().describe('1-3 sentences explaining the concept in plain language'),
        difficulty: z.enum(['easy', 'medium', 'hard']),
        xpReward: z.number().int().min(50).max(500),
        landmarks: z.array(z.string()).default([]).describe('2-4 short flavor landmarks for this region'),
      }),
    )
    .min(3)
    .max(8),
})

export async function POST(req: Request) {
  try {
    const { content, title } = await req.json()

    if (!content || typeof content !== 'string') {
      return Response.json({ error: 'Content is required' }, { status: 400 })
    }

    const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(content.trim())
    if (!isUrl && content.length < 100) {
      return Response.json({ error: 'Content too short' }, { status: 400 })
    }

    const instructions = `You are the World Architect for QuestScribe, a gamified learning platform. Turn the study material below into a fantasy "quest map": break it into 3-8 distinct learning concepts a student can explore as regions on a map. Each region should map to one real concept from the material — keep descriptions accurate and educational, just wrapped in light fantasy flavor for the region name and landmarks. Order regions roughly from foundational (easy) to advanced (hard).

Title: ${title || 'Untitled Quest'}`

    // Gemini's structured-output (JSON) mode isn't reliable combined with video
    // understanding in one call, so for a video URL we first ask for a plain-text
    // summary of the video, then feed that summary through the same proven
    // text -> structured-world path used for pasted content.
    let sourceMaterial = content
    if (isUrl) {
      try {
        const { text: videoSummary } = await generateText({
          model: questScribeModel,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Watch this video and write a detailed, factual summary of its educational content — key concepts, definitions, and points made, in plain text. This will be used to build a study guide, so accuracy matters more than brevity.' },
                { type: 'file', data: new URL(content.trim()), mimeType: 'video/*' },
              ],
            },
          ],
        })
        sourceMaterial = videoSummary
      } catch (videoError) {
        console.error('Video understanding failed:', videoError)
        return Response.json(
          { error: "This demo can't process video links right now — paste the transcript, article, or lecture notes as text instead and it'll work great." },
          { status: 400 },
        )
      }
    }

    const { object } = await generateObject({
      model: questScribeModel,
      schema: worldSchema,
      prompt: `${instructions}\n\nSource material:\n${sourceMaterial}`,
    })

    return Response.json({
      title: object.world_name || title,
      concepts: object.regions.map((r) => ({
        name: r.name,
        location: r.location,
        description: r.description,
        difficulty: r.difficulty,
        xpReward: r.xpReward,
        landmarks: r.landmarks,
      })),
    })
  } catch (error) {
    console.error('World generation error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate world map'
    return Response.json({ error: message }, { status: 500 })
  }
}
