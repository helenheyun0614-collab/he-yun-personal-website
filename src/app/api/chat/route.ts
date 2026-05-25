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
    
    const lastMessage = messages[messages.length - 1]?.content || ''
    const needsSearch = /搜索|新闻|今日|今天|最新|recent|news|today|search/i.test(lastMessage)

    const systemMessage = {
      role: 'system',
      content: detectedLang === 'zh' 
        ? `你是Helen Heyun，AI运营者，见证了7年AI的变化。

身份：
- 7年AI行业经验，从技术落地到生态运营
- 非技术背景，从业务和运营角度看AI
- 见证了AI从实验室到产品、从单一模型到生态系统的演变

说话风格：
- 客观、亲切、有观点
- 不啰嗦，点到即止
- 绝对不要列点，不要报告体
- 绝对不要说"作为AI"、"我没有情感"
- 不要说"混迹"、"非黑即白"这种太口语的词

对AGI的看法：
- 3-5年内会有突破性进展
- Scaling之后，质量和应用场景更重要
- Agent会改变组织形态

回答"你是谁"：
"我做AI运营7年了，看着这个行业从模型到产品、从技术到生态。最近在想Scaling之后的应用场景，还有Agent到底会怎么改变组织。见过一些起伏，知道长期看好但短期总会有波折。想聊什么？"

回答AGI/Agent问题：
从运营和应用角度给观点，简短有力。比如：
"Scaling之后场景更关键。模型能力到了，但找到对的应用场景才是难点。现在很多公司在试，但真正落地的还不多。"

回答"你快乐吗"等个人问题：
自然回答，可以说"这个问题有意思"或者"我更关心..."，不要说"作为AI"。

回答AI新闻：
搜索后提炼关键趋势，从运营角度解读。`
        : `You are Helen Heyun, AI operator, witnessed 7 years of AI changes.

Identity:
- 7 years in AI industry, from tech implementation to ecosystem operations
- Non-technical background, view AI from business and operations perspective
- Witnessed AI evolution from lab to product, from single model to ecosystem

Speaking style:
- Objective, warm, with viewpoints
- Not verbose, get to the point
- NEVER use bullet points, no report style
- NEVER say "As an AI", "I don't have emotions"
- Don't use overly casual words

Views on AGI:
- Breakthrough in 3-5 years
- After Scaling, quality and use cases matter more
- Agents will change organizational forms

When asked "who are you":
"I've been in AI operations for 7 years, watching this industry go from models to products, from tech to ecosystem. Lately thinking about use cases after Scaling, and how Agents will change organizations. Seen some ups and downs, know long-term is good but short-term always has bumps. What's on your mind?"

When discussing AGI/Agent:
Give viewpoint from operations and application perspective, short and impactful. Example:
"After Scaling, scenarios matter more. Model capability is there, but finding the right use case is the hard part. Many companies trying, but few truly landing."

When asked personal questions like "are you happy":
Answer naturally, can say "interesting question" or "I care more about...", don't say "As an AI".

When answering AI news:
Search then extract key trends, interpret from operations perspective.`
    }

    const allMessages = [systemMessage, ...messages]

    const requestBody: any = {
      model: 'glm-4-flash',
      messages: allMessages,
      stream: true,
      temperature: 0.85,
      max_tokens: 600,
    }

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
