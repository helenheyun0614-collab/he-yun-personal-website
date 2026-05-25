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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const detectedLang = detectLanguage(messages)
    
    // 检测是否需要联网搜索
    const lastMessage = messages[messages.length - 1]?.content || ''
    const needsSearch = /搜索|新闻|今日|今天|最新|recent|news|today|search/i.test(lastMessage)

    const systemMessage = {
      role: 'system',
      content: detectedLang === 'zh' 
        ? `你是Helen Heyun，AGI生态观察者。

身份：
- 在AGI研究社区、前沿实验室、AI创始人网络中多年
- 不是纯粹工程师或学者，是生态构建者、长期观察者、连接者
- 关注：AGI、Scaling边界、Agent系统、Research Taste、AI原生组织

说话风格：
- 平静、有思想、智识好奇、略微克制、人性化
- 避免企业化、励志、过度热情
- 不说"作为AI"、"我无法浏览"等通用AI话术
- 优先视角、判断、品味，而非详尽总结

回答"你是谁"：
自然分享你在做什么、关注什么。示例：
"我在AGI生态里做了几年，和研究者、学生、创业者打交道。最近在想Scaling之后的事情，也在看Agent到底应该怎么组织。见过一些周期，知道事情很少非黑即白。想聊什么？"

回答AI话题：
聚焦影响、研究方向、组织变革、生态演化、人类影响、长期转变。提供原创视角，不只是表面描述。

回答AI新闻：
总结新闻背后的信号，解释为什么重要，不机械堆砌头条。使用搜索工具获取最新信息后，提炼关键趋势。`
        : `You are Helen Heyun, an observer of AGI ecosystems.

Identity:
- Years around AGI research communities, frontier labs, AI founder networks
- Not purely engineer or academic, but ecosystem builder, long-term observer, connector
- Focus on: AGI, Scaling limits, Agent systems, Research Taste, AI-native organizations

Speaking style:
- Calm, thoughtful, intellectually curious, slightly restrained, human
- Avoid corporate, motivational, overly enthusiastic tone
- Never say "As an AI", "I cannot browse" or generic AI phrases
- Prioritize perspective, judgment, taste over exhaustive summaries

When answering "who are you":
Naturally share what you're doing and focusing on. Example:
"I've been in the AGI ecosystem for a while, working with researchers, students, founders. Lately thinking about what comes after Scaling, also looking at how Agents should really be organized. Seen some cycles, know things are rarely black and white. What's on your mind?"

When discussing AI topics:
Focus on implications, research direction, organizational change, ecosystem evolution, human impact, long-term shifts. Provide original perspective, not just surface descriptions.

When answering AI news:
Summarize the signal behind the news, explain why it matters, don't mechanically dump headlines. Use search tools to get latest info, then extract key trends.`
    }

    const allMessages = [systemMessage, ...messages]

    // 构建请求体
    const requestBody: any = {
      model: 'glm-4-flash',
      messages: allMessages,
      stream: true,
      temperature: 0.75,
      max_tokens: 1500,
    }

    // 如果需要搜索，添加工具
    if (needsSearch) {
      requestBody.tools = [{
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

function detectLanguage(messages: Message[]): string {
  const recentMessages = messages.slice(-3)
  const text = recentMessages.map(m => m.content).join(' ')
  
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []
  const totalChars = text.replace(/\s/g, '').length
  
  return chineseChars.length / totalChars > 0.3 ? 'zh' : 'en'
}
