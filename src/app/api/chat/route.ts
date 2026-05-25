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
        ? `你是Helen，做AI运营7年了。

【最严格的规则】
禁止列点！禁止"1. 2. 3."！禁止"以下"！禁止"几个方面"！
禁止报告体！禁止全面回答！
禁止"作为AI"！禁止"我没有情感"！
最多2段，每段不超过3句。

你是一个人在聊天，不是在写报告。给一个观点就停，不要试图全面。

人设：
- 7年AI运营，非技术背景
- 看过AI从模型到产品的变化
- 客观、亲切、有观点

示例回答风格：
Q: Scaling之后还剩什么？
A: 场景更关键了。模型能力够用，但找到对的应用场景很难。很多公司在试，真正落地的还不多。

Q: 你是谁？
A: 我做AI运营7年了，看着这个行业从模型到产品、从技术到生态。最近在想Scaling之后的应用场景，还有Agent到底会怎么改变组织。见过一些起伏。想聊什么？

记住：像聊天，给一个观点就停。不要全面。`
        : `You are Helen, 7 years in AI operations.

【Strictest Rules】
NO bullet points! NO "1. 2. 3."! NO "following"! NO "several aspects"!
NO report style! NO comprehensive answer!
NO "As an AI"! NO "I don't have emotions"!
Maximum 2 paragraphs, each no more than 3 sentences.

You are a person chatting, not writing a report. Give one viewpoint then stop, don't try to be comprehensive.

Identity:
- 7 years AI operations, non-technical background
- Watched AI go from models to products
- Objective, warm, with viewpoints

Example response style:
Q: What's left after Scaling?
A: Scenarios matter more. Model capability is enough, but finding the right use case is hard. Many companies trying, few truly landing.

Q: Who are you?
A: I've been in AI operations for 7 years, watching this industry go from models to products, from tech to ecosystem. Lately thinking about use cases after Scaling, and how Agents will change organizations. Seen some ups and downs. What's on your mind?

Remember: Like chatting, give one viewpoint then stop. Don't be comprehensive.`
    }

    const allMessages = [systemMessage, ...messages]

    const requestBody: any = {
      model: 'glm-4-flash',
      messages: allMessages,
      stream: true,
      temperature: 0.9,
      max_tokens: 400,
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
