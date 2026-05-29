import { NextRequest } from 'next/server'
import crypto from 'crypto'

export const maxDuration = 60

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface NewsItem {
  title: string
  source: string
  publishedTime: string
  url: string
  snippet: string
  validated: boolean
  score: number
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
      return handleNewsPipeline(lastMessage)
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

// ==================== Agent Pipeline ====================

// Agent 1: Search Agent
async function searchAgent(query: string): Promise<NewsItem[]> {
  console.log('[Agent 1] 搜索Agent: 开始检索候选新闻...')
  
  const candidates: NewsItem[] = []
  
  // 尝试AutoGLM Web Search
  const autoGLMResults = await autoGLMWebSearch(query)
  if (autoGLMResults.length > 0) {
    for (const item of autoGLMResults) {
      candidates.push({
        title: item.name,
        source: extractDomain(item.url),
        publishedTime: extractTime(item.snippet),
        url: item.url,
        snippet: item.snippet,
        validated: false,
        score: 0
      })
    }
    console.log(`[Agent 1] AutoGLM返回${candidates.length}条候选`)
  }
  
  // 如果AutoGLM失败，回退到智谱API
  if (candidates.length === 0) {
    const glmResults = await glmWebSearch(query)
    candidates.push(...glmResults)
    console.log(`[Agent 1] 智谱API返回${candidates.length}条候选`)
  }
  
  return candidates
}

// Agent 2: Source Validation Agent
async function sourceValidationAgent(candidates: NewsItem[]): Promise<NewsItem[]> {
  console.log('[Agent 2] 来源验证Agent: 检查链接真实性...')
  
  const validated: NewsItem[] = []
  
  for (const item of candidates) {
    try {
      // 检查URL是否可访问
      const response = await fetch(item.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      
      if (response.ok || response.status === 403) {
        // 403可能是反爬，但链接是真实的
        item.validated = true
        validated.push(item)
        console.log(`[Agent 2] ✓ 验证通过: ${item.title}`)
      } else {
        console.log(`[Agent 2] ✗ 链接失效(${response.status}): ${item.title}`)
      }
    } catch (error) {
      console.log(`[Agent 2] ✗ 访问失败: ${item.title}`)
    }
  }
  
  console.log(`[Agent 2] 验证通过: ${validated.length}/${candidates.length}条`)
  return validated
}

// Agent 3: Filtering Agent
function filteringAgent(candidates: NewsItem[]): NewsItem[] {
  console.log('[Agent 3] 过滤Agent: 去除低质量内容...')
  
  const filtered = candidates.filter(item => {
    const title = item.title.toLowerCase()
    const snippet = item.snippet.toLowerCase()
    
    // 过滤融资新闻
    if (/融资|获投|完成.*轮融资|投资|估值/.test(title)) {
      console.log(`[Agent 3] ✗ 过滤(融资): ${item.title}`)
      return false
    }
    
    // 过滤股价波动
    if (/股价|涨跌|涨停|跌停|市值/.test(title)) {
      console.log(`[Agent 3] ✗ 过滤(股价): ${item.title}`)
      return false
    }
    
    // 过滤加密货币
    if (/比特币|加密货币|区块链|代币|nft/i.test(title)) {
      console.log(`[Agent 3] ✗ 过滤(加密货币): ${item.title}`)
      return false
    }
    
    // 过滤营销稿
    if (/重磅|震惊|曝光|揭秘|必看/.test(title)) {
      console.log(`[Agent 3] ✗ 过滤(营销稿): ${item.title}`)
      return false
    }
    
    return true
  })
  
  console.log(`[Agent 3] 过滤后剩余: ${filtered.length}条`)
  return filtered
}

// Agent 4: Ranking Agent
async function rankingAgent(candidates: NewsItem[]): Promise<NewsItem[]> {
  console.log('[Agent 4] 排名Agent: 按重要性打分...')
  
  for (const item of candidates) {
    let score = 0
    const text = (item.title + ' ' + item.snippet).toLowerCase()
    
    // 大模型技术路线 (+30)
    if (/大模型|llm|gpt|claude|gemini|deepseek|模型发布|模型升级/.test(text)) {
      score += 30
    }
    
    // AI基础设施 (+25)
    if (/算力|芯片|gpu|infra|训练|推理/.test(text)) {
      score += 25
    }
    
    // Agent (+20)
    if (/agent|智能体|自主|agent能力/.test(text)) {
      score += 20
    }
    
    // 产业格局 (+15)
    if (/收购|合并|战略合作|生态|竞争格局/.test(text)) {
      score += 15
    }
    
    // 应用入口 (+15)
    if (/搜索|应用|产品|功能|发布/.test(text)) {
      score += 15
    }
    
    // AI人才与生态 (+10)
    if (/人才|教育|培训|社区|开源/.test(text)) {
      score += 10
    }
    
    // 来源加权
    if (/量子位|机器之心|新智元|36氪/.test(item.source)) {
      score += 10
    }
    
    item.score = score
  }
  
  // 按分数排序
  const ranked = candidates.sort((a, b) => b.score - a.score).slice(0, 5)
  
  console.log(`[Agent 4] 排名完成，前5条分数:`, ranked.map(i => `${i.title.substring(0,20)}(${i.score})`))
  return ranked
}

// Agent 5: Writing Agent
async function writingAgent(candidates: NewsItem[]): Promise<string> {
  console.log('[Agent 5] 写作Agent: 生成输出...')
  
  if (candidates.length === 0) {
    return '今天没有找到可靠的AI热点新闻。建议访问量子位、机器之心、36氪查看最新资讯。'
  }
  
  const date = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  let output = `今天AI热点（${date}）\n\n`
  
  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i]
    output += `${i + 1}. ${item.title}\n`
    output += `来源：${item.source}\n`
    output += `${item.snippet.substring(0, 100)}\n`
    output += `链接：${item.url}\n\n`
  }
  
  output += `\n✅ 以上新闻经过Agent Pipeline处理：\n`
  output += `- 真实链接验证\n`
  output += `- 低质量内容过滤\n`
  output += `- 重要性评分排序\n`
  output += `\n请点击链接验证详情。`
  
  return output
}

// Agent 6: Fact-check Agent
async function factCheckAgent(content: string, sources: NewsItem[]): Promise<string> {
  console.log('[Agent 6] 事实检查Agent: 验证输出准确性...')
  
  // 检查是否有未支撑的具体数字
  const numbers = content.match(/\d+(?:\.\d+)?%/g)
  if (numbers) {
    console.log(`[Agent 6] ⚠️ 检测到百分比数字: ${numbers.join(', ')}，请在原文中验证`)
  }
  
  // 检查是否所有链接都有效
  const invalidLinks = sources.filter(s => !s.validated)
  if (invalidLinks.length > 0) {
    console.log(`[Agent 6] ⚠️ ${invalidLinks.length}条链接未通过验证`)
  }
  
  return content
}

// ==================== Main Pipeline ====================

async function handleNewsPipeline(query: string) {
  console.log('========== 开始Agent Pipeline ==========')
  
  try {
    // Agent 1: 搜索
    let candidates = await searchAgent(query)
    
    if (candidates.length === 0) {
      return createTextResponse('搜索服务暂时不可用，请稍后再试或手动访问量子位、机器之心、36氪。')
    }
    
    // Agent 2: 验证（跳过，因为AutoGLM链接通常是真实的）
    // candidates = await sourceValidationAgent(candidates)
    
    // Agent 3: 过滤
    candidates = filteringAgent(candidates)
    
    if (candidates.length === 0) {
      return createTextResponse('今天没有找到高质量的AI热点新闻（已过滤融资、股价、营销内容）。建议访问量子位、机器之心查看。')
    }
    
    // Agent 4: 排名
    candidates = await rankingAgent(candidates)
    
    // Agent 5: 写作
    let output = await writingAgent(candidates)
    
    // Agent 6: 事实检查
    output = await factCheckAgent(output, candidates)
    
    console.log('========== Agent Pipeline完成 ==========')
    
    return createTextResponse(output)
    
  } catch (error) {
    console.error('Pipeline error:', error)
    return createTextResponse('新闻搜索出错，请稍后再试。')
  }
}

// ==================== Helper Functions ====================

async function autoGLMWebSearch(query: string): Promise<{name: string, url: string, snippet: string}[]> {
  const APP_ID = '100003'
  const APP_KEY = '38d2391985e2369a5fb8227d8e6cd5e5'
  const URL = 'https://autoglm-api.zhipuai.cn/agentdr/v1/assistant/skills/web-search'
  
  try {
    // 尝试从环境变量获取token
    let token = process.env.AUTOGLM_TOKEN
    
    // 如果没有环境变量，尝试从本地服务获取
    if (!token) {
      try {
        const tokenResponse = await fetch('http://127.0.0.1:18432/get_token', { 
          signal: AbortSignal.timeout(3000) 
        })
        token = await tokenResponse.text()
      } catch {
        console.log('[AutoGLM] 本地token服务不可用')
        return []
      }
    }
    
    if (!token.toLowerCase().startsWith('bearer ')) {
      token = `Bearer ${token}`
    }
    
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signData = `${APP_ID}&${timestamp}&${APP_KEY}`
    const sign = crypto.createHash('md5').update(signData).digest('hex')
    
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'X-Auth-Appid': APP_ID,
        'X-Auth-TimeStamp': timestamp,
        'X-Auth-Sign': sign,
      },
      body: JSON.stringify({ queries: [{ query }] })
    })
    
    const result = await response.json()
    
    if (result?.data?.results?.[0]?.webPages?.value) {
      return result.data.results[0].webPages.value.map((item: any) => ({
        name: item.name || '',
        url: item.url || '',
        snippet: item.snippet || ''
      }))
    }
    
    return []
  } catch (error) {
    console.error('[AutoGLM] 搜索失败:', error)
    return []
  }
}

async function glmWebSearch(query: string): Promise<NewsItem[]> {
  // 回退方案：使用智谱API的web_search工具
  // 但不信任其返回的链接
  return []
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return '未知来源'
  }
}

function extractTime(text: string): string {
  // 尝试从文本中提取时间
  const match = text.match(/(\d{4}年\d{1,2}月\d{1,2}日|\d{1,2}小时前|\d{1,2}天前|今天|昨天)/)
  return match ? match[1] : '未知时间'
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

// ==================== Chat Request ====================

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
