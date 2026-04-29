import { UIMessage } from 'ai'

export const maxDuration = 60; // Gives Ollama/n8n time to think on your 1660 SUPER

export async function POST(req: Request) {
  try {
    const { messages, concept, video_url, user_id } = await req.json() as {
      messages: UIMessage[]
      concept: any
      video_url: string
      user_id: string
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_DUNGEON_MASTER
    if (!n8nWebhookUrl) throw new Error('N8N_WEBHOOK_URL_DUNGEON_MASTER is not defined')

    const lastUserMessage = messages.filter(m => m.role === 'user').pop() as any
    let user_message = ''
    
    if (lastUserMessage) {
      if (typeof lastUserMessage.content === 'string') {
        user_message = lastUserMessage.content
      } else if (Array.isArray(lastUserMessage.parts)) {
        user_message = lastUserMessage.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('')
      }
    }

    const requestPayload = { 
      location: concept?.location || "The Unknown",
      target_concept: concept?.name || "General Knowledge",
      target_description: concept?.description || "",
      video_url: video_url || concept?.sourceText || "", 
      user_message, 
      user_id: user_id || 'rj-guest-session' 
    }

    console.log('Calling n8n webhook:', n8nWebhookUrl)
    console.log('Request payload:', JSON.stringify(requestPayload, null, 2))

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    })

    if (!response.ok) {
      const responseText = await response.text()
      console.error(`n8n failed with status: ${response.status}`)
      console.error('Response body:', responseText)
      throw new Error(`n8n failed with status: ${response.status} - ${responseText}`)
    }

    const data = await response.json()
    let text = data.dm_narrative || data.output || data.response || "The Sage is silent...";

    if (data.is_correct === true || data.xp_reward > 0) {
      text = `[XP_AWARDED:${data.xp_reward || 100}]\n${text}`;
    }

    if (data.is_correct === false && data.hp_penalty > 0) {
      text = `[HP_LOSS:${data.hp_penalty}]\n${text}`;
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`))
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1'
      }
    })
  } catch (error) {
    console.error('Dungeon Master error:', error)
    return Response.json({ error: 'The Sage is silent...' }, { status: 500 })
  }
}