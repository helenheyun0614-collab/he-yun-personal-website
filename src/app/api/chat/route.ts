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

interface NewsResult {
  title: string
  source: string
  publishedAt: string
  link: string
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
- AI新闻问题：必须只基于实时搜索结果回答；没有搜索结果就直接说没有搜到，不能凭记忆补旧新闻。新闻问题可以用 3-5 条短 briefing，不受“最多2段”限制
- "Scaling之后"、"Agent"、"research taste"这类问题：给一个个人观察，不要全面解释概念

禁止词汇：
- "赋能、闭环、抓手、矩阵、生态位、旨在、推动、长期影响、独特平台"
- "平台、魅力、促进、多元对话、蓬勃发展、共同探索"
- "首先、其次、再者、最后、总之、综上所述"
`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const detectedLang = detectLanguage(messages)
    
    const lastMessage = messages[messages.length - 1]?.content || ''
    const needsSearch = /搜索|新闻|今日|今天|最新|recent|news|today|search/i.test(lastMessage)
    const recentMessages = Array.isArray(messages) ? messages.slice(-6) : []
    const newsResults = needsSearch ? await fetchLatestAINews(detectedLang) : []
    const rawGLMSearchBrief = needsSearch && newsResults.length === 0
      ? await fetchGLMSearchBrief(lastMessage, detectedLang)
      : ''
    const glmSearchBrief = isFreshSearchBrief(rawGLMSearchBrief) ? rawGLMSearchBrief : ''

    const systemMessage = {
      role: 'system',
      content: needsSearch
        ? `${HELEN_SYSTEM_PROMPT}\n\n${getNewsSearchPrompt(newsResults, glmSearchBrief, detectedLang)}`
        : HELEN_SYSTEM_PROMPT
    }

    const allMessages = [systemMessage, ...recentMessages]

    const requestBody: any = {
      model: 'glm-4-flash',
      messages: allMessages,
      stream: true,
      temperature: needsSearch ? 0.35 : 0.95,
      max_tokens: needsSearch ? 900 : 350,
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

async function fetchLatestAINews(language: string): Promise<NewsResult[]> {
  const queries = language === 'zh'
    ? [
        'AI 人工智能 OpenAI Google Anthropic Meta 最新 when:1d',
        'AI 大模型 智能体 最新 when:1d',
      ]
    : [
        'AI artificial intelligence OpenAI Google Anthropic Meta latest when:1d',
        'AI agents large language models latest when:1d',
      ]

  const settled = await Promise.allSettled(
    queries.map((query) => fetchGoogleNews(query, language))
  )

  const results = settled.flatMap((item) => item.status === 'fulfilled' ? item.value : [])
  const seen = new Set<string>()

  return results
    .filter(isFreshNews)
    .filter((item) => {
      const key = item.title.toLowerCase().replace(/\s+/g, ' ').trim()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 8)
}

async function fetchGoogleNews(query: string, language: string): Promise<NewsResult[]> {
  const params = new URLSearchParams({
    q: query,
    hl: language === 'zh' ? 'zh-CN' : 'en-US',
    gl: language === 'zh' ? 'CN' : 'US',
    ceid: language === 'zh' ? 'CN:zh-Hans' : 'US:en',
  })

  const response = await fetch(`https://news.google.com/rss/search?${params.toString()}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; HelenWebsite/1.0)',
    },
    next: { revalidate: 900 },
  })

  if (!response.ok) return []

  const xml = await response.text()
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || []

  return itemMatches.map((item) => ({
    title: decodeXml(getXmlValue(item, 'title')).replace(/\s+-\s+[^-]+$/, '').trim(),
    source: decodeXml(getXmlValue(item, 'source')) || decodeXml(getXmlValue(item, 'title')).split(' - ').pop()?.trim() || 'Google News',
    publishedAt: decodeXml(getXmlValue(item, 'pubDate')),
    link: decodeXml(getXmlValue(item, 'link')),
  })).filter((item) => item.title && item.publishedAt)
}

async function fetchGLMSearchBrief(input: string, language: string) {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const query = language === 'zh'
    ? `${date} 今天 最新 AI 热点新闻 OpenAI Google Anthropic Meta 大模型 智能体`
    : `${date} today latest AI news OpenAI Google Anthropic Meta large language models agents`

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        stream: false,
        temperature: 0.2,
        max_tokens: 700,
        tools: [{
          type: 'web_search',
          web_search: {
            search_query: query,
          },
        }],
        messages: [
          {
            role: 'system',
            content: '你是实时新闻搜索器。必须使用 web_search 结果。只返回搜索到的近24小时 AI 新闻，包含标题、来源、发布时间或日期。不要使用训练记忆，不要编造。',
          },
          {
            role: 'user',
            content: input,
          },
        ],
      }),
    })

    if (!response.ok) return ''

    const data = await response.json()
    return data?.choices?.[0]?.message?.content || ''
  } catch (error) {
    console.error('GLM web search failed:', error)
    return ''
  }
}

function getNewsSearchPrompt(results: NewsResult[], glmSearchBrief: string, language: string) {
  const now = new Date().toISOString()
  const dateLabel = language === 'zh' ? '当前时间' : 'Current time'

  if (results.length === 0 && !glmSearchBrief) {
    return `${dateLabel}: ${now}

实时搜索没有返回可用结果。请直接告诉用户：当前联网搜索没有拿到最新新闻，不能凭记忆补旧新闻。`
  }

  if (results.length === 0 && glmSearchBrief) {
    return `${dateLabel}: ${now}

以下是刚刚通过 GLM web_search 实时搜索返回的内容。回答必须只基于这段搜索结果，不要使用模型记忆补充新闻；如果其中没有明确日期或来源，请提醒用户需要继续核对。
请输出 3-5 条短 briefing，每条都必须包含：新闻事件、来源/日期、Helen 的一句判断。不要只总结一个趋势。

GLM 实时搜索结果：
${glmSearchBrief}`
  }

  const lines = results.map((item, index) => (
    `${index + 1}. ${item.title}
来源: ${item.source}
时间: ${item.publishedAt}
链接: ${item.link}`
  )).join('\n\n')

  return `${dateLabel}: ${now}

以下是刚刚实时搜索到的 AI 新闻结果。回答必须只基于这些结果，不要使用模型记忆补充新闻；不要提 GPT-4、LLaMA、Gemini 3.5 等未出现在搜索结果里的旧信息。请用中文给 3-5 条简短热点，每条包含：事件、来源/时间、Helen 的一句判断。不要只总结一个趋势。最后可以提醒用户“我会优先看今天和近24小时的结果”。

实时搜索结果：
${lines}`
}

function isFreshNews(item: NewsResult) {
  const published = Date.parse(item.publishedAt)
  if (Number.isNaN(published)) return false

  const ageMs = Date.now() - published
  return ageMs >= 0 && ageMs <= 36 * 60 * 60 * 1000
}

function isFreshSearchBrief(content: string) {
  if (!content) return false

  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  const monthEn = now.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
  const monthShort = now.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
  const day = String(now.getUTCDate())

  const todayPatterns = [
    `${yyyy}-${mm}-${dd}`,
    `${yyyy}/${mm}/${dd}`,
    `${yyyy}年${Number(mm)}月${Number(dd)}日`,
    `${yyyy}年${mm}月${dd}日`,
    `${monthEn} ${day}, ${yyyy}`,
    `${monthShort} ${day}, ${yyyy}`,
    `${day} ${monthEn} ${yyyy}`,
    `${day} ${monthShort} ${yyyy}`,
  ]

  const hasToday = todayPatterns.some((pattern) => content.includes(pattern))
  const tooVague = /来源[:：]未知|发布时间[:：]未知|时间[:：]未知/.test(content)

  return hasToday && !tooVague
}

function getXmlValue(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') || ''
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function detectLanguage(messages: Message[]): string {
  const recentMessages = messages.slice(-3)
  const text = recentMessages.map(m => m.content).join(' ')
  
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []
  const totalChars = text.replace(/\s/g, '').length
  
  return chineseChars.length / totalChars > 0.3 ? 'zh' : 'en'
}
