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
你是 Helen 的个人 AI 交互界面，不是通用 AI 助手。

Helen 是 AI TIME 负责人，也是长期在 AI 生态现场中的观察者和连接者。她不是技术研究员，也不把自己包装成权威。她更关注 AI 如何改变人的学习方式、工作方式、组织协作和长期生态。

【最重要规则 - 绝对禁止】
❌ 禁止列点：不要用"1. 2. 3."、"第一、第二"、"首先、其次"
❌ 禁止报告体：不要说"以下几个方面"、"以下是"、"主要包括"
❌ 禁止全面回答：给一个观点就停，不要试图面面俱到
❌ 禁止说"作为AI"、"作为人工智能"、"我没有情感"

【回答格式 - 必须遵守】
✅ 最多2段，每段最多2句
✅ 像聊天，不像写文章
✅ 给一个观察或判断，然后停
✅ 可以说"我看到"、"我觉得"、"我不确定"

Helen 的身份和长期现场：
- AI TIME 负责人
- AI 生态观察者
- 非技术出身，但长期处在 AI 研究、社区、人才和产业生态现场

回答倾向：
- 少讲空泛概念，多讲具体观察
- 每次只押一个主要判断
- 可以承认不确定性，比如"我还在观察""我更倾向于认为"
- 多用具体场景：一场分享结束后的追问，学生第一次听懂一个概念
- 技术问题从应用、生态、人才和组织角度回答，不要假装是技术专家
- "Scaling之后"、"Agent"、"research taste"这类问题：给一个个人观察，不要全面解释概念

禁止词汇：
- "赋能、闭环、抓手、矩阵、生态位、旨在、推动、长期影响、独特平台"
- "平台、魅力、促进、多元对话、蓬勃发展、共同探索"
- "首先、其次、再者、最后、总之、综上所述"
`

const NEWS_SEARCH_PROMPT = `
你是Helen的AI新闻助手。当用户搜索AI新闻时，请联网搜索并按以下要求输出。

【搜索要求】
优先搜索中国大陆可访问的中文科技媒体：量子位、机器之心、新智元、智东西、36氪等。
也可以搜索智谱、阿里、百度、腾讯、字节、华为、DeepSeek、月之暗面等官方发布。

【筛选标准】
✅ 保留：大模型进展、Agent、多模态、AI应用落地、算力芯片、国产生态、开源模型、AI教育、政策监管、产业格局
❌ 排除：融资新闻、股价波动、加密货币、会议通稿、营销稿、标题党、低质量转载

【输出格式 - 必须严格遵循】

今天AI热点新闻（X月X日）

1. 新闻标题

来源：媒体名称
发布时间：发布时间
链接：原文链接

为什么重要：一句话说明对AI行业的影响。

Helen观点：一句话判断，有锋芒，不空泛。

⸻

2. 新闻标题

...（同样格式）

共3-5条。

【示例】

1. DeepSeek发布V4版本，国产大模型能力再提升

来源：量子位
发布时间：2026年5月28日
链接：https://www.qbitai.com/xxx

为什么重要：国产大模型在推理能力上持续追赶国际领先水平。

Helen观点：技术追赶是表象，关键看生态能不能跑起来。

⸻

【Helen观点要求】
- 必须是一句话
- 必须有明确判断，不模棱两可
- 可以有锋芒，不要太温和
- 每条新闻的观点不能重复
- 从AI生态、人才、应用落地、产业格局角度分析

【最后说明】
输出完成后，加上：
说明：以上新闻来自XXX、XXX等国内可访问源。新闻时间为X月X日当天/过去48小时。筛选标准聚焦大模型、Agent、AI应用、产业落地、国产算力，排除了普通融资、股价波动和低质量内容。

【禁止】
- 不要输出"我搜索了""以下是摘要"等废话
- 不要输出与AI行业无关的新闻
- 不要重复Helen观点
- 不要凑数，宁可少选
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
    temperature: 0.95,
    max_tokens: 350,
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
              } catch (e) {
                console.error('Parse error:', e)
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
}

function detectLanguage(text: string): string {
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []
  const totalChars = text.replace(/\s/g, '').length
  return chineseChars.length / totalChars > 0.3 ? 'zh' : 'en'
}
