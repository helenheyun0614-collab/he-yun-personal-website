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

interface SearchResult {
  title: string
  source: string
  publishedTime: string
  url: string
  content: string
}

interface VerifiedPage {
  title: string
  publishedTime: string
  text: string
  domain: string
}

type IntentType = 'CHAT' | 'OPINION' | 'NEWS' | 'FACT_SEARCH' | 'WEBSITE'

interface IntentResult {
  type: IntentType
  confidence: number
  agent: string
}

const CHINA_AI_FEEDS: NewsFeed[] = [
  { source: '36氪', url: 'https://www.36kr.com/feed' },
  { source: '雷峰网', url: 'https://www.leiphone.com/feed' },
  { source: '钛媒体', url: 'https://www.tmtpost.com/feed' },
]

const SOURCE_DOMAINS: Record<string, string[]> = {
  '36氪': ['36kr.com'],
  '雷峰网': ['leiphone.com'],
  '钛媒体': ['tmtpost.com'],
}

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

const FACT_SEARCH_PROMPT = `
你是Helen网站里的事实搜索Agent，只处理需要实时核验的事实问题。

要求：
- 只能基于已经验证过的搜索结果回答
- 给出来源名称、发布时间和链接
- 如果搜索结果不足，不要猜
- 不要回答成新闻汇总
- 禁止补充搜索结果中没有的数据、产品名、发布时间、来源、人名关系
- 所有数字必须来自已验证原文；没有出现在原文里的数字不能写
- 中文简洁回答，最多3段
- 不要说"作为AI"
`

const WEBSITE_AGENT_PROMPT = `
你是Helen网站里的Website Agent，负责看网站、交互、内容结构和表达问题。

回答方式：
- 直接指出问题和改法
- 优先关注移动端、首屏、留白、信息密度、交互路径和Helen个人表达
- 不要写成泛泛的网站优化报告
- 最多3段
`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ''
    const intent = classifyIntent(lastMessage)

    console.log(`Detected Intent: ${intent.type}`)
    console.log(`Confidence: ${intent.confidence.toFixed(2)}`)
    console.log(`Selected Agent: ${intent.agent}`)

    if (intent.type === 'NEWS') {
      return handleNewsRequest()
    }

    if (intent.type === 'FACT_SEARCH') {
      return handleFactSearchRequest(lastMessage)
    }

    if (intent.type === 'WEBSITE') {
      return handleChatRequest(messages, WEBSITE_AGENT_PROMPT, 400)
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

async function handleNewsRequest() {
  const items = await fetchChinaAINews()
  return createTextResponse(formatChinaNews(items))
}

function classifyIntent(input: string): IntentResult {
  const text = input.trim()
  if (!text) return { type: 'CHAT', confidence: 0.9, agent: 'Helen Chat Agent' }

  if (isWebsiteIntent(text)) {
    return { type: 'WEBSITE', confidence: 0.92, agent: 'Website Agent' }
  }

  if (isNewsIntent(text)) {
    return { type: 'NEWS', confidence: 0.95, agent: 'News Agent' }
  }

  if (isOpinionIntent(text)) {
    return { type: 'OPINION', confidence: 0.95, agent: 'Helen Chat Agent' }
  }

  if (isFactSearchIntent(text)) {
    return { type: 'FACT_SEARCH', confidence: 0.9, agent: 'Search Agent' }
  }

  return { type: 'CHAT', confidence: 0.85, agent: 'Helen Chat Agent' }
}

function isNewsIntent(text: string) {
  if (/(新闻|热点|资讯|动态|汇总|日报|周报).*(AI|人工智能|大模型|科技|行业)/i.test(text)) return true
  if (/(AI|人工智能|大模型|科技|行业).*(新闻|热点|资讯|动态|汇总|日报|周报)/i.test(text)) return true
  if (/搜索.*(AI|人工智能|大模型).*(新闻|热点|资讯|动态)/i.test(text)) return true
  if (/\b(search|find|look up)\b.*\b(today'?s?|latest|recent)\b.*\b(ai|artificial intelligence)\b.*\b(news|headlines)\b/i.test(text)) return true
  if (/\b(today'?s?|latest|recent)\b.*\b(ai|artificial intelligence)\b.*\b(news|headlines)\b/i.test(text)) return true

  return false
}

function isOpinionIntent(text: string) {
  if (/research taste|研究品味/i.test(text)) return true
  if (/Agent.*(员工|组织)|智能体.*(员工|组织)|(员工|组织).*Agent|(员工|组织).*智能体/i.test(text)) return true
  if (/AGI.*(先|首先|最先).*(改变|影响)|AGI.*会.*改变什么/i.test(text)) return true
  if (/(为什么|为何|怎么看|如何看待|更像|会不会|是不是|重要|关系|意味着).*(AI|AGI|Agent|智能体|大模型|research|研究|大学生|人类|组织|人才)/i.test(text)) return true
  if (/(AI|AGI|Agent|智能体|大模型|research|研究|大学生|人类|组织|人才).*(为什么|怎么看|如何看待|更像|会不会|是不是|重要|关系|意味着)/i.test(text)) return true

  return false
}

function isFactSearchIntent(text: string) {
  if (/(新闻|热点|资讯|动态|汇总)/i.test(text)) return false
  if (/(什么时候|哪天|几号|参数|规模|多少|最新融资|融资额|估值|发布了吗|发布了没|是谁|谁是|current|latest|when|how many|parameter)/i.test(text)) return true
  if (/搜索|查一下|查查|帮我查|联网查|核实|验证|求证|look up|search|verify/i.test(text)) return true

  return false
}

function isWebsiteIntent(text: string) {
  if (/https?:\/\/|www\./i.test(text) && /(网站|网页|页面|前端|交互|优化|看看|评价|问题)/i.test(text)) return true
  if (/(网站|网页|页面|前端|交互|首屏|移动端|手机端|电脑端).*(优化|看看|改|调整|问题|建议)/i.test(text)) return true
  if (/(帮我看看|看看).*(网站|网页|页面|前端)/i.test(text)) return true

  return false
}

async function handleFactSearchRequest(query: string) {
  const searchResults = await searchFacts(query)

  if (searchResults.length === 0) {
    return createTextResponse('这个问题需要实时核验，但当前站点还没有配置可靠的事实搜索 API。我不会用模型记忆硬猜；要把这个 Search Agent 真正跑起来，需要接 Tavily、Bing Search 或 SerpAPI 这类能返回原文链接的搜索服务。')
  }

  const sourceContext = searchResults.map((result, index) => {
    return `${index + 1}. ${result.title}
来源：${result.source}
发布时间：${formatNewsTime(result.publishedTime)}
链接：${result.url}
摘要：${result.content}`
  }).join('\n\n')

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-4',
      messages: [
        { role: 'system', content: FACT_SEARCH_PROMPT },
        { role: 'user', content: `问题：${query}\n\n可用搜索结果：\n${sourceContext}` }
      ],
      stream: true,
      temperature: 0.2,
      max_tokens: 600,
    }),
  })

  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return createStreamResponse(response)
}

async function searchFacts(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return []

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        max_results: 5,
        include_answer: false,
        include_raw_content: false,
      }),
    })

    if (!response.ok) return []

    const data = await response.json()
    const results = Array.isArray(data.results) ? data.results : []

    const candidates = results
      .map((result: any) => ({
        title: cleanText(String(result.title || '')),
        source: getDomainName(String(result.url || '')),
        publishedTime: cleanText(String(result.published_date || result.publishedTime || '')),
        url: String(result.url || ''),
        content: cleanText(String(result.content || '')),
      }))
      .filter((result: SearchResult) => result.title && result.url && result.content)
      .slice(0, 8)

    return verifySearchResults(candidates)
  } catch (error) {
    console.error('Fact search failed:', error)
    return []
  }
}

async function handleChatRequest(messages: Message[], extraSystemPrompt?: string, maxTokens = 250) {
  const recentMessages = Array.isArray(messages) ? messages.slice(-6) : []
  const systemMessages: Message[] = [
    { role: 'system', content: HELEN_SYSTEM_PROMPT },
  ]

  if (extraSystemPrompt) {
    systemMessages.push({ role: 'system', content: extraSystemPrompt })
  }
  
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-4',
      messages: [
        ...systemMessages,
        ...recentMessages
      ],
      stream: true,
      temperature: 0.75,
      max_tokens: maxTokens,
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

  const candidates = settled
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
    .slice(0, 10)

  const verified = await verifyNewsItems(candidates)
  return verified.slice(0, 5)
}

async function fetchNewsFeed(feed: NewsFeed): Promise<NewsItem[]> {
  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HelenWebsite/1.0)',
      },
      signal: AbortSignal.timeout(7000),
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

async function verifyNewsItems(items: NewsItem[]): Promise<NewsItem[]> {
  const settled = await Promise.allSettled(items.map(async (item) => {
    const verifiedPage = await verifySourcePage(item.link, item.source, item.title)
    if (!verifiedPage) return null

    const publishedTime = item.publishedTime || verifiedPage.publishedTime
    if (!publishedTime || Number.isNaN(Date.parse(publishedTime))) return null

    return {
      ...item,
      title: sanitizeVerifiedText(item.title, verifiedPage.text),
      snippet: sanitizeVerifiedText(item.snippet, verifiedPage.text),
      publishedTime,
    }
  }))

  return settled
    .flatMap((result) => result.status === 'fulfilled' && result.value ? [result.value] : [])
}

async function verifySearchResults(results: SearchResult[]): Promise<SearchResult[]> {
  const settled = await Promise.allSettled(results.map(async (result) => {
    const verifiedPage = await verifySourcePage(result.url, result.source, result.title)
    if (!verifiedPage) return null

    const publishedTime = result.publishedTime || verifiedPage.publishedTime
    if (!publishedTime || Number.isNaN(Date.parse(publishedTime))) return null

    return {
      ...result,
      title: sanitizeVerifiedText(result.title, verifiedPage.text),
      source: verifiedPage.domain,
      publishedTime,
      content: sanitizeVerifiedText(result.content, verifiedPage.text),
    }
  }))

  return settled
    .flatMap((result) => result.status === 'fulfilled' && result.value ? [result.value] : [])
    .slice(0, 5)
}

async function verifySourcePage(url: string, expectedSource: string, expectedTitle: string): Promise<VerifiedPage | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null

  const domain = getDomainName(url)
  if (!domainMatchesSource(domain, expectedSource)) {
    console.log(`Invalid search result: source mismatch (${expectedSource} vs ${domain})`)
    return null
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HelenWebsite/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      console.log(`Invalid search result: URL not accessible (${url})`)
      return null
    }

    const html = await response.text()
    const text = cleanText(html)
    const pageTitle = extractPageTitle(html)
    const publishedTime = extractPublishedTime(html)

    if (!publishedTime) {
      console.log(`Invalid search result: missing published time (${url})`)
      return null
    }

    if (!titleMatchesSource(expectedTitle, pageTitle, text)) {
      console.log(`Invalid search result: title mismatch (${expectedTitle})`)
      return null
    }

    return {
      title: pageTitle || expectedTitle,
      publishedTime,
      text,
      domain,
    }
  } catch (error) {
    console.error(`Invalid search result: verification failed (${url})`, error)
    return null
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

function getDomainName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function domainMatchesSource(domain: string, source: string) {
  if (!domain) return false

  const expectedDomains = SOURCE_DOMAINS[source]
  if (expectedDomains) {
    return expectedDomains.some((expectedDomain) => domain === expectedDomain || domain.endsWith(`.${expectedDomain}`))
  }

  const normalizedSource = source.replace(/^www\./, '').toLowerCase()
  return domain === normalizedSource || domain.endsWith(`.${normalizedSource}`)
}

function extractPageTitle(html: string) {
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1]
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]

  return cleanText(ogTitle || h1 || title || '')
}

function extractPublishedTime(html: string) {
  const patterns = [
    /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']pubdate["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']publishdate["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']date["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /"datePublished"\s*:\s*"([^"]+)"/i,
    /"pubDate"\s*:\s*"([^"]+)"/i,
    /<time[^>]+datetime=["']([^"']+)["'][^>]*>/i,
  ]

  for (const pattern of patterns) {
    const value = cleanText(pattern.exec(html)?.[1] || '')
    if (value && !Number.isNaN(Date.parse(value))) return value
  }

  const cnDate = cleanText(html.match(/(\d{4}[年/-]\d{1,2}[月/-]\d{1,2}日?(?:\s+\d{1,2}:\d{2})?)/)?.[1] || '')
  if (cnDate) {
    const normalized = cnDate
      .replace('年', '-')
      .replace('月', '-')
      .replace('日', '')
      .replace(/\//g, '-')

    if (!Number.isNaN(Date.parse(normalized))) return normalized
  }

  return ''
}

function titleMatchesSource(expectedTitle: string, pageTitle: string, pageText: string) {
  const expectedKey = normalizeNewsKey(expectedTitle)
  const pageTitleKey = normalizeNewsKey(pageTitle)
  const pageTextKey = normalizeNewsKey(pageText)

  if (!expectedKey || expectedKey.length < 6) return false
  if (pageTitleKey.includes(expectedKey) || expectedKey.includes(pageTitleKey)) return true
  if (pageTextKey.includes(expectedKey)) return true

  const tokens = extractTitleTokens(expectedTitle)
  if (tokens.length === 0) return false

  const matched = tokens.filter((token) => pageTitle.includes(token) || pageText.includes(token))
  return matched.length / tokens.length >= 0.6
}

function extractTitleTokens(title: string) {
  const chineseTokens = title.match(/[\u4e00-\u9fa5]{2,}/g) || []
  const englishTokens = title.match(/[A-Za-z][A-Za-z0-9.-]{2,}/g) || []

  return [...chineseTokens, ...englishTokens]
    .flatMap((token) => token.length > 8 && /[\u4e00-\u9fa5]/.test(token) ? token.match(/.{2,6}/g) || [] : [token])
    .filter((token) => token.length >= 2)
    .slice(0, 12)
}

function sanitizeVerifiedText(value: string, sourceText: string) {
  return sanitizeProductNamesAgainstPage(
    sanitizeNumbersAgainstPage(value, sourceText),
    sourceText
  )
}

function sanitizeNumbersAgainstPage(value: string, sourceText: string) {
  return value.replace(/\d+(?:\.\d+)?\s*(?:%|％|倍|万亿|亿|万|美元|人民币|元|个|条|款|B|M|T)?/gi, (numberText) => {
    return sourceText.includes(numberText.trim()) ? numberText : ''
  }).replace(/\s+/g, ' ').trim()
}

function sanitizeProductNamesAgainstPage(value: string, sourceText: string) {
  return extractProductNames(value).reduce((current, productName) => {
    if (sourceText.includes(productName)) return current
    return current.split(productName).join('')
  }, value).replace(/\s+/g, ' ').trim()
}

function extractProductNames(value: string) {
  const names = value.match(/\b[A-Z][A-Za-z0-9.-]*(?:\s+[A-Z0-9][A-Za-z0-9.-]*){0,3}\b/g) || []

  return Array.from(new Set(names))
    .filter((name) => !/^(AI|API|AGI|GPU|CEO|CTO|CFO|USD|GPT)$/.test(name))
    .filter((name) => /[A-Z]/.test(name) && /[a-z0-9]/.test(name))
    .sort((a, b) => b.length - a.length)
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
