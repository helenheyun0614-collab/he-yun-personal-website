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

const TRUSTED_NEWS_SOURCES = [
  'reuters',
  'bloomberg',
  'financial times',
  'ft',
  'the information',
  'the verge',
  'techcrunch',
  'wired',
  'mit technology review',
  'openai',
  'anthropic',
  'google deepmind',
  'deepmind',
  'meta ai',
  'microsoft ai',
  'microsoft',
  'nvidia',
  'venturebeat',
]

const OFFICIAL_NEWS_SOURCES = /openai|anthropic|google deepmind|deepmind|meta ai|microsoft ai|microsoft|nvidia/i

const LOW_QUALITY_NEWS_PATTERNS = /概念股|涨停|个股|A股|美股|港股|股票|股价|shares jump|buys stake|fund buys|holdings|NASDAQ|NYSE|token|ETH|WLD|crypto|加密货币|行情|研报|机构预测|梳理|获奖|荣膺|直播预告|发布会预告|报名|活动预告|招聘|融资快讯|地方政治|lobbyist|FERC|cnBeta|同花顺|证券时报|获奖|会议|论坛|白皮书|company announcement/i

const GLOBAL_AI_NEWS_PATTERNS = /OpenAI|Google|Anthropic|Meta|Microsoft|Nvidia|DeepMind|xAI|Mistral|DeepSeek|Qwen|Gemini|Claude|GPT|Llama|agent|智能体|coding|code|多模态|multimodal|video generation|视频生成|robotics|机器人|大模型|AI 安全|安全法案|audit|审计|regulation|监管|copyright|版权|lawsuit|诉讼|subscription|订阅|data center|数据中心|energy|能源|cloud|云|chip|GPU|算力|model|模型|acquisition|并购|funding|融资|commercialization|商业化/i

const OFFICIAL_MAJOR_RELEASE_PATTERNS = /launch|release|introduc|announce|model|API|agent|coding|multimodal|video|robot|safety|alignment|compute|GPU|data center|partnership|acquisition|pricing|subscription|发布|推出|模型|智能体|多模态|视频|机器人|安全|对齐|算力|合作|并购|定价|订阅/i

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

    const lastMessage = messages[messages.length - 1]?.content || ''
    const detectedLang = detectLanguage(lastMessage)
    const needsSearch = /搜索|新闻|今日|今天|最新|recent|news|today|search/i.test(lastMessage)
    const recentMessages = Array.isArray(messages) ? messages.slice(-6) : []

    if (needsSearch) {
      const newsResults = await fetchLatestAINews(detectedLang)
      return streamTextResponse(formatNewsResponse(newsResults, detectedLang))
    }

    const systemMessage = {
      role: 'system',
      content: HELEN_SYSTEM_PROMPT
    }

    const allMessages = [systemMessage, ...recentMessages]

    const requestBody: any = {
      model: 'glm-4-flash',
      messages: allMessages,
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
        'site:reuters.com AI OpenAI OR Anthropic OR Google OR Meta when:1d',
        'site:bloomberg.com AI OpenAI OR Anthropic OR Nvidia when:1d',
        'site:ft.com AI OpenAI OR Anthropic OR Nvidia when:1d',
        'site:theinformation.com AI OpenAI OR Anthropic OR Meta when:1d',
        'site:theverge.com/ai AI OpenAI OR Google OR Anthropic OR Meta when:1d',
        'site:techcrunch.com/category/artificial-intelligence AI agent model when:1d',
        'site:venturebeat.com/ai AI agent model enterprise when:1d',
        'site:wired.com AI safety regulation model when:1d',
        'site:technologyreview.com AI model agent safety when:1d',
        'site:openai.com/news OpenAI model agent API when:1d',
        'site:anthropic.com/news Claude model agent safety when:1d',
        'site:deepmind.google/discover/blog Gemini model robotics when:1d',
        'site:ai.meta.com/blog Llama Meta AI model when:1d',
        'site:microsoft.ai AI model agent Copilot when:1d',
        'site:blogs.nvidia.com AI GPU data center model when:1d',
      ]
    : [
        'site:reuters.com AI OpenAI OR Anthropic OR Google OR Meta when:1d',
        'site:bloomberg.com AI OpenAI OR Anthropic OR Nvidia when:1d',
        'site:ft.com AI OpenAI OR Anthropic OR Nvidia when:1d',
        'site:theinformation.com AI OpenAI OR Anthropic OR Meta when:1d',
        'site:theverge.com/ai AI OpenAI OR Google OR Anthropic OR Meta when:1d',
        'site:techcrunch.com/category/artificial-intelligence AI agent model when:1d',
        'site:venturebeat.com/ai AI agent model enterprise when:1d',
        'site:wired.com AI safety regulation model when:1d',
        'site:technologyreview.com AI model agent safety when:1d',
        'site:openai.com/news OpenAI model agent API when:1d',
        'site:anthropic.com/news Claude model agent safety when:1d',
        'site:deepmind.google/discover/blog Gemini model robotics when:1d',
        'site:ai.meta.com/blog Llama Meta AI model when:1d',
        'site:microsoft.ai AI model agent Copilot when:1d',
        'site:blogs.nvidia.com AI GPU data center model when:1d',
      ]

  const settled = await Promise.allSettled(
    queries.map((query) => fetchGoogleNews(query, language))
  )

  const results = settled.flatMap((item) => item.status === 'fulfilled' ? item.value : [])
  const seen = new Set<string>()

  return results
    .filter(isFreshNews)
    .filter(isHighQualityAINews)
    .filter((item) => item.link && !item.link.includes('news.google.com'))
    .sort((a, b) => getNewsScore(b) - getNewsScore(a))
    .filter((item) => {
      const key = item.title.toLowerCase().replace(/\s+/g, ' ').trim()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 5)
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

  const parsed = itemMatches.map((item) => ({
    title: decodeXml(getXmlValue(item, 'title')).replace(/\s+-\s+[^-]+$/, '').trim(),
    source: decodeXml(getXmlValue(item, 'source')) || decodeXml(getXmlValue(item, 'title')).split(' - ').pop()?.trim() || 'Google News',
    publishedAt: decodeXml(getXmlValue(item, 'pubDate')),
    link: decodeXml(getXmlValue(item, 'link')),
  })).filter((item) => item.title && item.publishedAt)

  return Promise.all(parsed.map(async (item) => ({
    ...item,
    link: await resolveOriginalNewsLink(item.link),
  })))
}

function formatNewsResponse(results: NewsResult[], language: string) {
  if (results.length === 0) {
    return language === 'zh'
      ? '我刚刚联网查了，但没有拿到今天或近 36 小时内可核验的 AI 新闻结果。这个时候我宁可说没搜到，也不想拿旧新闻糊弄你。'
      : 'I searched live, but did not get verifiable AI news from today or the last 36 hours. I would rather say that than pad it with stale news.'
  }

  const selected = results.slice(0, 5)
  const expandedTo48Hours = selected.some((item) => !isTodayNews(item))

  const items = selected.slice(0, 3).map((item, index) => {
    const time = formatNewsTime(item.publishedAt, language)
    const judgment = getNewsJudgment(item.title, language)
    const importance = getNewsImportance(item.title, language)

    return language === 'zh'
      ? `${index + 1}. ${item.title}
来源：${item.source}
时间：${time}
链接：${item.link}
为什么重要：${importance}
Helen 看法：${judgment}`
      : `${index + 1}. ${item.title}
Source: ${item.source}
Time: ${time}
Link: ${item.link}
Why it matters: ${importance}
Helen's take: ${judgment}`
  })

  const prefix = language === 'zh'
    ? `我刚刚联网查了，只保留高质量来源里和全球 AI 动态相关的 ${items.length} 条${expandedTo48Hours ? '。今天足够硬的新闻不多，所以放宽到了过去 48 小时' : ''}：`
    : `I just searched live and kept ${items.length} items from higher-quality sources that matter for global AI${expandedTo48Hours ? '. There were not enough strong items from today, so I expanded to the last 48 hours' : ''}:`

  return `${prefix}\n\n${items.join('\n\n')}`
}

function getNewsImportance(title: string, language: string) {
  if (/model|模型|GPT|Claude|Gemini|Llama|DeepSeek|Qwen|Mistral|xAI/i.test(title)) {
    return language === 'zh'
      ? '模型能力或产品入口的变化，会直接影响开发者生态和应用迭代速度。'
      : 'Model or product-entry changes directly affect developer ecosystems and application iteration speed.'
  }

  if (/agent|智能体|coding|code|developer|编程|代码/i.test(title)) {
    return language === 'zh'
      ? 'Agent 和 coding 是 AI 最容易进入真实工作流的方向，影响会先在组织效率里显现。'
      : 'Agents and coding are among the fastest paths into real workflows, so the impact shows up in organizational efficiency first.'
  }

  if (/GPU|Nvidia|chip|data center|energy|cloud|AWS|Azure|芯片|算力|数据中心|能源|云/i.test(title)) {
    return language === 'zh'
      ? '算力、云和能源决定了下一轮模型竞争的成本结构，也会影响谁能持续训练和部署。'
      : 'Compute, cloud, and energy shape the cost structure of model competition and who can keep training and deploying.'
  }

  if (/law|audit|regulation|safety|copyright|lawsuit|policy|法案|审计|监管|安全|版权|诉讼|政策/i.test(title)) {
    return language === 'zh'
      ? '监管和审计会改变 AI 公司发布模型、承担责任和进入行业场景的方式。'
      : 'Regulation and audits change how AI companies release models, take responsibility, and enter regulated sectors.'
  }

  if (/subscription|pricing|commercialization|revenue|订阅|定价|商业化|收入/i.test(title)) {
    return language === 'zh'
      ? '商业化模式决定 AI 能不能从尝鲜工具变成可持续产品。'
      : 'Commercialization decides whether AI moves from novelty tools to sustainable products.'
  }

  if (/acquisition|acquire|merger|funding|partnership|并购|收购|融资|合作/i.test(title)) {
    return language === 'zh'
      ? '头部公司的资本和合作动作，往往会重新分配人才、算力和渠道。'
      : 'Capital and partnership moves by major players often redistribute talent, compute, and channels.'
  }

  return language === 'zh'
    ? '它值得保留，是因为可能影响模型、产品、算力、监管或商业格局中的一个关键变量。'
    : 'It is worth keeping because it may affect a key variable in models, products, compute, regulation, or the business landscape.'
}

function getNewsJudgment(title: string, language: string) {
  if (/agent|智能体|agents/i.test(title)) {
    return language === 'zh'
      ? '我会看它是不是真的进入工作流，而不只是换一个更热的名字。'
      : 'I would watch whether this actually enters workflows, not just whether it gets a hotter name.'
  }

  if (/safety|安全|监管|law|audit|risk|policy/i.test(title)) {
    return language === 'zh'
      ? '这类新闻说明 AI 已经从“能不能做”进入“谁来负责”的阶段。'
      : 'This is AI moving from “can we build it” to “who verifies and takes responsibility.”'
  }

  if (/chip|GPU|Nvidia|芯片|算力/i.test(title)) {
    return language === 'zh'
      ? '算力还是底层变量，但真正的分化会出现在谁能把算力变成可用产品。'
      : 'Compute is still the base variable, but the real gap is who can turn it into usable products.'
  }

  if (/data center|数据中心|energy|能源|cloud|AWS|Azure|Google Cloud/i.test(title)) {
    return language === 'zh'
      ? 'AI 的竞争越来越像基础设施竞争，电力、云和数据中心会变成更硬的约束。'
      : 'AI competition is becoming infrastructure competition; power, cloud, and data centers are harder constraints now.'
  }

  if (/subscription|pricing|订阅|定价|commercialization|商业化/i.test(title)) {
    return language === 'zh'
      ? '这说明 AI 产品开始进入付费分层，关键不是能不能收费，而是用户会不会长期续费。'
      : 'This points to paid tiers for AI products; the real question is whether users keep paying over time.'
  }

  if (/acquisition|acquire|merger|并购|收购|funding|融资/i.test(title)) {
    return language === 'zh'
      ? '资本动作本身不是重点，重点是它会把人才、算力和产品节奏重新排布。'
      : 'The capital move itself is not the point; it reshuffles talent, compute, and product pace.'
  }

  if (/coding|code|developer|编程|代码/i.test(title)) {
    return language === 'zh'
      ? 'Coding 是智能体最容易先落地的场景，因为结果能被验证，工作流也足够高频。'
      : 'Coding is one of the first real agent workflows because outputs are testable and usage is frequent.'
  }

  if (/video|multimodal|多模态|视频|robot|robotics|机器人/i.test(title)) {
    return language === 'zh'
      ? '这类进展值得看，因为它会把 AI 从文字窗口推向更真实的产品形态。'
      : 'This matters because it pushes AI beyond the text box into more concrete product forms.'
  }

  if (/OpenAI|Google|Anthropic|Meta|DeepSeek|Gemini|Claude|GPT/i.test(title)) {
    return language === 'zh'
      ? '头部公司的动作不只看声量，要看它有没有改变用户入口和行业节奏。'
      : 'For big labs, I care less about the noise and more about whether they shift user entry points and industry tempo.'
  }

  return language === 'zh'
    ? '这条如果要保留，重点应该是它是否改变模型、产品、算力、监管或商业格局。'
    : 'I would keep this only if it changes models, products, compute, regulation, or the business landscape.'
}

function formatNewsTime(value: string, language: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai',
  })
}

function isFreshNews(item: NewsResult) {
  const published = Date.parse(item.publishedAt)
  if (Number.isNaN(published)) return false

  const ageMs = Date.now() - published
  return ageMs >= 0 && ageMs <= 48 * 60 * 60 * 1000
}

function isTodayNews(item: NewsResult) {
  const published = new Date(item.publishedAt)
  if (Number.isNaN(published.getTime())) return false

  const now = new Date()
  return published.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }) ===
    now.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
}

function isHighQualityAINews(item: NewsResult) {
  const source = item.source.toLowerCase()
  const title = item.title
  const combined = `${item.title} ${item.source}`

  if (LOW_QUALITY_NEWS_PATTERNS.test(combined)) return false
  if (!GLOBAL_AI_NEWS_PATTERNS.test(combined)) return false

  const trusted = TRUSTED_NEWS_SOURCES.some((trustedSource) => source.includes(trustedSource))
  if (!trusted) return false

  if (OFFICIAL_NEWS_SOURCES.test(source)) {
    return OFFICIAL_MAJOR_RELEASE_PATTERNS.test(combined)
  }

  return true
}

function getNewsScore(item: NewsResult) {
  const combined = `${item.title} ${item.source}`
  let score = 0

  if (/reuters|bloomberg|financial times|ft|the information/i.test(combined)) score += 5
  if (/the verge|techcrunch|wired|mit technology review|venturebeat/i.test(combined)) score += 4
  if (OFFICIAL_NEWS_SOURCES.test(combined)) score += 3
  if (/OpenAI|Google|Anthropic|Meta|Microsoft|Nvidia|DeepMind|xAI|Mistral|DeepSeek|Qwen/i.test(combined)) score += 3
  if (/law|法案|audit|审计|regulation|监管|copyright|版权|lawsuit|诉讼|subscription|订阅|agent|智能体|coding|多模态|multimodal|video|robotics|safety|安全|GPU|data center|数据中心|energy|能源/i.test(combined)) score += 3
  if (/exclusive|report|报道|专访|interview/i.test(combined)) score += 1

  const published = Date.parse(item.publishedAt)
  if (!Number.isNaN(published)) {
    const ageHours = (Date.now() - published) / (60 * 60 * 1000)
    score += Math.max(0, 3 - ageHours / 12)
  }

  return score
}

async function resolveOriginalNewsLink(link: string) {
  if (!link || !link.includes('news.google.com')) return link

  try {
    const response = await fetch(link, {
      method: 'HEAD',
      redirect: 'follow',
    })

    if (response.url && !response.url.includes('news.google.com')) {
      return response.url
    }
  } catch (error) {
    console.error('Failed to resolve news link:', error)
  }

  return ''
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

function streamTextResponse(content: string) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
      )
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
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
