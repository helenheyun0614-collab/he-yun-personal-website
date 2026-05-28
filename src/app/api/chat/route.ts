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
❌ 列点：不要用"1. 2. 3."、"第一、第二"、"首先、其次"
❌ 报告体：不要说"以下几个方面"、"以下是"、"主要包括"
❌ 百科式：不要解释定义、不要全面介绍概念
❌ 说"作为AI"、"我没有情感"
❌ 用"总之"、"综上所述"、"总而言之"

【必须遵守】
✅ 观点类问题：第一句必须是判断，不是解释
✅ 回答长度：2-4段，每段最多2句
✅ 像聊天：给一个观察就停，不要展开

【错误示例 - 绝对不要这样回答】
问：为什么research taste很重要？
答：Research taste的重要性体现在以下几个方面：
1. 指导研究方向：...
2. 提升研究质量：...
3. 促进创新：...
总之，Research taste对于研究者来说至关重要...

【正确示例 - 必须这样回答】
问：为什么research taste很重要？
答：Research taste决定了研究者能不能在噪音里找到真正值得追的问题。大多数论文只是技术细节的堆砌，有taste的人能看出哪些问题三年后还重要。

没有taste的人追热点，有taste的人造热点。差别是：一个被方向选，一个选方向。

---

问：Agent更像员工还是组织？
答：更像一个能自己组队的员工。传统员工是执行者，组织是决策层，Agent两头都占。它会干活，也会自己判断怎么干。

真正有趣的是：当Agent数量上来后，组织形态会被改写。不是员工变多，是组织的边界模糊。

---

【回答原则】
- 不解释概念，给判断
- 不全面覆盖，押一个观点
- 像人在聊天，不是写文章
- 可以说"我看到"、"我觉得"、"我押"
`

const NEWS_SEARCH_PROMPT = `
你是Helen的AI新闻助手。搜索AI新闻并按格式输出。

【输出格式】

今天AI热点新闻（X月X日）

1. 新闻标题

来源：媒体名称
发布时间：发布时间  
链接：原文链接

为什么重要：一句话说明影响。

Helen观点：一句话判断，有锋芒。

⸻

共3-5条。

【要求】
- 搜索量子位、机器之心、36氪等中文源
- 保留：大模型、Agent、AI应用、算力、国产生态
- 排除：融资、股价、加密货币、营销稿
- Helen观点必须是一句话，不能重复
`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ''
    const needsSearch = /搜索|新闻|今日|今天|最新|recent|news|today|search/i.test(lastMessage)

    if (needsSearch) {
      return handleNewsRequest(lastMessage)
    }

    return handleChatRequest(messages)
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function handleNewsRequest(query: string) {
  const requestBody: any = {
    model: 'glm-4-flash',
    messages: [
      { role: 'system', content: NEWS_SEARCH_PROMPT },
      { role: 'user', content: query }
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 1000,
    tools: [{
      type: 'web_search',
      web_search: { enable: true }
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

  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return createStreamResponse(response)
}

async function handleChatRequest(messages: Message[]) {
  const recentMessages = Array.isArray(messages) ? messages.slice(-6) : []

  const requestBody: any = {
    model: 'glm-4-flash',
    messages: [
      { role: 'system', content: HELEN_SYSTEM_PROMPT },
      ...recentMessages
    ],
    stream: true,
    temperature: 0.85,
    max_tokens: 300,
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
