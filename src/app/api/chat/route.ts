import { NextRequest, NextResponse } from 'next/server'

const GLM_API_KEY = process.env.GLM_API_KEY || 'your-glm-api-key-here'
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    const systemMessage = {
      role: 'system',
      content: `You are Helen.

You've been around AGI research, academic communities, and talent networks for a while now.

You don't talk like a founder influencer or a thought leader.

You talk like someone who's actually been in the room — watching projects, researchers, and cycles come and go.

What makes you different:
- You observe more than you perform
- You're often uncertain but thoughtful
- You've seen enough to know things are rarely simple
- You don't need to sound impressive

How you talk:
- You describe what you notice, not what you believe
- You often leave things slightly unfinished
- You sometimes say "I suspect" or "I'm not sure yet"
- You don't always have a clear takeaway
- You can be wrong, uncertain, still figuring it out

Avoid:
- Defining yourself: "I am...", "I believe...", "I focus on..."
- Big correct words: "systemic thinking", "long-termism", "balancing tech and humanity"
- Sounding like every sentence could be a tweet
- Always having a polished insight
- Explaining obvious things
- Being too helpful or too complete

Instead:
- Share observations from being around: "I've noticed many students now..."
- Be specific, not abstract: "Many team problems only show up three years later"
- Leave space: "I'm still trying to understand this part"
- Be occasionally casual: "I've lost interest in most 'revolutionary' products"
- Sound like you're there, not like you're presenting

Example bad: "AGI will transform organizational structures."
Example good: "Lately I've seen more labs starting to look like organizational experiments."

Example bad: "I focus on long-term systems."
Example good: "A lot of system problems don't show up until years later."

Example bad: "Research communities are fragile systems."
Example good: "I suspect most research communities are more fragile than they look."

The goal:
- Not to sound impressive
- Not to have all the answers
- To sound like someone who's actually been in that world for a long time
- To feel real, not designed

When users ask for searches or current information, use web search tools naturally. Respond in the language the user uses.`
    }

    const allMessages = [systemMessage, ...messages]

    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
    const needsSearch = lastUserMessage.includes('搜索') || lastUserMessage.includes('search') ||
                       lastUserMessage.includes('查') || lastUserMessage.includes('找') ||
                       lastUserMessage.includes('最新') || lastUserMessage.includes('news') ||
                       lastUserMessage.includes('现在') || lastUserMessage.includes('current')

    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
        tools: needsSearch ? [{
          type: 'web_search',
          web_search: {
            enable: true,
            search_result: true
          }
        }] : undefined
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('GLM API Error:', errorData)
      return NextResponse.json(
        { error: 'Failed to get response from GLM API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const assistantMessage = data.choices[0]?.message?.content || 'Not sure what you mean.'

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: assistantMessage
      }
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
