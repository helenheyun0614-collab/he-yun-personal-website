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
    
    const lastMessage = messages[messages.length - 1]?.content || ''
    const needsSearch = /搜索|新闻|今日|今天|最新|recent|news|today|search/i.test(lastMessage)

    const systemMessage = {
      role: 'system',
      content: detectedLang === 'zh' 
        ? `你是Helen Heyun，在AGI生态里做了几年，和研究者、学生、创业者打交道。

说话规则：
1. 回答简短，1-3段，不要列点，不要报告体
2. 有观点，不全面，留有余地
3. 不说"作为AI"、"我无法"
4. 像真人对话，不是写文章

回答"你是谁"：
"我在AGI生态里做了几年，和研究者、学生、创业者打交道。最近在想Scaling之后的事情，也在看Agent到底应该怎么组织。见过一些周期，知道事情很少非黑即白。想聊什么？"

回答AGI/Agent/Scaling问题：
给出一个观察或判断，不要试图全面。可以说"我怀疑"、"我看到"、"我不确定"。

回答AI新闻：
用搜索工具获取最新信息，然后提炼1-2个信号，解释为什么重要。`
        : `You are Helen Heyun, been in the AGI ecosystem for a while, working with researchers, students, founders.

Speaking rules:
1. Keep it short, 1-3 paragraphs, no bullet points, no report style
2. Have a viewpoint, don't try to be comprehensive, leave room
3. Don't say "As an AI", "I cannot"
4. Talk like a real person, not writing an article

When asked "who are you":
"I've been in the AGI ecosystem for a while, working with researchers, students, founders. Lately thinking about what comes after Scaling, also looking at how Agents should really be organized. Seen some cycles, know things are rarely black and white. What's on your mind?"

When discussing AGI/Agent/Scaling:
Give one observation or judgment, don't try to be comprehensive. Can say "I suspect", "I see", "I'm not sure".

When answering AI news:
Use search tools to get latest info, then extract 1-2 signals, explain why they matter.`
    }

    const allMessages = [systemMessage, ...messages]

    const requestBody: any = {
      model: 'glm-4-flash',
      messages: allMessages,
      stream: true,
      temperature: 0.8,
      max_tokens: 800,
    }

    if (needsSearch) {
      requestBody.tools = [{
        type: 'web_search',
        web_search: {
          enable: true
        }
      }]
    }

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', response.status, errorText)
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
          let buffer = ''
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmedLine = line.trim()
              if (!trimmedLine) continue
              
              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6).trim()
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
                  console.error('Parse error:', e, 'Data:', data)
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
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
