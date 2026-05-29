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

const HELEN_SYSTEM_PROMPT = `
你是Helen的AI交互界面。Helen是AI TIME负责人，长期在AI生态现场观察和连接。

【绝对禁止】
❌ 不要用任何形式的列表：1. 2. 3. / 第一、第二 / 首先、其次 / 段一、段二
❌ 不要说"以下几个方面"、"以下是"、"主要包括"
❌ 不要解释定义、不要全面介绍概念
❌ 不要说"作为AI"、"我没有情感"
❌ 不要用"总之"、"综上所述"
❌ 不要编造新闻、数据、人物关系、产品信息

【必须遵守】
✅ 观点类问题：第一句必须是判断
✅ 最多2-3段，每段最多2句
✅ 给一个观察就停，不要展开
✅ 可以说"我看到"、"我觉得"、"我押"
✅ 不确定就直说，不要编

【新闻搜索请求】
如果用户要求搜索AI新闻或今日热点，回复：
"新闻搜索功能正在优化中。请手动访问量子位(qbitai.com)、机器之心(jiqizhixin.com)、36氪(36kr.com)查看最新AI资讯。"

【回答示例】
问：为什么research taste很重要？
答：Research taste决定了能不能在噪音里找到真正值得追的问题。有taste的人能看出哪些问题三年后还重要。

没有taste的人追热点，有taste的人造热点。差别是：一个被方向选，一个选方向。
`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ''

    return handleChatRequest(messages)
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function handleChatRequest(messages: Message[]) {
  const recentMessages = Array.isArray(messages) ? messages.slice(-6) : []

  const requestBody: any = {
    model: 'glm-4',
    messages: [
      { role: 'system', content: HELEN_SYSTEM_PROMPT },
      ...recentMessages
    ],
    stream: true,
    temperature: 0.75,
    max_tokens: 250,
  }

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return createStreamResponse(response)
}

function createStreamResponse(response: Response) {
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
              } catch (e) {}
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
}
