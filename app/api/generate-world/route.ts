import { generateObject } from 'ai'
import { z } from 'zod'
import { fetchTranscript } from 'youtube-transcript-plus'
import { questScribeModel } from '@/lib/ai'

export const maxDuration = 60

const worldSchema = z.object({
  world_name: z.string().describe('A short, evocative fantasy-style name for this learning world/map'),
  synopsis: z
    .string()
    .describe('A plain-language, 2-4 sentence overview of everything this material actually covers — what a student will learn, written so they know what they are about to study before starting. No fantasy flavor here, just a clear content summary.'),
  regions: z
    .array(
      z.object({
        name: z.string().describe('The plain, real subject/topic name for this concept — e.g. "Slope", "Derivative", "Photosynthesis", "The Chain Rule". This is what students will see as the primary label, so it must be immediately recognizable, not a fantasy phrase.'),
        location: z.string().describe('A short, LIGHT map-flavor subtitle for this region, e.g. "Foothills of Function" — subtle flavor only, still short and readable, never obscuring what the topic is.'),
        description: z.string().describe('1-3 sentences explaining the concept in plain language'),
        difficulty: z.enum(['easy', 'medium', 'hard']),
        xpReward: z.number().int().min(50).max(500),
        landmarks: z.array(z.string()).default([]).describe('2-4 short flavor landmarks for this region'),
      }),
    )
    .min(2)
    .max(20)
    .describe('One region per distinct learnable concept actually present in the material — do not pad to hit a target count and do not artificially cap it. A short text might only yield 2-3 concepts; a long, dense lecture could yield 15+. Let the content decide the count.'),
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

    const instructions = `You are the World Architect for QuestScribe, a gamified learning platform. Turn the study material below into a "quest map": break it into every distinct learning concept a student can explore as regions on a map — the number of regions must be driven entirely by how much real, distinct learnable content is in the material, never a fixed target. Each region's "name" must be the actual plain subject term (e.g. "Slope", "Derivative", "Photosynthesis") — save fantasy flavor only for the short "location" subtitle and landmarks, never for the region name itself, description, or difficulty. Order regions roughly from foundational (easy) to advanced (hard).

Title: ${title || 'Untitled Quest'}`

    // Gemini's own multimodal "watch the video" understanding depends on an
    // API surface our pinned SDK version doesn't speak reliably, so instead we
    // pull the video's actual YouTube captions (auto-generated or uploaded)
    // and feed that transcript through the same proven text -> structured-world
    // path used for pasted content. No extra Gemini call needed for this step.
    let sourceMaterial = content
    if (isUrl) {
      try {
        const segments = await fetchTranscript(content.trim())
        const transcript = segments.map((s) => s.text).join(' ').replace(/\s+/g, ' ').trim()

        if (!transcript || transcript.length < 100) {
          return Response.json(
            { error: "This video doesn't have enough captions/transcript available to work with — try a different video, or paste the transcript/notes as text instead." },
            { status: 400 },
          )
        }

        // Cap extremely long transcripts just to keep the prompt sane — this is
        // generous enough (~a 2hr lecture) to let long videos still yield a lot
        // of nodes rather than getting cut short.
        sourceMaterial = transcript.length > 50000 ? transcript.slice(0, 50000) : transcript
      } catch (videoError) {
        console.error('Fetching video transcript failed:', videoError)
        return Response.json(
          { error: "Couldn't fetch a transcript for this video — it may have captions disabled, be private, or be region-restricted. Try a different video, or paste the transcript/notes as text instead." },
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
      synopsis: object.synopsis,
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
