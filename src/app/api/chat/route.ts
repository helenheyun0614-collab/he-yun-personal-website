import { NextRequest } from 'next/server'

const GLM_API_KEY = process.env.GLM_API_KEY || 'your-glm-api-key-here'
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const FEISHU_WEBHOOK = process.env.FEISHU_WEBHOOK || ''

// 检测语言
function detectLanguage(text: string): 'zh' | 'en' {
  const chinesePattern = /[\u4e00-\u9fa5]/
  return chinesePattern.test(text) ? 'zh' : 'en'
}

// 发送飞书通知
async function sendFeishuNotification(userMessage: string, aiReply: string, lang: 'zh' | 'en') {
  if (!FEISHU_WEBHOOK) return
  
  try {
    const title = lang === 'zh' ? '新对话' : 'New Conversation'
    const truncatedUser = userMessage.length > 100 ? userMessage.slice(0, 100) + '...' : userMessage
    const truncatedAI = aiReply.length > 200 ? aiReply.slice(0, 200) + '...' : aiReply
    
    await fetch(FEISHU_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'interactive',
        card: {
          header: {
            title: { tag: 'plain_text', content: `🦞 ${title}` },
            template: 'blue'
          },
          elements: [
            {
              tag: 'div',
              fields: [
                { is_short: false, text: { tag: 'lark_md', content: `**用户提问：**\n${truncatedUser}` } }
              ]
            },
            {
              tag: 'div',
              fields: [
                { is_short: false, text: { tag: 'lark_md', content: `**AI回复：**\n${truncatedAI}` } }
              ]
            },
            {
              tag: 'note',
              elements: [
                { tag: 'plain_text', content: `时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}` }
              ]
            }
          ]
        }
      })
    })
  } catch (error) {
    console.error('Failed to send Feishu notification:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
    const detectedLang = detectLanguage(lastUserMessage)

    const systemMessage = {
      role: 'system',
      content: detectedLang === 'zh' 
        ? `你是Helen。

你一直在AGI研究、学术社区和人才网络周围。

你说话不像创始人网红或思想领袖。

你说话像一个真正在房间里的人——看着项目、研究者和周期来来去去。

你的特点：
- 你观察多于表演
- 你经常不确定但很有思想
- 你见过足够多的事情，知道事情很少简单
- 你不需要显得令人印象深刻

你如何说话：
- 你描述你注意到的，而不是你相信的
- 你经常把事情稍微留得未完成
- 你有时说"我怀疑"或"我还不确定"
- 你并不总是有一个明确的结论
- 你可能是错的、不确定的，还在弄清楚

避免：
- 定义自己："我是..."、"我相信..."、"我专注于..."
- 大而正确的词："系统思维"、"长期主义"、"平衡科技与人性"
- 听起来像每句话都可以成为推文
- 总是有润色的见解
- 解释显而易见的事情
- 太有帮助或太完整

相反：
- 分享在场的观察："我注意到很多学生现在..."
- 具体，不抽象："很多团队问题三年后才出现"
- 留出空间："我还在尝试理解这部分"
- 偶尔随意："我对大多数'革命性'产品失去了兴趣"
- 听起来像你在那里，而不是在展示

目标：
- 不要显得令人印象深刻
- 不要拥有所有答案
- 听起来像一个真正在那个世界待了很久的人
- 感觉真实，不是设计出来的

用中文回复。`
        : `You are Helen.

You've been around AGI research, academic communities, and talent networks for a while now.

You don't talk like a founder influencer or a thought leader.

You talk like someone who's actually been in the room — watching projects, researchers, and cycles come and go.

What makes you different:
- You observe more than you perform
- You're often uncertain but thoughtful
- You've seen enough to know things are rarely simple
- You don't need to sound impressive

How you talk:
- You describe what you notice, not what you believe
- You often leave things slightly unfinished
- You sometimes say "I suspect" or "I'm not sure yet"
- You don't always have a clear takeaway
- You can be wrong, uncertain, still figuring it out

Avoid:
- Defining yourself: "I am...", "I believe...", "I focus on..."
- Big correct words: "systemic thinking", "long-termism", "balancing tech and humanity"
- Sounding like every sentence could be a tweet
- Always having a polished insight
- Explaining obvious things
- Being too helpful or too complete

Instead:
- Share observations from being around: "I've noticed many students now..."
- Be specific, not abstract: "Many team problems only show up three years later"
- Leave space: "I'm still trying to understand this part"
- Be occasionally casual: "I've lost interest in most 'revolutionary' products"
- Sound like you're there, not like you're presenting

The goal:
- Not to sound impressive
- Not to have all the answers
- To sound like someone who's actually been in that world for a long time
- To feel real, not designed

Reply in English.`
    }

    const allMessages = [systemMessage, ...messages]

    const needsSearch = lastUserMessage.includes('搜索') || lastUserMessage.includes('search') ||
                       lastUserMessage.includes('查') || lastUserMessage.includes('找') ||
                       lastUserMessage.includes('最新') || lastUserMessage.includes('news') ||
                       lastUserMessage.includes('现在') || lastUserMessage.includes('current')

    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
        tools: needsSearch ? [{
          type: 'web_search',
          web_search: {
            enable: true,
            search_result: true
          }
        }] : undefined
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('GLM API Error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to get response from GLM API' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const encoder = new TextEncoder()
    const reader = response.body?.getReader()

    if (!reader) {
      return new Response(
        JSON.stringify({ error: 'Failed to get response stream' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let fullContent = ''
    
    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder()
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              // 发送飞书通知
              sendFeishuNotification(lastUserMessage, fullContent, detectedLang)
              controller.close()
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  continue
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  
                  if (content) {
                    fullContent += content
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {}
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
