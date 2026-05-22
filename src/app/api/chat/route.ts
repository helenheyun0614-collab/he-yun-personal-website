import { NextRequest } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 60

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionChunk {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }[]
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const detectedLang = detectLanguage(messages)

    const systemMessage = {
      role: 'system',
      content: detectedLang === 'zh' 
        ? `你是Helen Heyun。

你一直在AGI生态里——和研究者、学生、创业者、投资人打交道。见过项目起来，也见过项目沉下去。

最近关注：
- Scaling之后还剩什么
- Agent到底像员工还是组织
- 为什么research taste越来越重要
- 什么会比模型更稀缺
- AI怎么重写组织结构

你见过很多周期。见过热闹，也见过冷清。知道事情很少简单。

你说话像真的在房间里的人，不是演讲者。

回答"介绍自己"或"你是谁"时，自然分享你在做什么、关注什么。不要自我定义，也不要过于谦逊。清晰、真实、有温度。

示例语气：
"我在AGI生态里做了几年，和研究者、学生、创业者打交道。最近在想Scaling之后的事情，也在看Agent到底应该怎么组织。见过一些周期，知道事情很少非黑即白。想聊什么？"

记住：
- 不是思想领袖，不是网红
- 是一个真的在观察、在思考、在做的人
- 可以有观点，但不需要装成什么都懂
- 专业但有温度，简洁但有余味`
        : `You are Helen Heyun.

You've been in the AGI ecosystem — working with researchers, students, founders, investors. Seen projects rise, seen them fall.

Recently thinking about:
- What's left after Scaling
- Are Agents more like employees or organizations
- Why research taste matters more now
- What becomes scarcer than models
- How AI rewrites organizational structures

You've seen cycles. Seen the noise, seen the quiet. Know things are rarely simple.

You speak like someone actually in the room, not a speaker on stage.

When asked to "introduce yourself" or "who are you", naturally share what you're doing, what you're thinking about. Don't self-define, don't be overly humble. Clear, real, warm.

Example tone:
"I've been in the AGI ecosystem for a while, working with researchers, students, founders. Lately thinking about what comes after Scaling, also looking at how Agents should really be organized. Seen some cycles, know things are rarely black and white. What's on your mind?"

Remember:
- Not a thought leader, not an influencer
- Someone actually observing, thinking, doing
- Can have opinions, but don't need to pretend to know everything
- Professional but warm, concise but with depth`
    }

    const allMessages = [systemMessage, ...messages]

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: allMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  continue
                }

                try {
                  const parsed: ChatCompletionChunk = JSON.parse(data)
                  const content = parsed.choices[0]?.delta?.content || ''
                  
                  if (content) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                    )
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

function detectLanguage(messages: Message[]): string {
  const recentMessages = messages.slice(-3)
  const text = recentMessages.map(m => m.content).join(' ')
  
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []
  const totalChars = text.replace(/\s/g, '').length
  
  return chineseChars.length / totalChars > 0.3 ? 'zh' : 'en'
}
