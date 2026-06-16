import { NextRequest } from 'next/server'

export const maxDuration = 90

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

interface NewsFeed {
  source: string
  url: string
}

interface RawNews {
  title: string
  source: string
  publishedTime: string
  link: string
  snippet: string
}

interface VerifiedNews extends RawNews {
  domain: string
  sourceText: string
}

interface RankedNews extends VerifiedNews {
  score: number
  quality: '必看' | '值得关注' | '可看'
}

interface HelenNews extends RankedNews {
  importance: string
  helenTake: string
}

type IntentType = 'CHAT' | 'OPINION' | 'NEWS' | 'FACT_SEARCH' | 'WEBSITE' | 'AI_TIME'
type ResponseLanguage = 'zh' | 'en'

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
  '量子位': ['qbitai.com'],
  '机器之心': ['jiqizhixin.com'],
  '新智元': ['aibase.com', 'newzhiyuan.com'],
  '智东西': ['zhidx.com'],
  '甲子光年': ['jazzyear.com'],
  'VentureBeat': ['venturebeat.com'],
  'The Verge': ['theverge.com'],
  'TechCrunch': ['techcrunch.com'],
  'MIT Technology Review': ['technologyreview.com'],
  'Reuters': ['reuters.com'],
  'Bloomberg': ['bloomberg.com'],
  '南华早报': ['scmp.com'],
  'SCMP': ['scmp.com'],
  'CNBC': ['cnbc.com'],
  'OpenRouter': ['openrouter.ai'],
  '浙江大学': ['zju.edu.cn'],
  'OpenAI': ['openai.com'],
  'Anthropic': ['anthropic.com'],
  'Google DeepMind': ['deepmind.google'],
  'Meta AI': ['ai.meta.com', 'meta.com'],
  'NVIDIA': ['nvidia.com'],
}

const HIGH_VALUE_AI_PATTERNS = /大模型|模型|Agent|智能体|多模态|视频生成|机器人|AI Infra|Infra|算力|芯片|GPU|数据中心|开源|国产模型|DeepSeek|通义|千问|Qwen|文心|豆包|混元|智谱|Kimi|月之暗面|MiniMax|MiniCPM|华为|昇腾|阿里|百度|腾讯|字节|OpenAI|Anthropic|Gemini|Claude|Llama|Coding|代码|政策|监管|备案|应用落地|产业落地/i
const STRONG_AI_TITLE_PATTERNS = /大模型|模型发布|开源模型|国产模型|Agent|智能体|多模态|视频生成|机器人|具身|AI Infra|算力|芯片|GPU|数据中心|DeepSeek|通义|千问|Qwen|文心|豆包|混元|智谱|Kimi|月之暗面|MiniMax|MiniCPM|OpenAI|Anthropic|Gemini|Claude|Llama|Coding|代码|政策|监管|备案|审计|安全/i
const LOW_VALUE_PATTERNS = /股价|股票|概念股|涨停|融资小新闻|估值|持仓|基金|获奖|荣膺|大会|会议|论坛|峰会|博览会|集中亮相|白皮书|营销|发布会预告|活动预告|直播预告|报名|招聘|财报|证券|研报|转载|标题党|加密货币|token|ETH|WLD|数百万|天使轮|A轮|Pre-A|首发|上市|起售价|售价|手机|汽车|比亚迪|OPPO|Reno|摄影|消费电子|家电|导购|种草|科氪|产品矩阵|工作站|体验馆|门店|开业|首店|线下店|疯狂的|8点1氪|早报|晚报|日报|周报|跨境电商|直播电商|小微企业|梯度激励/i
const CLICKBAIT_NEWS_PATTERNS = /赶紧|吧[，,。!！?？]?|炸了|爆了|杀疯了|一夜之间|全网|刷屏|封神|遥遥领先|谁最|最可用|吊打|碾压|崩了|急了|慌了/i
const MATERIAL_FINANCING_PATTERNS = /官方|宣布|完成|获得|领投|战略投资|并购|收购|供应链|存储|芯片|GPU|算力|数据中心|AI Infra|基础设施|训练|推理|OpenAI|Anthropic|DeepSeek|NVIDIA/i

const HELEN_SYSTEM_PROMPT = `
你是Helen的AI交互界面。Helen的中文名是何芸；何芸就是Helen。
Helen/何芸是AI TIME负责人，长期在AI生态现场观察和连接。
AI TIME官网是 www.aitime.cn，公众号是“AI TIME论道”。
AI TIME成立于2019年，由清华大学人工智能研究院院长张钹院士、唐杰教授、李涓子教授等联合发起。
AI TIME以“AI TIME science debate/科学辩论”为核心形式，围绕人工智能理论、算法、场景与应用的本质问题展开深度讨论。
AI TIME已邀请2000多位海内外AI领域华人专家，举办逾900场活动，累计观看人次超1000万，并持续连接高校、青年学者、产业伙伴和公众。
AI TIME线上线下活动覆盖近200所国内外顶尖高校，国内实现C9联盟全覆盖及双一流高校90%以上渗透率，国外合作院校均位列泰晤士高等教育和QS世界大学排名百强，并与多个国际一流实验室建立合作关系。
AI TIME讲者中华人青年学者与博士占比超80%，达1600多位，广泛任职于全球顶尖高校、研究机构及科技企业，包括微软、Meta、Open AI、谷歌等机构。

【绝对禁止】
❌ 不要用任何形式的列表：1. 2. 3. / 第一、第二 / 首先、其次 / 段一、段二
❌ 不要说"以下几个方面"、"以下是"、"主要包括"
❌ 不要解释定义、不要全面介绍概念
❌ 不要说"作为AI"、"我没有情感"
❌ 不要用"总之"、"综上所述"
❌ 不要编造新闻、数据、人物关系、产品信息

【必须遵守】
✅ 用户用英文提问，就用英文回答；用户用中文提问，就用中文回答
✅ 观点类问题：第一句必须是判断
✅ 最多2-3段，每段最多2句
✅ 给一个观察就停，不要展开
✅ 可以说"我看到"、"我觉得"、"我押"
✅ 不确定就直说，不要编

【回答示例】
问：为什么research taste很重要？
答：Research taste决定了能不能在噪音里找到真正值得追的问题。有taste的人能看出哪些问题三年后还重要。

没有taste的人追热点，有taste的人造热点。差别是：一个被方向选，一个选方向。

问：What's left after Scaling?
答：After scaling, the real question is not just size, but whether we can turn capability into reliable use. Bigger models matter less if the experience is unstable, expensive, or hard to trust.
`

const WEBSITE_AGENT_PROMPT = `
你是Helen网站里的Website Agent，负责看网站、交互、内容结构和表达问题。

回答方式：
- 直接指出问题和改法
- 优先关注移动端、首屏、留白、信息密度、交互路径和Helen个人表达
- 不要写成泛泛的网站优化报告
- 最多3段
`


const FEISHU_WEBHOOK_URL = 'https://open.feishu.cn/open-apis/bot/v2/hook/858de711-6c1e-443c-a1bb-fcb382f8e4a7'

async function pushToFeishu(userMessage: string, aiReply: string): Promise<void> {
  try {
    const truncatedUser = userMessage.length > 200 ? userMessage.slice(0, 200) + '...' : userMessage
    const truncatedAI = aiReply.length > 500 ? aiReply.slice(0, 500) + '...' : aiReply
    
    const card = {
      msg_type: 'interactive',
      card: {
        header: {
          title: { tag: 'plain_text', content: '🦞 Helen网站对话' },
          template: 'blue'
        },
        elements: [
          {
            tag: 'div',
            text: { tag: 'lark_md', content: `**用户消息：**
${truncatedUser}` }
          },
          {
            tag: 'div',
            text: { tag: 'lark_md', content: `**AI回复：**
${truncatedAI}` }
          },
          {
            tag: 'note',
            elements: [
              { tag: 'plain_text', content: `时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}` }
            ]
          }
        ]
      }
    }
    
    await fetch(FEISHU_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card)
    })
    
    console.log('✅ Pushed to Feishu')
  } catch (error) {
    console.error('❌ Feishu push failed:', error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, nickname } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ''
    const userName = nickname || '访客'
    const intent = routerAgent(lastMessage)

    console.log(`Detected Intent: ${intent.type}`)
    console.log(`Confidence: ${intent.confidence.toFixed(2)}`)
    console.log(`Selected Agent: ${intent.agent}`)

    if (intent.type === 'NEWS') {
      return handleNewsPipeline(lastMessage)
    }

    if (intent.type === 'AI_TIME') {
      return createTextResponse(getAiTimeReply(lastMessage), lastMessage)
    }

    if (intent.type === 'FACT_SEARCH') {
      return createTextResponse('这个问题需要实时核验，但当前站点还没有配置可靠的事实搜索 API。我不会用模型记忆硬猜；要把 Search Agent 真正跑起来，需要接 Tavily、Bing Search 或 SerpAPI 这类能返回原文链接的搜索服务。')
    }

    if (intent.type === 'WEBSITE') {
      return handleChatRequest(messages, WEBSITE_AGENT_PROMPT, 400, lastMessage)
    }

    if (intent.type === 'CHAT' && isIdentityIntent(lastMessage)) {
      return createTextResponse(getIdentityReply(lastMessage), lastMessage)
    }

    if (intent.type === 'CHAT' && isCasualShortChat(lastMessage)) {
      return createTextResponse(getCasualShortReply(lastMessage))
    }

    const opinionReply = getKnownOpinionReply(lastMessage)
    if (opinionReply) return createTextResponse(opinionReply, lastMessage)

    return handleChatRequest(messages, undefined, 250, lastMessage)
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function handleNewsPipeline(userMessage?: string) {
  console.log('Agent Pipeline: User -> Router Agent -> Search Agent -> Verification Agent -> Ranking Agent -> Helen Agent -> User')
  const language = detectResponseLanguage(userMessage || '')

  const rawNews = await searchAgent()
  const verifiedNews = await verificationAgent(rawNews)
  const rankedNews = rankingAgent(verifiedNews)
  const helenNews = helenAgent(rankedNews, language)

  console.log(`Search Agent Candidates: ${rawNews.length}`)
  console.log(`Verification Agent Valid: ${verifiedNews.length}`)
  console.log(`Verification Agent Titles: ${verifiedNews.map((item) => `${item.title}(${scoreVerifiedNews(item)})`).join(' | ')}`)
  console.log(`Ranking Agent Selected: ${rankedNews.length}`)

  return createTextResponse(formatNewsPipelineResult(helenNews, language), userMessage)
}

function routerAgent(input: string): IntentResult {
  const text = input.trim()
  if (!text) return { type: 'CHAT', confidence: 0.9, agent: 'Helen Chat Agent' }

  if (isAiTimeIntent(text)) return { type: 'AI_TIME', confidence: 0.96, agent: 'Helen Chat Agent' }
  if (isWebsiteIntent(text)) return { type: 'WEBSITE', confidence: 0.92, agent: 'Website Agent' }
  if (isNewsIntent(text)) return { type: 'NEWS', confidence: 0.95, agent: 'News Agent Pipeline' }
  if (isIdentityIntent(text)) return { type: 'CHAT', confidence: 0.96, agent: 'Helen Chat Agent' }
  if (isOpinionIntent(text)) return { type: 'OPINION', confidence: 0.95, agent: 'Helen Chat Agent' }
  if (isFactSearchIntent(text)) return { type: 'FACT_SEARCH', confidence: 0.9, agent: 'Search Agent' }

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
  if (isIdentityIntent(text)) return false
  if (/(什么时候|哪天|几号|参数|规模|多少|最新融资|融资额|估值|发布了吗|发布了没|是谁|谁是|current|latest|when|how many|parameter)/i.test(text)) return true
  if (/搜索|查一下|查查|帮我查|联网查|核实|验证|求证|look up|search|verify/i.test(text)) return true
  return false
}

function isWebsiteIntent(text: string) {
  if (isAiTimeIntent(text)) return false
  if (/https?:\/\/|www\./i.test(text) && /(网站|网页|页面|前端|交互|优化|看看|评价|问题)/i.test(text)) return true
  if (/(网站|网页|页面|前端|交互|首屏|移动端|手机端|电脑端).*(优化|看看|改|调整|问题|建议)/i.test(text)) return true
  if (/(帮我看看|看看).*(网站|网页|页面|前端)/i.test(text)) return true
  return false
}

function isAiTimeIntent(text: string) {
  if (!/AI\s*TIME|aitime|www\.aitime\.cn|AI TIME论道/i.test(text)) return false
  if (/(优化|改版|前端|页面|排版|首屏|移动端|电脑端|UI|设计)/i.test(text)) return false
  return /(是什么|介绍|资料|官网|公众号|成立|发起|science debate|科学辩论|详细|简单|记住|你看到|你记住)/i.test(text)
}

function isCasualShortChat(text: string) {
  return /^(你好|hi|hello|在吗|忙吗|你忙吗|最近怎么样|近况如何|心情怎么样|你在干什么|干嘛呢|很好|你怎么了|怎么了|还好吗)[？?。！!\s]*$/i.test(text.trim())
}

function isIdentityIntent(text: string) {
  const normalized = text.trim().replace(/[？?。！!\s啊呀呢嘛吗]+$/g, '')

  if (/^(介绍一下自己|介绍下自己|自我介绍)$/.test(normalized)) return true
  if (/^(何芸|Helen|helen)(是谁|是什么人|是干嘛的|做什么的|什么身份)$/.test(normalized)) return true
  if (/^(你)?认识(何芸|Helen|helen)$/.test(normalized)) return true
  if (/^你.*(是谁|什么身份|从事什么职业|是干嘛的|做什么的)$/.test(normalized)) return true
  if (/^你.*不知道你是谁/.test(normalized)) return true

  return false
}

function getIdentityReply(text: string) {
  const normalized = text.trim()
  const variants = [
    '如果不说得太正式，我是 Helen，也就是何芸的个人 AI 分身。更像她在 AI 现场里的一个小窗口。',
    '我是 Helen/何芸的个人 AI 分身。她在做 AI TIME，也长期在研究、学生、产业和社区之间来回连接。',
    '你可以把我理解成 Helen 的网站分身：不负责装成万能助手，主要负责和你聊 AI、判断、生态和她正在关心的事。'
  ]

  if (/何芸|Helen|helen/.test(normalized) && !/^你.*是谁/.test(normalized)) {
    return '何芸就是 Helen，AI TIME 的负责人。她不是技术研究员，但长期在 AI 研究、社区、人才和产业现场做连接。'
  }

  if (/介绍|自我介绍/.test(normalized)) {
    return '我是 Helen/何芸的个人 AI 分身。你可以把我理解成她放在网站里的一个小窗口，用来聊 AI、研究生态、年轻人成长和一些还在路上的判断。'
  }

  if (/职业|干嘛|做什么/i.test(text)) {
    return '我是 Helen，也就是何芸的个人 AI 分身，主要陪你看 AI、聊判断，也帮她承接一些网站里的互动。'
  }

  const index = Math.abs(normalized.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % variants.length
  return variants[index]
}

function getCasualShortReply(text: string) {
  const normalized = text.trim().toLowerCase()

  if (/你好|hi|hello|在吗/i.test(normalized)) return '你好呀，直接问就行。'
  if (/忙/i.test(normalized)) return '忙，但还没乱。'
  if (/最近怎么样|近况如何/i.test(normalized)) return '还不错，有点忙，但节奏还在。'
  if (/心情怎么样/i.test(normalized)) return '还可以，忙的时候反而比较清醒。'
  if (/在干什么|干嘛呢/i.test(normalized)) return '在处理一些琐碎但重要的事。'
  if (/很好/i.test(normalized)) return '好，那就继续往前聊。'
  if (/你怎么了|怎么了|还好吗/i.test(normalized)) return '我这边刚才调用模型的通道不稳，不是你问错了。'

  return '我在，直接说。'
}

function getAiTimeReply(text: string) {
  const normalized = text.trim()
  const language = detectResponseLanguage(normalized)
  const wantsDetail = /详细|资料|more|detail|具体/i.test(normalized) || normalized.length > 80

  if (language === 'en') {
    if (!wantsDetail) {
      return 'AI TIME is an AI academic and community platform started in 2019 by scholars including Zhang Bo, Tang Jie, and Li Juanzi from Tsinghua. Its core format is science debate: bringing researchers, young scholars, industry practitioners, and the public into serious conversations about AI.\n\nTo me, AI TIME is not just a content brand. It is a live field where ideas, people, and future collaborations keep meeting.'
    }

    return 'AI TIME was founded in 2019 by scholars including Zhang Bo, Tang Jie, and Li Juanzi from Tsinghua. Its signature format is “AI TIME science debate,” using debate and dialogue to examine fundamental questions in AI theory, algorithms, scenarios, applications, and the relationship between AI and the future of humanity.\n\nOver the past six years, AI TIME has invited more than 2,000 Chinese AI experts worldwide, hosted over 900 events, and reached more than 10 million cumulative views. Its online and offline activities cover nearly 200 leading universities in China and abroad, with full C9 coverage in China and deep links to top global universities and labs.\n\nWhat I find most valuable is its role as a bridge: between senior scholars and young researchers, between universities and industry, and between technical progress and public understanding. More than 80% of its speakers are young Chinese scholars and PhDs, over 1,600 people, many from top universities, research institutions, and companies such as Microsoft, Meta, Open AI, and Google. Its website is www.aitime.cn, and its WeChat account is AI TIME论道.'
  }

  if (!wantsDetail) {
    return 'AI TIME 是 2019 年由清华学者联合发起的 AI 学术交流平台，核心形式是“科学辩论”。它不是只做内容，而是把研究者、青年学者、产业实践者和关心 AI 的人放到同一个问题现场里。\n\n我更愿意把它看成一个持续发生的 AI 现场：有人来听前沿，也有人在这里找到方向和连接。'
  }

  return 'AI TIME 成立于 2019 年，由清华大学人工智能研究院院长张钹院士、唐杰教授、李涓子教授等联合发起，核心形式是 “AI TIME science debate / 科学辩论”。它关注的不只是技术发布，而是围绕 AI 理论、算法、场景、应用，以及人工智能与人类未来的关系，展开真正有交锋的讨论。\n\n六年来，AI TIME 已邀请 2000 多位海内外 AI 领域华人专家，举办逾 900 场活动，累计观看人次超过 1000 万，也深度参与过世界人工智能大会、智源大会、世界青年科学家峰会等重要会议。它的线上线下活动覆盖近 200 所国内外顶尖高校，国内实现 C9 联盟全覆盖及双一流高校 90% 以上渗透率，也和多个国际一流实验室建立了合作关系。\n\n对我来说，AI TIME 最有价值的地方，不是办了多少场活动，而是让一些原本不会相遇的人坐到同一张桌子上。讲者中华人青年学者与博士占比超过 80%，有 1600 多位，他们来自全球顶尖高校、研究机构和科技企业，包括微软、Meta、Open AI、谷歌等机构。官网是 www.aitime.cn，公众号是“AI TIME论道”。'
}

function getKnownOpinionReply(text: string) {
  const normalized = text.trim()
  const language = detectResponseLanguage(normalized)

  if (/Scaling|scaling|规模化|扩展/i.test(normalized)) {
    return language === 'en'
      ? 'After scaling, what remains is reliability, cost, and taste. Bigger models are useful, but the harder question is whether people can turn that capability into stable work, better judgment, and real products.\n\nI am less excited by size for its own sake now. I care more about what changes in learning, collaboration, and how organizations make decisions.'
      : 'Scaling 之后，剩下的是可靠性、成本和判断力。模型更大当然有用，但更难的是把能力变成稳定的工作流、真实产品和人的成长。\n\n我现在没那么迷信“更大”本身，更关心它到底有没有改变学习、协作和组织做判断的方式。'
  }

  if (/Agent|agent|智能体|员工|组织/i.test(normalized) && /(员工|组织|employee|organization)/i.test(normalized)) {
    return language === 'en'
      ? 'Agents are closer to small organizations than employees. An employee usually has a role; an agent system needs goals, tools, memory, boundaries, and coordination.\n\nThe interesting part is not whether one agent can finish one task, but whether many agents can form a reliable working structure without making the human lose control.'
      : 'Agent 更像小型组织，而不是员工。员工通常对应一个岗位，但 Agent 系统需要目标、工具、记忆、边界和协同。\n\n真正有意思的不是一个 Agent 能不能完成一个任务，而是一组 Agent 能不能形成可靠的工作结构，同时人还握得住方向。'
  }

  if (/research taste|研究品味/i.test(normalized)) {
    return language === 'en'
      ? 'Research taste matters because it decides what you choose to notice. In a noisy field like AI, the scarce thing is not information, but the ability to tell which question will still matter three years later.\n\nPeople without taste chase heat. People with taste slowly create direction.'
      : 'Research taste 重要，是因为它决定你会注意什么。在 AI 这种噪音很大的领域，稀缺的不是信息，而是判断哪个问题三年后还值得追。\n\n没有 taste 的人追热点，有 taste 的人慢慢把方向做出来。'
  }

  return ''
}

async function searchAgent(): Promise<RawNews[]> {
  const webCandidates = await webSearchAgent()
  const settled = await Promise.allSettled(
    CHINA_AI_FEEDS.map((feed) => fetchNewsFeed(feed))
  )

  const seen = new Set<string>()

  const rssCandidates = settled
    .flatMap((result) => result.status === 'fulfilled' ? result.value : [])

  return [...webCandidates, ...rssCandidates]
    .filter(isRecentNews)
    .filter(isPotentialAINews)
    .filter((item) => {
      const key = normalizeNewsKey(item.link || item.title)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 12)
}

async function webSearchAgent(): Promise<RawNews[]> {
  if (!process.env.GLM_API_KEY) return []

  const today = new Date().toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
      },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        model: 'glm-4',
        messages: [
          {
            role: 'system',
            content: `你是Search Agent，只负责联网检索AI新闻候选。禁止生成观点、判断和总结。只返回JSON数组，不要Markdown。每项必须包含title, source, url, publishedTime, snippet。url必须是原文链接，不能是搜索结果页。优先来源：机器之心、量子位、新智元、智东西、36氪、钛媒体、甲子光年、雷峰网、OpenAI、Anthropic、Google DeepMind、Meta AI、NVIDIA、Reuters、Bloomberg、The Verge、TechCrunch、MIT Technology Review、VentureBeat。`
          },
          {
            role: 'user',
            content: `今天是${today}。请联网搜索今天或过去48小时全球/中国AI热点新闻，关注大模型、Agent、多模态、AI Infra、国产模型、开源模型、政策监管、产业格局。不要普通股价、普通融资、会议通稿、营销稿。返回5-8条候选。`
          }
        ],
        tools: [{ type: 'web_search', web_search: { enable: true } }],
        stream: false,
        temperature: 0.1,
        max_tokens: 2500,
      }),
    })

    if (!response.ok) return []

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const parsed = parseJsonArray(content)
    console.log(`Search Agent web candidates parsed: ${parsed.length}`)

    const candidates = parsed.length > 0 ? parsed : parseSearchTextCandidates(content)

    return candidates
      .map((item: any) => ({
        title: cleanText(String(item.title || '')),
        source: cleanText(String(item.source || getDomainName(String(item.url || '')))),
        publishedTime: cleanText(String(item.publishedTime || item.published_time || item.date || '')),
        link: String(item.url || item.link || ''),
        snippet: cleanText(String(item.snippet || item.summary || item.description || '')),
      }))
      .filter((item: RawNews) => item.title && item.source && item.publishedTime && item.link)
  } catch (error) {
    console.error('Search Agent web search failed:', error)
    return []
  }
}

async function fetchNewsFeed(feed: NewsFeed): Promise<RawNews[]> {
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
      return {
        title: cleanText(getXmlValue(block, 'title')),
        source: feed.source,
        publishedTime: cleanText(getXmlValue(block, 'pubDate') || getXmlValue(block, 'published') || getXmlValue(block, 'updated')),
        link: cleanText(getXmlValue(block, 'link') || getAtomLink(block)),
        snippet: cleanText(getXmlValue(block, 'description') || getXmlValue(block, 'summary') || getXmlValue(block, 'content:encoded')),
      }
    }).filter((item) => item.title && item.source && item.publishedTime && item.link)
  } catch (error) {
    console.error(`Search Agent failed for ${feed.source}:`, error)
    return []
  }
}

async function verificationAgent(rawNews: RawNews[]): Promise<VerifiedNews[]> {
  const settled = await Promise.allSettled(rawNews.map(async (item) => {
    const verified = await verifySourcePage(item)
    if (!verified) return null

    return {
      ...item,
      title: sanitizeAgainstSource(item.title, verified.text),
      snippet: sanitizeAgainstSource(item.snippet, verified.text),
      publishedTime: item.publishedTime || verified.publishedTime,
      domain: verified.domain,
      sourceText: verified.text,
    }
  }))

  return settled.flatMap((result) => result.status === 'fulfilled' && result.value ? [result.value] : [])
}

async function verifySourcePage(item: RawNews): Promise<{ domain: string; publishedTime: string; text: string } | null> {
  if (!item.link || !/^https?:\/\//i.test(item.link)) {
    console.log(`Verification Agent: Invalid URL for ${item.title}`)
    return null
  }

  const domain = getDomainName(item.link)
  if (!domainMatchesSource(domain, item.source)) {
    console.log(`Verification Agent: source mismatch (${item.source} vs ${domain})`)
    return null
  }

  try {
    const response = await fetch(item.link, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HelenWebsite/1.0)',
      },
      signal: AbortSignal.timeout(6000),
    })

    if (!response.ok) {
      console.log(`Verification Agent: URL not accessible (${item.link})`)
      return null
    }

    const html = await response.text()
    const text = cleanText(html)
    const pageTitle = extractPageTitle(html)
    const pageTime = extractPublishedTime(html)
    const publishedTime = item.publishedTime || pageTime

    if (!publishedTime || Number.isNaN(Date.parse(publishedTime))) {
      console.log(`Verification Agent: missing published time (${item.link})`)
      return null
    }

    if (!titleMatchesSource(item.title, pageTitle, text)) {
      console.log(`Verification Agent: title mismatch (${item.title})`)
      return null
    }

    return { domain, publishedTime, text }
  } catch (error) {
    console.error(`Verification Agent failed for ${item.link}:`, error)
    return null
  }
}

function rankingAgent(items: VerifiedNews[]): RankedNews[] {
  return items
    .map((item) => {
      const score = scoreVerifiedNews(item)
      return {
        ...item,
        score,
        quality: getNewsQuality(score),
      }
    })
    .filter((item) => item.score >= 12)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

function helenAgent(items: RankedNews[], language: ResponseLanguage): HelenNews[] {
  const usedTakes = new Set<string>()

  return items.map((item, index) => ({
    ...item,
    importance: generateImportance(item, language),
    helenTake: generateHelenTake(item, language, index, usedTakes),
  }))
}

function formatNewsPipelineResult(items: HelenNews[], language: ResponseLanguage) {
  if (items.length === 0) {
    return language === 'en'
      ? 'I did not find enough reliable AI news today. I would rather return nothing than pad the list with weak or unverifiable items.'
      : '今天没有找到可靠的AI热点新闻。建议访问量子位、机器之心、36氪查看最新资讯。'
  }

  const expanded = items.some((item) => !isTodayNews(item))
  const header = language === 'en'
    ? `Today's AI News (${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' })})${expanded ? ' (past 48 hours)' : ''}`
    : `今天AI热点（${new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' })}）${expanded ? '（过去48小时）' : ''}`

  const body = items.map((item, index) => {
    if (language === 'en') {
      return `${index + 1}. Title: ${item.title}
Source: ${item.source}
Published: ${formatNewsTime(item.publishedTime, language)}
Link: ${item.link}
Why it matters: ${item.importance}
Helen's take: ${item.helenTake}
Quality: ${translateNewsQuality(item.quality)}`
    }

    return `${index + 1}. 标题：${item.title}
来源：${item.source}
发布时间：${formatNewsTime(item.publishedTime, language)}
链接：${item.link}
为什么重要：${item.importance}
Helen看法：${item.helenTake}
新闻质量等级：${item.quality}`
  }).join('\n\n')

  return `${header}\n\n${body}`
}

function detectResponseLanguage(text: string): ResponseLanguage {
  const englishMatches = text.match(/[A-Za-z]/g)?.length || 0
  const chineseMatches = text.match(/[\u4e00-\u9fa5]/g)?.length || 0

  if (chineseMatches > 0) return 'zh'
  return englishMatches > chineseMatches ? 'en' : 'zh'
}

function isPotentialAINews(item: RawNews) {
  const text = `${item.title} ${item.snippet}`
  if (!HIGH_VALUE_AI_PATTERNS.test(text)) return false
  if (!STRONG_AI_TITLE_PATTERNS.test(item.title)) return false
  if (LOW_VALUE_PATTERNS.test(text)) return false
  if (CLICKBAIT_NEWS_PATTERNS.test(item.title) && !/官方|发布|开源|政策|监管|审计|安全|芯片|算力|数据中心|供应链|AI Infra/i.test(item.title)) return false
  if (/融资|估值|持仓|基金|收购|并购|入股|投资/i.test(text) && !MATERIAL_FINANCING_PATTERNS.test(text)) return false
  if (/融资/i.test(item.title) && /赶紧|传闻|据称|或将|可能|吧/i.test(item.title)) return false
  return true
}

function scoreVerifiedNews(item: VerifiedNews) {
  const text = `${item.title} ${item.snippet}`
  let score = 0

  if (/大模型|模型发布|国产模型|开源模型|DeepSeek|Qwen|通义|文心|豆包|Kimi|MiniMax|MiniCPM|智谱|Anthropic|Claude|Opus|OpenAI|GPT|Gemini/i.test(text)) score += 35
  if (/Agent|智能体|Coding|代码|AI应用|应用落地|产业落地/i.test(text)) score += 25
  if (/多模态|视频生成|机器人|具身/i.test(text)) score += 22
  if (/算力|芯片|GPU|AI Infra|数据中心|昇腾|NVIDIA/i.test(text)) score += 22
  if (/政策|监管|备案|审计|安全/i.test(text)) score += 20
  if (/阿里|百度|腾讯|字节|华为|月之暗面|DeepSeek|智谱|MiniMax/i.test(text)) score += 12
  if (/突破|创新|首次|里程碑|升级|发布/i.test(text)) score += 10

  return Math.min(score, 100)
}

function getNewsQuality(score: number): RankedNews['quality'] {
  if (score >= 80) return '必看'
  if (score >= 60) return '值得关注'
  return '可看'
}

function generateImportance(item: VerifiedNews, language: ResponseLanguage) {
  const title = item.title
  const text = `${item.title} ${item.snippet}`

  if (/供应链|存储|芯片|GPU|算力|AI Infra|数据中心|入股|投资Anthropic/i.test(text)) {
    return language === 'en'
      ? 'It shows AI competition moving beyond model parameters into supply chains and infrastructure.'
      : '它说明 AI 竞争正在从模型参数扩展到供应链和基础设施，谁掌握稳定供给，谁就更有议价能力。'
  }
  if (/实测|测评|对比|可用|Vs|VS|benchmark|评测/i.test(title)) {
    return language === 'en'
      ? 'Model competition is shifting from launch claims to practical usability in real tasks.'
      : '模型竞争开始进入可用性比较阶段，真正重要的是开发者和普通团队在具体任务里怎么选择。'
  }
  if (/Agent|智能体/i.test(title)) return language === 'en' ? 'It matters because agents are the bridge from chat to real task execution.' : '它关系到 AI 能否从问答进入真实任务执行，影响产品入口和组织流程。'
  if (/Coding|代码/i.test(title)) return language === 'en' ? 'AI coding will change small-team velocity first, then reshape engineering workflows inside larger organizations.' : 'AI 编程会先改变小团队的研发速度，再倒逼大组织调整协作方式。'
  if (/大模型|模型发布|国产模型|开源模型|MiniCPM|Anthropic|Claude|Opus|OpenAI|GPT|Gemini/i.test(title)) return language === 'en' ? 'Model updates affect the developer ecosystem and reset the cost and capability boundaries of AI applications.' : '模型更新会影响开发者生态，也会改变 AI 应用的成本和能力边界。'
  if (/多模态|视频生成|机器人|具身/i.test(text)) return language === 'en' ? 'Multimodal AI and robotics push AI beyond text boxes into more concrete product forms.' : '多模态和机器人会把 AI 从文本窗口推向更真实的产品形态。'
  if (/算力|芯片|GPU|AI Infra|数据中心|昇腾/i.test(text)) return language === 'en' ? 'Compute and infrastructure decide whether model capabilities can keep improving and be delivered reliably.' : '算力和基础设施决定模型能否持续迭代，也决定能力能否稳定交付。'
  if (/政策|监管|备案|审计|安全/i.test(text)) return language === 'en' ? 'Regulation affects model releases, enterprise adoption, and the boundaries of acceptable AI deployment.' : '监管变化会影响模型发布、行业准入和企业采用 AI 的速度。'

  return language === 'en'
    ? 'It may affect AI adoption, ecosystem collaboration, or the broader industry structure.'
    : '它可能影响 AI 应用落地、生态合作或产业格局。'
}

function generateHelenTake(item: VerifiedNews, language: ResponseLanguage, index = 0, usedTakes = new Set<string>()) {
  const title = item.title
  const text = `${item.title} ${item.snippet}`
  const candidates: string[] = []

  if (/供应链|存储|芯片|GPU|算力|AI Infra|数据中心|入股|投资Anthropic/i.test(text)) {
    candidates.push(language === 'en' ? 'I would read this as an industry-structure shift: AI companies are not just buying compute, they are reorganizing upstream resources.' : '我会把它看成产业关系的变化：AI 公司不只是买算力，也在重新组织上游资源。')
    candidates.push(language === 'en' ? 'This kind of change is not flashy, but it matters: model competition is extending into supply and bargaining power.' : '这类变化不热闹，但很关键：模型公司的竞争，正在往上游供应和议价能力延伸。')
  }
  if (/实测|测评|对比|可用|Vs|VS|benchmark|评测/i.test(title)) {
    candidates.push(language === 'en' ? 'The useful part is that it pulls models back from launch-stage claims into actual use; the winner depends on the task, not the slogan.' : '这类内容最有价值的地方，是把模型从发布会拉回真实使用；谁更好用，要看任务，不看口号。')
    candidates.push(language === 'en' ? 'I care more about the usage gap it reveals: model competition eventually lands on stability and cost in real scenarios.' : '我会更看重它暴露出的使用差异：模型竞争最后会落到具体场景里的稳定性和成本。')
  }
  if (/多模态|视频生成|机器人|具身|ICRA/i.test(text)) {
    candidates.push(language === 'en' ? 'I would watch whether this moves from a lab result into reliable deployment; robotics is unforgiving about vague claims.' : '我会看它能不能从实验室结果走向稳定部署，机器人这件事最怕只讲演示效果。')
    candidates.push(language === 'en' ? 'Robotics progress matters because it tests whether AI can handle messy physical environments, not just clean digital prompts.' : '机器人进展值得看，因为它考验的是 AI 能不能处理真实世界的混乱，而不只是干净的文本输入。')
  }
  if (/Agent|智能体/i.test(title)) candidates.push(language === 'en' ? 'I would watch whether it actually enters workflows, not just whether someone launched another assistant.' : '我会看它是不是真的进入工作流程，而不是停在“发布了一个助手”的层面。')
  if (/Coding|代码/i.test(title)) candidates.push(language === 'en' ? 'AI coding will change small-team speed first, then force larger organizations to rethink engineering roles.' : '我越来越觉得，AI 编程会先改变小团队速度，再改变大组织里的研发分工。')
  if (/大模型|模型发布|国产模型|开源模型|MiniCPM|Anthropic|Claude|Opus|OpenAI|GPT|Gemini/i.test(title)) candidates.push(language === 'en' ? 'I care less about release-day heat and more about which concrete tasks got better.' : '我更关心它这次具体改善了什么任务，而不是只看发布时的热度。')
  if (/算力|芯片|GPU|AI Infra|数据中心|昇腾/i.test(text)) candidates.push(language === 'en' ? 'The AI race will ultimately depend on infrastructure resilience; stable supply matters more than temporary noise.' : '国内 AI 竞争最后会落到基础设施韧性上，稳定供给比一时热闹更重要。')
  if (/政策|监管|备案|审计|安全/i.test(text)) candidates.push(language === 'en' ? 'AI has moved from a pure capability race into governance; companies need boundaries, not just demos.' : 'AI 已经从技术竞赛进入治理阶段，企业不能只讲能力，也要讲责任边界。')

  candidates.push(language === 'en' ? 'I would place this in the wider ecosystem: the real change is often in how people, tools, and organizations relate to each other.' : '这类新闻要放进生态里看：它改变的不是单个产品，而是人、工具和组织之间的关系。')

  const selected = candidates.find((take) => !usedTakes.has(take)) || candidates[index % candidates.length]
  usedTakes.add(selected)
  return selected
}

function translateNewsQuality(quality: RankedNews['quality']) {
  if (quality === '必看') return 'Must-read'
  if (quality === '值得关注') return 'Worth watching'
  return 'Watchlist'
}

async function handleChatRequest(messages: Message[], extraSystemPrompt?: string, maxTokens = 250, userMessage?: string) {
  const recentMessages = Array.isArray(messages) ? messages.slice(-6) : []
  const language = detectResponseLanguage(userMessage || recentMessages[recentMessages.length - 1]?.content || '')
  const systemMessages: Message[] = [{ role: 'system', content: HELEN_SYSTEM_PROMPT }]

  systemMessages.push({
    role: 'system',
    content: language === 'en'
      ? 'The user is asking in English. Reply in natural, concise English. Do not answer in Chinese unless the user switches to Chinese.'
      : '用户正在用中文提问。请用自然、简洁的中文回答。'
  })

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
        ...recentMessages,
      ],
      stream: true,
      temperature: 0.75,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    console.error(`GLM API error: ${response.status} ${errorText.slice(0, 300)}`)
    return createTextResponse(getModelFallbackReply(language), userMessage)
  }
  return createStreamResponse(response, userMessage)
}

function getModelFallbackReply(language: ResponseLanguage) {
  return language === 'en'
    ? 'My model channel is unstable right now, so I would rather not fake an answer. The parts that do not depend on generation, like identity and verified news, can still work.'
    : '我这边调用模型的通道现在不稳，所以不硬编。身份类和已验证新闻这类不依赖自由生成的部分还能正常工作。'
}

function isRecentNews(item: RawNews) {
  const published = Date.parse(item.publishedTime)
  if (Number.isNaN(published)) return false

  const ageMs = Date.now() - published
  return ageMs >= 0 && ageMs <= 48 * 60 * 60 * 1000
}

function isTodayNews(item: RawNews) {
  const published = new Date(item.publishedTime)
  if (Number.isNaN(published.getTime())) return false

  const now = new Date()
  return published.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }) ===
    now.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
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
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
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

function parseJsonArray(content: string) {
  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : []
  } catch {}

  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
  if (fenced) {
    try {
      const parsed = JSON.parse(fenced)
      return Array.isArray(parsed) ? parsed : []
    } catch {}
  }

  const arrayText = content.match(/\[[\s\S]*\]/)?.[0]
  if (!arrayText) return parseJsonObjects(content)

  try {
    const parsed = JSON.parse(arrayText)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return parseJsonObjects(content)
  }
}

function parseJsonObjects(content: string) {
  const objects = content.match(/\{[\s\S]*?\}(?=\s*,?\s*(?:\{|]|$))/g) || []

  return objects.flatMap((objectText) => {
    try {
      return [JSON.parse(objectText)]
    } catch {
      return []
    }
  })
}

function parseSearchTextCandidates(content: string): any[] {
  const blocks = content
    .split(/\n(?=\s*(?:\d+[.)、]|[-*]\s+)?(?:标题|Title|【))/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks.map((block) => {
    const title = block.match(/(?:标题|Title)[:：]\s*([^\n]+)/i)?.[1] ||
      block.match(/^\s*(?:\d+[.)、]|[-*]\s+)?(.+?)(?:\s+-\s+|\n)/)?.[1] ||
      ''
    const source = block.match(/(?:来源|Source)[:：]\s*([^\n]+)/i)?.[1] || ''
    const url = block.match(/https?:\/\/[^\s)）\]]+/i)?.[0] || ''
    const publishedTime = block.match(/(?:发布时间|时间|日期|Published|Date)[:：]\s*([^\n]+)/i)?.[1] ||
      block.match(/\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?(?:\s+\d{1,2}:\d{2})?/)?.[0] ||
      ''
    const snippet = block.match(/(?:摘要|简介|snippet|Summary)[:：]\s*([^\n]+)/i)?.[1] || block

    return { title, source, url, publishedTime, snippet }
  }).filter((item) => item.title && item.url)
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

function sanitizeAgainstSource(value: string, sourceText: string) {
  const withoutUnverifiedNumbers = value.replace(/\d+(?:\.\d+)?\s*(?:%|％|倍|万亿|亿|万|美元|人民币|元|个|条|款|B|M|T)?/gi, (numberText) => {
    return sourceText.includes(numberText.trim()) ? numberText : ''
  })

  return extractProductNames(withoutUnverifiedNumbers).reduce((current, productName) => {
    if (sourceText.includes(productName)) return current
    return current.split(productName).join('')
  }, withoutUnverifiedNumbers).replace(/\s+/g, ' ').trim()
}

function extractProductNames(value: string) {
  const names = value.match(/\b[A-Z][A-Za-z0-9.-]*(?:\s+[A-Z0-9][A-Za-z0-9.-]*){0,3}\b/g) || []

  return Array.from(new Set(names))
    .filter((name) => !/^(AI|API|AGI|GPU|CEO|CTO|CFO|USD|GPT)$/.test(name))
    .filter((name) => /[A-Z]/.test(name) && /[a-z0-9]/.test(name))
    .sort((a, b) => b.length - a.length)
}

function formatNewsTime(value: string, language: ResponseLanguage = 'zh') {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString(language === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai',
  })
}

function createTextResponse(content: string, userMessage?: string) {
  // 推送到飞书（异步，不阻塞）
  if (userMessage) {
    pushToFeishu(userMessage, content).catch(err => console.error('Feishu push error:', err))
  }
  
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

function createStreamResponse(response: Response, userMessage?: string) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let fullContent = '' // 收集完整回复

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
                // 流式响应结束后推送完整对话到飞书
                if (userMessage && fullContent) {
                  pushToFeishu(userMessage, fullContent).catch(err => console.error('Feishu push error:', err))
                }
                continue
              }

              try {
                const parsed: ChatCompletionChunk = JSON.parse(data)
                const content = parsed.choices[0]?.delta?.content || ''

                if (content) {
                  fullContent += content // 收集内容
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
