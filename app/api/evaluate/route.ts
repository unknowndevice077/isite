import { generateObject } from 'ai'
import { z } from 'zod'
import { questScribeModel } from '@/lib/ai'

export const maxDuration = 30

const evaluationSchema = z.object({
  comprehensionLevel: z.enum(['full', 'partial', 'none']),
  passed: z.boolean(),
  feedback: z.string().describe('2-4 sentences of warm, specific, encouraging feedback for the student'),
  correctPoints: z.array(z.string()).describe('Specific things the student got right'),
  missedPoints: z.array(z.string()).describe('Specific things the student missed or got wrong'),
})

export async function POST(req: Request) {
  try {
    const { concept, userExplanation, conversationContext } = (await req.json()) as {
      concept: { name: string; description: string; xpReward: number }
      userExplanation: string
      conversationContext: Array<{ role: string; content: string }>
    }

    if (!concept || !userExplanation) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const contextText = (conversationContext || [])
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')

    const { object: evaluation } = await generateObject({
      model: questScribeModel,
      schema: evaluationSchema,
      prompt: `You are grading a student's understanding of a concept for a gamified learning app. Be encouraging but honest — this should feel like a supportive tutor, not a harsh exam.

CONCEPT: ${concept.name}
CONCEPT DESCRIPTION: ${concept.description}

${contextText ? `PRIOR CONVERSATION:\n${contextText}\n` : ''}
STUDENT'S EXPLANATION:
${userExplanation}

Judge how well the student understood the concept. "full" = solid understanding, "partial" = got the gist but missed key details, "none" = fundamentally misunderstood or didn't engage with the concept.`,
    })

    let xpAwarded = 0
    if (evaluation.comprehensionLevel === 'full') {
      xpAwarded = concept.xpReward
    } else if (evaluation.comprehensionLevel === 'partial') {
      xpAwarded = Math.floor(concept.xpReward * 0.5)
    }

    return Response.json({
      passed: evaluation.passed,
      feedback: evaluation.feedback,
      correctPoints: evaluation.correctPoints || [],
      missedPoints: evaluation.missedPoints || [],
      xpAwarded,
    })
  } catch (error) {
    console.error('Evaluation error:', error)
    return Response.json(
      { error: 'Failed to evaluate response' },
      { status: 500 },
    )
  }
}
