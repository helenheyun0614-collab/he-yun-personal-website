import { NextRequest } from 'next/server'

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

interface NewsItem {
  title: string
  source: string
  publishedTime: string
  snippet: string
  link: string
  score: number
}

interface NewsFeed {
  source: string
  url: string
}

const CHINA_AI_FEEDS: NewsFeed[] = [
  { source: '36氪', url: 'https://www.36kr.com/feed' },
  { source: '雷峰网', url: 'https://www.leiphone.com/feed' },
  { source: '钛媒体', url: 'https://www.tmtpost.com/feed' },
]

const HIGH_VALUE_AI_PATTERNS = /大模型|模型|Agent|智能体|多模态|视频生成|机器人|AI Infra|Infra|算力|芯片|GPU|数据中心|开源|国产模型|DeepSeek|通义|千问|Qwen|文心|豆包|混元|智谱|Kimi|月之暗面|MiniMax|MiniCPM|华为|昇腾|阿里|百度|腾讯|字节|OpenAI|Anthropic|Gemini|Claude|Llama|Coding|代码|政策|监管|备案|应用落地|产业落地/i
const STRONG_AI_PATTERNS = /大模型|模型发布|开源模型|国产模型|Agent|智能体|多模态|视频生成|机器人|具身|AI Infra|算力|芯片|GPU|数据中心|DeepSeek|通义|千问|Qwen|文心|豆包|混元|智谱|Kimi|月之暗面|MiniMax|MiniCPM|OpenAI|Anthropic|Gemini|Claude|Llama|Coding|代码|政策|监管|备案|审计|安全/i
const LOW_VALUE_AI_PATTERNS = /股价|股票|概念股|涨停|融资小新闻|估值|持仓|基金|获奖|荣膺|大会|会议|论坛|峰会|白皮书|营销|发布会预告|活动预告|直播预告|报名|招聘|财报|证券|研报|转载|标题党|加密货币|token|ETH|WLD|数百万|天使轮|A轮|Pre-A|首发|上市|起售价|售价|手机|汽车|比亚迪|OPPO|Reno|摄影|消费电子|家电|评测|导购|种草|科氪|产品矩阵|工作站|8点1氪|早报|晚报|日报|周报/i

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

async function handleNewsRequest(query: string) {
  const items = await fetchChinaAINews()
  return createTextResponse(formatChinaNews(items))
}

async function handleChatRequest(messages: Message[]) {
  const recentMessages = Array.isArray(messages) ? messages.slice(-6) : []
  
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-4',
      messages: [
        { role: 'system', content: HELEN_SYSTEM_PROMPT },
        ...recentMessages
      ],
      stream: true,
      temperature: 0.75,
      max_tokens: 250,
    }),
  })
  
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return createStreamResponse(response)
}

async function fetchChinaAINews(): Promise<NewsItem[]> {
  const settled = await Promise.allSettled(
    CHINA_AI_FEEDS.map((feed) => fetchNewsFeed(feed))
  )

  const seen = new Set<string>()

  return settled
    .flatMap((result) => result.status === 'fulfilled' ? result.value : [])
    .filter(isRecentNews)
    .filter(isHighValueAI)
    .sort((a, b) => b.score - a.score)
    .filter((item) => {
      const key = normalizeNewsKey(item.title)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 5)
}

async function fetchNewsFeed(feed: NewsFeed): Promise<NewsItem[]> {
  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HelenWebsite/1.0)',
      },
      next: { revalidate: 900 },
    })

    if (!response.ok) return []

    const xml = await response.text()
    const blocks = xml.match(/<(item|entry)>[\s\S]*?<\/\1>/g) || []

    return blocks.map((block) => {
      const title = cleanText(getXmlValue(block, 'title'))
      const snippet = cleanText(getXmlValue(block, 'description') || getXmlValue(block, 'summary') || getXmlValue(block, 'content:encoded'))
      const publishedTime = cleanText(getXmlValue(block, 'pubDate') || getXmlValue(block, 'published') || getXmlValue(block, 'updated'))
      const link = cleanText(getXmlValue(block, 'link') || getAtomLink(block))

      return {
        title,
        source: feed.source,
        publishedTime,
        snippet,
        link,
        score: scoreNews(`${title} ${snippet}`),
      }
    }).filter((item) => item.title && item.publishedTime && item.link)
  } catch (error) {
    console.error(`Failed to fetch ${feed.source}:`, error)
    return []
  }
}

function formatChinaNews(items: NewsItem[]) {
  if (items.length === 0) {
    return '我刚刚联网查了 36氪、雷峰网、钛媒体这些可直接抓取的大陆来源，但没有拿到今天或过去 48 小时内足够重要、可核验的 AI 行业新闻。机器之心、量子位、新智元这类站点当前没有稳定可用的 RSS/API 接口；要真正覆盖它们，需要接正式搜索 API 或浏览器抓取服务。'
  }

  const expanded = items.some((item) => !isTodayNews(item))
  const header = `我刚刚联网查了大陆可访问来源，只保留 AI 行业影响较大的 ${items.length} 条${expanded ? '。今天足够硬的新闻不多，所以放宽到了过去 48 小时' : ''}：`

  const body = items.map((item, index) => {
    const level = getQualityLevel(item)
    return `${index + 1}. ${item.title}
新闻质量：${level}
来源：${item.source}
发布时间：${formatNewsTime(item.publishedTime)}
链接：${item.link}
为什么重要：${getImportance(item)}
Helen 看法：${getHelenTake(item)}`
  }).join('\n\n')

  return `${header}\n\n${body}`
}

function isRecentNews(item: NewsItem) {
  const published = Date.parse(item.publishedTime)
  if (Number.isNaN(published)) return false

  const ageMs = Date.now() - published
  return ageMs >= 0 && ageMs <= 48 * 60 * 60 * 1000
}

function isTodayNews(item: NewsItem) {
  const published = new Date(item.publishedTime)
  if (Number.isNaN(published.getTime())) return false

  const now = new Date()
  return published.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }) ===
    now.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
}

function isHighValueAI(item: NewsItem) {
  const text = `${item.title} ${item.snippet}`
  const title = item.title
  if (!HIGH_VALUE_AI_PATTERNS.test(text)) return false

  const isStrongTitle = STRONG_AI_PATTERNS.test(title)
  const isLowValue = LOW_VALUE_AI_PATTERNS.test(text)
  if (!isStrongTitle) return false
  if (isLowValue) return false
  if (/融资|估值|持仓|基金|收购|并购/i.test(text) && !/(OpenAI|Anthropic|DeepSeek|智谱|月之暗面|MiniMax|算力|芯片|数据中心|AI Infra|大模型|模型发布|开源模型)/i.test(text)) return false

  return scoreNews(text) >= 25
}

function scoreNews(text: string) {
  let score = 0

  if (/大模型|模型发布|国产模型|开源模型|DeepSeek|Qwen|通义|文心|豆包|Kimi|MiniMax|MiniCPM|智谱/i.test(text)) score += 35
  if (/Agent|智能体|Coding|代码|AI应用|应用落地|产业落地/i.test(text)) score += 25
  if (/多模态|视频生成|机器人|具身/i.test(text)) score += 22
  if (/算力|芯片|GPU|AI Infra|数据中心|昇腾|NVIDIA/i.test(text)) score += 22
  if (/政策|监管|备案|审计|安全/i.test(text)) score += 20
  if (/阿里|百度|腾讯|字节|华为|月之暗面|DeepSeek|智谱|MiniMax/i.test(text)) score += 12

  return score
}

function getQualityLevel(item: NewsItem) {
  const text = `${item.title} ${item.snippet}`

  if (/模型发布|大模型|开源模型|政策|监管|算力|芯片|数据中心|基础设施|AI Infra/i.test(text)) {
    return '必看'
  }

  if (/Agent|智能体|应用落地|产业落地|生态合作|开源/i.test(text)) {
    return '可看'
  }

  return '可看'
}

function getImportance(item: NewsItem) {
  const text = `${item.title} ${item.snippet}`
  const title = item.title

  if (/Agent|智能体/i.test(title)) {
    return '智能体是 AI 从“问答工具”进入真实工作流的关键入口，值得看它是否真的能执行任务。'
  }

  if (/Coding|代码/i.test(title)) {
    return 'AI 编程正在从辅助补全变成开发入口，这会改变工程师、产品和创业团队的协作方式。'
  }

  if (/大模型|模型发布|国产模型|开源模型|MiniCPM/i.test(title)) {
    return '模型能力和开源节奏会直接影响开发者生态，也会改变国内 AI 应用的成本结构。'
  }

  if (/Agent|智能体/i.test(text)) {
    return '智能体是 AI 从“问答工具”进入真实工作流的关键入口，值得看它是否真的能执行任务。'
  }

  if (/多模态|视频生成|机器人|具身/i.test(text)) {
    return '多模态和机器人会把 AI 从文本窗口推向更真实的产品形态。'
  }

  if (/算力|芯片|GPU|AI Infra|数据中心|昇腾/i.test(text)) {
    return '算力和基础设施决定模型能不能持续迭代，也决定谁能把能力稳定交付给用户。'
  }

  if (/政策|监管|备案|审计|安全/i.test(text)) {
    return '监管变化会影响模型发布、行业准入和企业采用 AI 的速度。'
  }

  return '它的价值在于可能影响 AI 应用落地、生态合作或产业格局。'
}

function getHelenTake(item: NewsItem) {
  const text = `${item.title} ${item.snippet}`
  const title = item.title

  if (/Agent|智能体/i.test(title)) {
    return '我会看它是不是真的进入工作流程，而不是停在“发布了一个助手”的层面。'
  }

  if (/Coding|代码/i.test(title)) {
    return '我越来越觉得，AI 编程会先改变小团队的速度，再倒逼大组织重做研发流程。'
  }

  if (/大模型|模型发布|国产模型|开源模型|MiniCPM/i.test(title)) {
    return '我更关心它会不会降低开发者和中小团队使用模型的门槛，而不是单看参数或榜单。'
  }

  if (/Agent|智能体/i.test(text)) {
    return 'Agent 真正有价值的地方不是会聊天，而是能不能进入组织流程，替人完成一段可验证的任务。'
  }

  if (/应用落地|产业落地|AI应用/i.test(text)) {
    return '产业落地不是把 AI 放进宣传页，而是它有没有改变原来的交付效率和人才分工。'
  }

  if (/算力|芯片|GPU|AI Infra|数据中心|昇腾/i.test(text)) {
    return '国内 AI 竞争最后会落到基础设施韧性上，谁能稳定供给算力，谁才有持续迭代的底气。'
  }

  if (/政策|监管|备案|审计|安全/i.test(text)) {
    return '这说明 AI 已经从技术竞赛进入治理阶段，企业不能只讲能力，也要讲责任边界。'
  }

  return '这类新闻要放进生态里看：它改变的不是单个产品，而是人、工具和组织之间的关系。'
}

function getXmlValue(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return decodeXml(match?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') || '')
}

function getAtomLink(xml: string) {
  const alternate = xml.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["'][^>]*>/i)
  if (alternate?.[1]) return alternate[1]

  const href = xml.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)
  return href?.[1] || ''
}

function cleanText(value: string) {
  return decodeXml(value)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
}

function normalizeNewsKey(title: string) {
  return title.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '')
}

function formatNewsTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai',
  })
}

function createTextResponse(content: string) {
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
