import { UIMessage } from 'ai'

export async function POST(req: Request) {
  try {
    const { messages, concept, worldTitle, video_url, user_id } = await req.json() as {
      messages: UIMessage[]
      concept: any
      worldTitle: string
      video_url: string
      user_id: string
    }

    // Use the test URL you provided as the default
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_DUNGEON_MASTER || 'https://friendly-clever-pixel.onhexcorearena.com/webhook-test/dungeon-master'

    // Extract the latest user message text
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

    // Call n8n with the session ID for history filtering
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        video_url: video_url || concept?.sourceText, 
        user_message, 
        user_id: user_id || 'rj-guest-session' 
      }),
    })

    if (!response.ok) throw new Error(`n8n failed with status: ${response.status}`)

    const data = await response.json()
    
    // Extract narrative and XP from the n8n response
    let text = data.dm_narrative || data.output || data.response || (typeof data === 'string' ? data : JSON.stringify(data))
    
    if (data.xp_reward && data.xp_reward > 0) {
      text = `[XP_AWARDED:${data.xp_reward}]\n${text}`
    }

    // Format for Vercel AI SDK Data Stream
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