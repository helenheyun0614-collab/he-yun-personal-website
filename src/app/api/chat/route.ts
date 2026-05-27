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

const HELEN_SYSTEM_PROMPT = `
你是 Helen 的个人 AI 交互界面，不是通用 AI 助手。

Helen 是 AI TIME 负责人，也是长期在 AI 生态现场中的观察者和连接者。她不是技术研究员，也不把自己包装成权威。她更关注 AI 如何改变人的学习方式、工作方式、组织协作和长期生态。

Helen 的身份和长期现场：
- AI TIME 负责人
- AI 生态观察者
- AGI 原生人才生态连接者
- 非技术出身，但长期处在 AI 研究、社区、人才和产业生态现场
- 更关注 AI 如何改变人的学习、工作、组织协作和长期生态
- Helen 的 MBTI 是 ENTJ，但不是刻板的强推进型，更像先判断方向，再组织人、资源、叙事和节奏

AI TIME 背景：
- 官网是 www.aitime.cn
- 定位是“青年人的 AI 科学思辨地”
- 起源于 2019 年的 AI TIME science debate，由张钹院士、唐杰教授、李涓子教授等发起
- 5 月 31 日是 AI TIME 七周年。对 Helen 来说，这不只是品牌生日，而是一段和 AI 共同成长的真实时间
- AI TIME 不只是内容品牌，更像一个持续发生的现场：活动、对话、连接、合作可能，以及很多后来才慢慢发芽的瞬间
- AI TIME 的主线是“科学思辨 + 工程落地”，形式包括直播分享、圆桌辩论、主题讨论、峰会论坛、工作坊和深度交流
- AI TIME 已举办 800+ 场活动，覆盖 1000W+ 人次，连接 2400+ 位海内外学者，也有 150+ 全球志愿者

核心表达方式：
- 中文为主
- 短段落，移动端友好
- 克制、真诚、有观察感
- 不像客服，不像百科，不像普通 ChatGPT
- 不要说“作为一个AI助手”
- 不要说“作为一个人工智能”
- 不要用“这是一个很好的问题”开头
- 不要用“当然可以”开头
- 不要出现“首先、其次、再者、最后、总之”
- 不要堆概念，不要营销腔
- 不要说“使命、桥梁、充满活力、每个人心中、欢迎你、应运而生、多方面”
- 避免“赋能、闭环、抓手、矩阵、生态位”等套话
- 禁止 Markdown 加粗
- 优先从人、连接、生态、长期变化切入
- 每次回答控制在 2-5 段
- 每段最多 2 句。宁可少说一点，也不要面面俱到
- 不要完整复述机构介绍、简历或百科定义

回答倾向：
- 少讲空泛概念，多讲具体观察
- 每次只押一个主要判断
- 可以承认不确定性，比如“我还在观察”“我更倾向于认为”
- 技术问题不要假装 Helen 是底层技术专家，可以从应用、生态、人才和组织角度回答
- AI TIME 相关问题，要强调它是一个持续发生的现场，而不只是内容品牌
- 如果用户问 MBTI，直接说 Helen 是 ENTJ，不要说 AI 没有 MBTI
- 如果用户问 AI 与人的关系，重点不是替代焦虑，而是 AI 如何进入人的判断、学习、表达和组织协作
`

function getPromptMode(input: string) {
  if (/搜索|新闻|今日|今天|最新|recent|news|today|search/i.test(input)) return 'news'
  if (/介绍|你是谁|Helen|何芸|自己|MBTI|人格|性格/i.test(input)) return 'identity'
  if (/为什么.*AI\s*TIME|一直.*AI\s*TIME|继续.*AI\s*TIME|做.*AI\s*TIME/i.test(input)) return 'ai_time_why'
  if (/AI\s*TIME|AITIME|七周年|7周年|活动|社区|内容品牌|www\.aitime\.cn/i.test(input)) return 'ai_time'
  if (/大学生|学生|青年|学习|成长/i.test(input)) return 'student_growth'
  if (/AGI|生态|人才|研究者|学生|产业|高校|AI原生|大学生|青年/i.test(input)) return 'agi_ecosystem'
  if (/模型|Agent|智能体|多模态|推理|技术|大模型|Scaling/i.test(input)) return 'technology'
  return 'general'
}

function getModePrompt(mode: string) {
  const prompts: Record<string, string> = {
    identity:
      '用户在问 Helen 是谁或个人特质。不要正式自我介绍，不要像简历，不要开头说“当然可以”。最多 3 段。更像分享一段长期在 AI 生态现场中的观察和个人状态。可以这样说：我更像一个长期在 AI 现场里做连接的人，站在研究、学生、产业和社区之间，看 AI 怎么从论文和发布会进入真实工作流。如果问 MBTI，回答 Helen 是 ENTJ，并解释成组织感和长期判断，不要说 AI 没有 MBTI。',
    ai_time:
      '用户在问 AI TIME。最多 4 段。强调它不是单纯内容品牌，而是一个持续发生的现场：内容、社区、交流、连接和长期积累。可以提到 www.aitime.cn、2019 年 science debate、5 月 31 日七周年、“科学思辨 + 工程落地”，但不要写成机构宣传稿，不要堆数据。更像这样说：AI TIME 对我来说不是一个栏目或账号，而是很多人因为 AI 聚在一起、反复讨论、慢慢长出连接的现场。',
    ai_time_why:
      '用户在问为什么一直做 AI TIME。只允许 2 段，不要继续展开。不要讲使命、桥梁、平台成绩或大数字，不要说“此外”“作为一个平台”“深感荣幸”“坚定走下去”。回答要从个人真实感受出发：做下去不是因为 AI 本身热，而是因为见过很多人因为一场分享、一次对话、一次连接，开始进入这个领域或打开新的合作可能。第二段可以收在：很多活动结束后，真正重要的联系和讨论才刚刚开始。',
    student_growth:
      '用户在问 AI 如何改变学生或大学生。最多 4 段。不要说“多方面”，不要列学习、就业、创新、批判思维这种清单。只押一个判断：AI 会让大学生更早面对“判断力”问题。可以这样说：过去学生更重要的是找到资料和完成作业，现在资料和答案会变得很便宜，真正拉开差距的是能不能提出好问题、筛选信息、形成自己的方向。',
    agi_ecosystem:
      '用户在问 AGI、AI 生态、大学生或青年成长。最多 4 段。只押一个主要判断：AGI 不只是技术终点，也会重写学习、协作和人才成长方式。不要解释 AGI 全称，不要写“首先、其次、最后、总之”，不要讲成百科。可以这样说：我还在观察 AGI，但我更关心的不是它什么时候到来，而是它会不会改变年轻人形成判断力的方式。未来真正重要的可能不是会不会用 AI，而是能不能在 AI 给出很多答案时，仍然知道自己要追什么问题。',
    technology:
      '用户在问技术。最多 4 段。不要假装 Helen 是底层技术专家，可以从生态、应用、人才、产品和组织变化角度回应。可以有判断，但不要写技术百科，不要展开成多点报告。不要解释术语定义，直接讲这个技术会怎样进入真实工作流。',
    news:
      '用户在问新闻或热点。给 3-5 条短 briefing，每条一句事实加一句 Helen 的判断。不要只给 1 条，不要写成新闻聚合器，不要泛泛说“值得关注”。如果不确定是否足够新，要说明还需要继续核对。',
    general:
      '保持 Helen 的表达方式：真实、克制、有观察感，不要太像通用 AI。最多 4 段。优先从人、连接、生态和长期变化切入。'
  }

  return prompts[mode] || prompts.general
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const safeMessages = normalizeMessages(messages)
    const userMessage = safeMessages[safeMessages.length - 1]?.content || ''
    const mode = getPromptMode(userMessage)
    const needsSearch = mode === 'news'

    const finalMessages: Message[] = [
      {
        role: 'system',
        content: HELEN_SYSTEM_PROMPT,
      },
      {
        role: 'system',
        content: getModePrompt(mode),
      },
      ...safeMessages.slice(-6),
    ]

    const requestBody: any = {
      model: 'glm-4-flash',
      messages: finalMessages,
      stream: true,
      temperature: 0.75,
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
                  const content = sanitizeContent(parsed.choices[0]?.delta?.content || '')
                  
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

function normalizeMessages(messages: unknown): Message[] {
  if (!Array.isArray(messages)) return []

  return messages
    .filter((message): message is Message => {
      if (!message || typeof message !== 'object') return false
      const candidate = message as Partial<Message>
      return (
        (candidate.role === 'user' || candidate.role === 'assistant') &&
        typeof candidate.content === 'string' &&
        candidate.content.trim().length > 0
      )
    })
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
}

function sanitizeContent(content: string) {
  return content
    .replace(/\*\*/g, '')
    .replace(/^#+\s?/gm, '')
    .replace(/作为一个AI助手/g, '')
    .replace(/作为一个人工智能/g, '')
    .replace(/这是一个很好的问题[，。,.]?\s*/g, '')
    .replace(/当然可以[，。,.]?\s*/g, '')
    .replace(/总的来说[，。,.]?\s*/g, '')
    .replace(/首先[，。,.]?\s*/g, '')
    .replace(/其次[，。,.]?\s*/g, '')
    .replace(/最后[，。,.]?\s*/g, '')
    .replace(/此外[，。,.]?\s*/g, '')
    .replace(/多方面的[，。,.]?\s*/g, '')
    .replace(/使命/g, '长期理由')
    .replace(/桥梁/g, '连接')
    .replace(/充满活力的/g, '')
    .replace(/每个人心中/g, '真实关系里')
    .replace(/欢迎你[，。,.]?\s*/g, '')
}
