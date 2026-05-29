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
  quality: string // 必看/值得关注/可选
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

// ==================== News Ranking System ====================

/**
 * 新闻评分系统
 * 按7个维度评分，总分0-100
 */
function rankNews(title: string, snippet: string): { score: number; quality: string } {
  const text = `${title} ${snippet}`.toLowerCase()
  let score = 0
  const details: string[] = []

  // 1. 技术突破 (+20)
  if (/突破|创新|首次|突破性|颠覆|革命性|里程碑|sota|state-of-art/i.test(text)) {
    score += 20
    details.push('技术突破')
  }

  // 2. 模型发布 (+25)
  if (/模型发布|新模型|开源|发布模型|模型升级|新版|v\d+|gpt-|claude|gemini|llama|qwen|通义|文心|豆包|kimi|deepseek|智谱|minimax/i.test(text)) {
    score += 25
    details.push('模型发布')
  }

  // 3. AI基础设施 (+20)
  if (/算力|芯片|gpu|tpu|数据中心|infra|基础设施|昇腾|nvidia|amd|英特尔|训练集群|推理加速/i.test(text)) {
    score += 20
    details.push('AI基础设施')
  }

  // 4. AI产业格局 (+15)
  if (/收购|合并|战略合作|竞争格局|市场份额|行业报告|产业格局|生态|布局/i.test(text)) {
    score += 15
    details.push('AI产业格局')
  }

  // 5. AI人才生态 (+10)
  if (/人才|教育|培训|招聘|培养|高校|研究|论文|学术|科学家|工程师/i.test(text)) {
    score += 10
    details.push('AI人才生态')
  }

  // 6. AI应用落地 (+15)
  if (/应用落地|场景|解决方案|行业应用|企业服务|b端|落地|部署|商业化/i.test(text)) {
    score += 15
    details.push('AI应用落地')
  }

  // 7. 政策监管影响 (+15)
  if (/政策|监管|备案|审计|法规|安全|合规|政府|审查|限制|规范/i.test(text)) {
    score += 15
    details.push('政策监管影响')
  }

  // Agent相关 (+18)
  if (/agent|智能体|自主|自动化助手|ai助手/i.test(text)) {
    score += 18
    details.push('Agent')
  }

  // 多模态 (+12)
  if (/多模态|视频生成|图像生成|语音|视觉|aigc/i.test(text)) {
    score += 12
    details.push('多模态')
  }

  // 降低分数的内容
  if (/股价|涨停|跌停|市值|融资|估值|投资|基金|证券/i.test(text)) {
    score -= 30
  }
  if (/营销|推广|广告|发布会预告|活动预告|直播|报名/i.test(text)) {
    score -= 25
  }
  if (/加密货币|比特币|eth|token|区块链|nft/i.test(text)) {
    score -= 40
  }
  if (/会议|论坛|峰会|白皮书|获奖|荣膺/i.test(text)) {
    score -= 15
  }

  // 确保分数在0-100范围内
  score = Math.max(0, Math.min(100, score))

  // 判断质量等级
  let quality = '可选'
  if (score >= 80) {
    quality = '必看'
  } else if (score >= 60) {
    quality = '值得关注'
  } else if (score < 40) {
    quality = '过滤'
  }

  return { score, quality }
}

/**
 * 过滤低质量新闻
 */
function shouldFilterNews(title: string, snippet: string): boolean {
  const text = `${title} ${snippet}`.toLowerCase()

  // 过滤股价波动
  if (/股价|涨停|跌停|市值|持仓|证券|股票/i.test(text)) {
    return true
  }

  // 过滤普通融资
  if (/融资|获投|完成.*轮|估值|投资|天使轮|a轮|pre-a/i.test(text)) {
    return true
  }

  // 过滤营销稿
  if (/重磅|震惊|曝光|揭秘|必看|首发|独家|震撼/i.test(text)) {
    return true
  }

  // 过滤PR稿
  if (/荣膺|获奖|荣获|被评为|入选|标杆|典范/i.test(text)) {
    return true
  }

  // 过滤会议通稿
  if (/大会|会议|论坛|峰会|博览会|展览|圆桌/i.test(text)) {
    return true
  }

  // 过滤加密货币
  if (/比特币|加密货币|区块链|代币|eth|nft|挖矿/i.test(text)) {
    return true
  }

  // 过滤与AI无关的消费电子
  if (/手机|汽车|比亚迪|oppo|vivo|小米|华为手机|特斯拉|电动车/i.test(text)) {
    if (!/ai|智能|自动驾驶|语音助手/i.test(text)) {
      return true
    }
  }

  return false
}

/**
 * 选择Top新闻
 */
function selectTopNews(items: NewsItem[], count: number = 5): NewsItem[] {
  // 按分数排序
  const sorted = items
    .filter(item => item.quality !== '过滤')
    .sort((a, b) => b.score - a.score)
  
  // 取前count条
  return sorted.slice(0, count)
}

// ==================== 原有代码保持不变 ====================

const HIGH_VALUE_AI_PATTERNS = /大模型|模型|Agent|智能体|多模态|视频生成|机器人|AI Infra|Infra|算力|芯片|GPU|数据中心|开源|国产模型|DeepSeek|通义|千问|Qwen|文心|豆包|混元|智谱|Kimi|月之暗面|MiniMax|MiniCPM|华为|昇腾|阿里|百度|腾讯|字节|OpenAI|Anthropic|Gemini|Claude|Llama|Coding|代码|政策|监管|备案|应用落地|产业落地/i
const STRONG_AI_PATTERNS = /大模型|模型发布|开源模型|国产模型|Agent|智能体|多模态|视频生成|机器人|具身|AI Infra|算力|芯片|GPU|数据中心|DeepSeek|通义|千问|Qwen|文心|豆包|混元|智谱|Kimi|月之暗面|MiniMax|MiniCPM|OpenAI|Anthropic|Gemini|Claude|Llama|Coding|代码|政策|监管|备案|审计|安全/i
const LOW_VALUE_AI_PATTERNS = /股价|股票|概念股|涨停|融资小新闻|估值|持仓|基金|获奖|荣膺|大会|会议|论坛|峰会|白皮书|营销|发布会预告|活动预告|直播预告|报名|招聘|财报|证券|研报|转载|标题党|加密货币|token|ETH|WLD|数百万|天使轮|A轮|Pre-A|首发|上市|起售价|售价|手机|汽车|比亚迪|OPPO|Reno|摄影|消费电子|家电|评测|导购|种草|科氪|产品矩阵|工作站|8点1氪|早报|晚报|日报|周报/i

// ... (其余代码保持不变，直到scoreNews函数)

function scoreNews(text: string): number {
  const ranked = rankNews(text, '')
  return ranked.score
}

function isHighValueAI(result: SearchResult): boolean {
  const text = `${result.title} ${result.content}`.toLowerCase()
  
  if (LOW_VALUE_AI_PATTERNS.test(text)) return false
  if (STRONG_AI_PATTERNS.test(text)) return true
  if (HIGH_VALUE_AI_PATTERNS.test(text)) return true
  
  return false
}

function isRecentNews(result: SearchResult): boolean {
  return true
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ''

    const intent = detectIntent(lastMessage)

    switch (intent.type) {
      case 'CHAT':
        return handleChatRequest(messages)
      case 'OPINION':
        return handleOpinionRequest(messages)
      case 'NEWS':
        return handleNewsRequest(lastMessage)
      case 'FACT_SEARCH':
        return handleFactSearchRequest(lastMessage)
      case 'WEBSITE':
        return handleWebsiteRequest(lastMessage)
      default:
        return handleChatRequest(messages)
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

function detectIntent(query: string): IntentResult {
  const q = query.toLowerCase()
  
  if (/搜索|新闻|今日|今天|最新|recent|news|today/i.test(q)) {
    return { type: 'NEWS', confidence: 0.9, agent: 'NewsAgent' }
  }
  
  if (/什么时候|是否|真的|真的吗|有没有|是什么|谁|多少|哪个|哪些/i.test(q)) {
    return { type: 'FACT_SEARCH', confidence: 0.85, agent: 'FactSearchAgent' }
  }
  
  if (/怎么看|为什么|觉得|认为|观点|看法|意见/i.test(q)) {
    return { type: 'OPINION', confidence: 0.8, agent: 'OpinionAgent' }
  }
  
  if (/网站|官网|主页|打开|访问|browse|visit|open/i.test(q)) {
    return { type: 'WEBSITE', confidence: 0.75, agent: 'WebsiteAgent' }
  }
  
  return { type: 'CHAT', confidence: 0.7, agent: 'ChatAgent' }
}

async function handleNewsRequest(query: string) {
  const searchPrompt = `
你是一个AI新闻搜索助手。请搜索最新的AI新闻。

要求：
1. 只搜索真实的AI新闻
2. 不要编造新闻
3. 不要编造数据
4. 不要编造产品名

格式：
今天AI热点（X月X日）

1. 标题 - 来源 [质量等级]
一句话说明重要性。
Helen观点：一句话判断。

⚠️ 以上信息来自AI搜索，请访问量子位、机器之心、36氪验证详情。
`

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-4',
      messages: [
        { role: 'system', content: searchPrompt },
        { role: 'user', content: query }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
      tools: [{ type: 'web_search', web_search: { enable: true } }]
    }),
  })

  if (!response.ok) {
    return createTextResponse('搜索服务暂时不可用，请访问量子位、机器之心、36氪查看最新AI资讯。')
  }

  return createStreamResponse(response)
}

async function handleFactSearchRequest(query: string) {
  return createTextResponse('我暂时无法验证这个事实。建议你访问官方网站或权威媒体查询。')
}

async function handleOpinionRequest(messages: Message[]) {
  return handleChatRequest(messages)
}

async function handleWebsiteRequest(query: string) {
  return createTextResponse('我暂时无法打开网站。请在浏览器中手动访问。')
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
