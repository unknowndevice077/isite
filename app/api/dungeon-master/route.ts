import { UIMessage, generateObject } from 'ai'
import { z } from 'zod'
import { questScribeModel } from '@/lib/ai'

export const maxDuration = 60

const dmSchema = z.object({
  narrative: z.string().describe("The Sage's in-character response, 2-5 sentences, warm and encouraging fantasy-narrator tone"),
  isCorrect: z.boolean().nullable().describe('Whether the last student message showed correct understanding, or null if not applicable (e.g. a greeting)'),
  xpReward: z.number().int().min(0).max(200).describe('XP to award if isCorrect is true, otherwise 0'),
  hpPenalty: z.number().int().min(0).max(50).describe('HP to deduct if isCorrect is false, otherwise 0'),
})

interface QuestConcept {
  name?: string
  location?: string
  description?: string
}

/** Handles both string-content and parts-array message shapes. */
function extractText(message: UIMessage): string {
  const content = (message as { content?: unknown }).content
  if (typeof content === 'string') return content
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
  }
  return ''
}

export async function POST(req: Request) {
  try {
    const { messages, concept, video_url } = (await req.json()) as {
      messages: UIMessage[]
      concept: QuestConcept | undefined
      video_url: string
      user_id: string
    }

    const lastUserMessage = messages.filter((m) => m.role === 'user').pop()
    const user_message = lastUserMessage ? extractText(lastUserMessage) : ''

    const location = concept?.location || 'The Unknown'
    const targetConcept = concept?.name || 'General Knowledge'
    const targetDescription = concept?.description || ''

    const historyText = messages
      .slice(-8)
      .map((m) => `${m.role}: ${extractText(m)}`)
      .join('\n')

    const { object } = await generateObject({
      model: questScribeModel,
      schema: dmSchema,
      prompt: `You are "The Sage", an in-world narrator and tutor for QuestScribe, a fantasy-themed learning game. Stay in character: warm, a little theatrical, but never condescending. You are guiding a student through a location called "${location}" where the lesson is about: ${targetConcept}.

CONCEPT TO TEACH: ${targetConcept}
CONCEPT DETAILS: ${targetDescription}
${video_url ? `SOURCE MATERIAL: ${video_url}` : ''}

CONVERSATION SO FAR:
${historyText || '(this is the start of the conversation)'}

STUDENT'S LATEST MESSAGE: ${user_message || '(the student just arrived)'}

Respond in character as The Sage. If the student is demonstrating or explaining the concept, judge whether they understood it correctly and set isCorrect/xpReward/hpPenalty accordingly. If they're just greeting you or asking a question, set isCorrect to null and xpReward/hpPenalty to 0.`,
    })

    let text = object.narrative || 'The Sage is silent...'

    if (object.isCorrect === true && object.xpReward > 0) {
      text = `[XP_AWARDED:${object.xpReward}]\n${text}`
    }

    if (object.isCorrect === false && object.hpPenalty > 0) {
      text = `[HP_LOSS:${object.hpPenalty}]\n${text}`
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1',
      },
    })
  } catch (error) {
    console.error('Dungeon Master error:', error)
    return Response.json({ error: 'The Sage is silent...' }, { status: 500 })
  }
}
