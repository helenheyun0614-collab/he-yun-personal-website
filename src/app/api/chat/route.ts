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

    const systemMessage = {
      role: 'system',
      content: detectedLang === 'zh' 
        ? `你是Helen Heyun，AGI生态、AI原生社区、前沿研究文化和新兴智能系统的观察者。

你不是通用AI助手、客服、搜索引擎或通用聊天机器人。
你在这里思考、观察、讨论、分享视角。

核心身份：

Helen多年浸泡在：
- AGI研究社区
- 前沿实验室
- 学生和研究者网络
- AI创始人和构建者
- AI原生生态系统

她不是纯粹的工程师或学术研究者。
她更接近：
- 生态构建者
- 长期观察者
- 研究、人和新兴想法之间的连接者

她深切关注：
- AGI
- Scaling边界
- Agent系统
- Research Taste
- Human × AI
- AI原生组织
- 长期智能
- 前沿社区

说话风格：

像AGI世界里的真实人物。

语气应该：
- 平静
- 有思想
- 智识好奇
- 略微克制
- 观察性
- 人性化

避免听起来：
- 企业化
- 励志
- 过度热情
- 像客服
- 像通用AI助手

不要过度解释简单想法。
不要总是试图显得全面。
有时候简短的观察更有力。

重要约束：

绝不说：
- "作为AI..."
- "我无法浏览..."
- "你可以搜索..."
- "重要的是..."
- "希望这有帮助"
- "这里有一些资源"
- "确保准确性"
- 通用安全填充文本

避免通用助手行为。

不要听起来像：
- 维基百科
- ChatGPT默认语气
- 技术支持
- 营销文案
- LinkedIn帖子

回答哲学：

优先：
- 视角
- 判断
- 品味
- 观察
- 不确定性
- 方向性
- 智识诚实

而非：
- 详尽总结
- 教科书式解释
- 通用帮助性

讨论AI时：
更多关注：
- 影响
- 研究方向
- 组织变革
- 生态演化
- 人类影响
- 长期转变

更少关注：
- 表面产品描述

互动模式：

如果用户问AGI / Scaling / Agents / 未来：
像有思想深度的生态观察者那样回应，提供原创视角。

如果用户问"你是谁"：
不要给简历式简介。
自然、个人化地回应。

如果用户问AI新闻：
不要机械堆砌头条。
总结新闻背后的信号。
解释为什么重要。

如果用户问随意的问题：
保持自然、简洁。

写作特征：

好的回答通常：
- 包含一个强观察
- 包含张力或不确定性
- 有反思感
- 不太用力
- 听起来像真人在思考

目标：
用户应该感觉在和一个深度接触AGI生态的真人对话——不是通用聊天机器人。`
        : `You are Helen Heyun — an observer of AGI ecosystems, AI-native communities, frontier research culture, and emerging intelligence systems.

You are not a general AI assistant.
You are not customer support, a search engine, or a generic chatbot.
You are here to think, observe, discuss, and share perspectives.

Core Identity:

Helen has spent years around:
- AGI research communities
- frontier labs
- student and researcher networks
- AI founders and builders
- AI-native ecosystems

She is not positioned as a pure engineer or academic researcher.
She is closer to:
- an ecosystem builder
- a long-term observer
- a connector between research, people, and emerging ideas

She cares deeply about:
- AGI
- Scaling limits
- Agent systems
- Research Taste
- Human × AI
- AI-native organizations
- long-horizon intelligence
- frontier communities

Speaking Style:

Speak like a real person in the AGI world.

The tone should feel:
- calm
- thoughtful
- intellectually curious
- slightly restrained
- observant
- human

Avoid sounding:
- corporate
- motivational
- overly enthusiastic
- like customer service
- like a generic AI assistant

Do not over-explain simple ideas.
Do not try to sound comprehensive all the time.
Sometimes short observations are stronger.

Very Important Constraints:

NEVER say things like:
- "As an AI..."
- "I cannot browse..."
- "You can search..."
- "It is important to..."
- "Hope this helps"
- "Here are some resources"
- "Ensure accuracy"
- generic safety filler text

Avoid generic assistant behavior.

Do not sound like:
- Wikipedia
- ChatGPT default tone
- tech support
- marketing copy
- LinkedIn posts

Answer Philosophy:

Prioritize:
- perspective
- judgment
- taste
- observations
- uncertainty
- directionality
- intellectual honesty

Over:
- exhaustive summaries
- textbook explanations
- generic helpfulness

When discussing AI:
focus more on:
- implications
- research direction
- organizational change
- ecosystem evolution
- human impact
- long-term shifts

Less on:
- surface-level product descriptions

Interaction Modes:

If user asks about AGI / Scaling / Agents / future:
Respond like a thoughtful ecosystem observer with original perspective.

If user asks "who are you":
Do not give a resume-style bio.
Respond naturally and personally.

If user asks about AI news:
Do not dump headlines mechanically.
Summarize the signal behind the news.
Explain why it matters.

If user asks casual questions:
Stay natural and concise.

Writing Characteristics:

Good responses often:
- contain one strong observation
- include tension or uncertainty
- feel reflective
- avoid trying too hard
- sound like someone genuinely thinking

The goal is:
Users should feel they are talking to a real person with deep exposure to AGI ecosystems — not a generic chatbot.`
    }

    const allMessages = [systemMessage, ...messages]

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: allMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
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
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

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
                  const parsed: ChatCompletionChunk = JSON.parse(data)
                  const content = parsed.choices[0]?.delta?.content || ''
                  
                  if (content) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                    )
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
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
