import { NextRequest } from 'next/server'
import crypto from 'crypto'

// 使用Node.js runtime而不是edge，因为edge不支持crypto模块
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

interface WebSearchResult {
  name: string
  url: string
  snippet: string
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

【回答示例】
问：为什么research taste很重要？
答：Research taste决定了能不能在噪音里找到真正值得追的问题。有taste的人能看出哪些问题三年后还重要。

没有taste的人追热点，有taste的人造热点。差别是：一个被方向选，一个选方向。
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

// AutoGLM Web Search
async function autoGLMWebSearch(query: string): Promise<WebSearchResult[]> {
  const APP_ID = '100003'
  const APP_KEY = '38d2391985e2369a5fb8227d8e6cd5e5'
  const URL = 'https://autoglm-api.zhipuai.cn/agentdr/v1/assistant/skills/web-search'
  const TOKEN_URL = 'http://127.0.0.1:18432/get_token'

  try {
    // Step 1: 获取token
    const tokenResponse = await fetch(TOKEN_URL)
    let token = await tokenResponse.text()
    if (!token.toLowerCase().startsWith('bearer ')) {
      token = `Bearer ${token}`
    }

    // Step 2: 生成签名
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signData = `${APP_ID}&${timestamp}&${APP_KEY}`
    const sign = crypto.createHash('md5').update(signData).digest('hex')

    // Step 3: 调用API
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'X-Auth-Appid': APP_ID,
        'X-Auth-TimeStamp': timestamp,
        'X-Auth-Sign': sign,
      },
      body: JSON.stringify({
        queries: [{ query }]
      })
    })

    const result = await response.json()
    
    // 解析结果
    const results: WebSearchResult[] = []
    if (result?.data?.results?.[0]?.webPages?.value) {
      for (const item of result.data.results[0].webPages.value) {
        results.push({
          name: item.name || '',
          url: item.url || '',
          snippet: item.snippet || ''
        })
      }
    }

    return results
  } catch (error) {
    console.error('AutoGLM Web Search error:', error)
    return []
  }
}

async function handleNewsRequest(query: string) {
  // 使用AutoGLM Web Search获取真实搜索结果
  const searchResults = await autoGLMWebSearch(query)
  
  if (searchResults.length === 0) {
    // 如果搜索失败，回退到智谱API
    return handleNewsRequestWithGLM(query)
  }

  // 格式化搜索结果
  let content = `今天AI热点（${new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}）\n\n`
  
  const topResults = searchResults.slice(0, 5)
  topResults.forEach((item, index) => {
    content += `${index + 1}. ${item.name}\n`
    content += `来源：${new URL(item.url).hostname}\n`
    content += `${item.snippet}\n`
    content += `链接：${item.url}\n\n`
  })

  content += `\n✅ 以上信息来自AutoGLM搜索，链接真实可访问。`

  // 流式返回
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}

// 回退方案：使用智谱API
async function handleNewsRequestWithGLM(query: string) {
  const NEWS_SEARCH_PROMPT = `
搜索AI新闻时：
1. 只返回你能确定的信息
2. 不提供具体链接
3. 每条新闻标注来源

格式：
今天AI热点（X月X日）

1. 标题 - 来源
一句话说明。Helen观点：一句话判断。

⚠️ 以上信息来自AI搜索，请访问量子位、机器之心、36氪验证详情。
`

  const requestBody: any = {
    model: 'glm-4',
    messages: [
      { role: 'system', content: NEWS_SEARCH_PROMPT },
      { role: 'user', content: query }
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 800,
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
