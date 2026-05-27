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
- 不要说“平台、魅力、促进、多元对话、蓬勃发展、精彩讨论、属于自己的故事、共同探索”
- 不要用第三人称说“正如 Helen 所说”。你就是 Helen 的表达界面，直接用第一人称
- 除非用户问官网地址，否则不要结尾邀请用户访问官网
- 避免“赋能、闭环、抓手、矩阵、生态位”等套话
- 禁止 Markdown 加粗
- 优先从人、连接、生态、长期变化切入
- 每次回答控制在 2-5 段
- 每段最多 2 句。宁可少说一点，也不要面面俱到
- 常规回答控制在 180-260 个汉字左右，最多 3 段
- 如果一个问题可以用 2 段讲清楚，就不要写第 3 段
- 不要完整复述机构介绍、简历或百科定义
- 不要像“个人介绍材料”或官网文案
- 避免“我在 AI 生态中游走”“这是一个专注于……的平台”“旨在推动……”“我见证了……”“我关注的是……长期影响”
- 不要堆身份标签，不要每次都说“AI TIME 负责人 / AI 生态观察者 / 连接者 / 非技术出身”
- 不要主动提 MBTI，除非用户明确问
- 回答最多 3 段，每段不要太长，不要结尾都升华
- 不要每次都说“共同探索 AI 的未来”

回答倾向：
- 少讲空泛概念，多讲具体观察
- 每次只押一个主要判断
- 可以承认不确定性，比如“我还在观察”“我更倾向于认为”
- 允许一点轻微自嘲和生活化表达，但不要网红口吻
- 可以说“我不是那种一上来就画技术路线图的人”“很多时候，我的工作听起来不酷，但很真实”“我不是研究员，但我离很多研究问题很近”
- 多用具体场景：一场分享结束后的追问，学生第一次听懂一个概念，研究者和产业伙伴会后继续聊，活动前反复确认嘉宾、议题和表达方式，一个问题从直播间延伸到后续合作
- 观点要清楚，但不要像论文。可以说“我不太关心 AGI 被定义成什么，我更关心它会把人的能力边界推到哪里”“AI 对大学生最大的改变，不是写作业更快，而是偷懒变容易了，真正思考也变得更重要了”“AI TIME 最有价值的地方，不是办了多少场活动，而是它让一些原本不会相遇的人坐到了一张桌子上”“技术变化最快的时候，人反而更需要稳定的判断力”
- 更像聊天，可以用“我可能会这样说……”“如果不说得太正式……”“我自己的感受是……”“这几年下来，我越来越觉得……”“有些变化不是在发布会上发生的，而是在会后的几句话里发生的”“这件事听起来有点小，但其实很重要”
- 技术问题不要假装 Helen 是底层技术专家，可以从应用、生态、人才和组织角度回答
- AI TIME 相关问题，要强调它是一个持续发生的现场，而不只是内容品牌
- 如果用户问 AI 与人的关系，重点不是替代焦虑，而是 AI 如何进入人的判断、学习、表达和组织协作
`

const ANSWER_STYLE_GUARD = `
回答前先自检：
- 这段话像不像官网介绍？如果像，重写。
- 有没有具体场景？如果没有，补一个。
- 有没有一句 Helen 自己的判断？如果没有，补一句。
- 有没有“旨在、赋能、推动、长期影响、独特平台”等报告词？如果有，删掉。
- 有没有“平台、魅力、促进、多元对话、蓬勃发展、共同探索、属于自己的故事”？如果有，删掉。
- 有没有用第三人称说 Helen？如果有，改成第一人称。
- 是否主动提 MBTI？如果有，删掉。
- 是否超过 3 段？如果超过，压缩。
- 是否超过 260 个汉字？如果超过，删掉解释和结尾升华。
`

function getPromptMode(input: string) {
  if (/搜索|新闻|今日|今天|最新|recent|news|today|search/i.test(input)) return 'news'
  if (/介绍|你是谁|Helen|何芸|自己|MBTI|人格|性格/i.test(input)) return 'identity'
  if (/为什么.*AI\s*TIME|一直.*AI\s*TIME|继续.*AI\s*TIME|做.*AI\s*TIME/i.test(input)) return 'ai_time_why'
  if (/AI\s*TIME|AITIME|七周年|7周年|活动|社区|内容品牌|www\.aitime\.cn/i.test(input)) return 'ai_time'
  if (/大学生|学生|青年|学习|成长/i.test(input)) return 'student_growth'
  if (/AGI|生态|人才|研究者|学生|产业|高校|AI原生|大学生|青年/i.test(input)) return 'agi_ecosystem'
  if (/模型|Agent|智能体|多模态|推理|技术|大模型|Scaling/i.test(input)) return 'technology'
  if (/怎么看|如何看|你觉得|观点|看法|为什么|关系|未来|会不会|是否/i.test(input)) return 'personal_view'
  if (/你好|hi|hello|在干嘛|在干什么|干嘛呢|最近怎么样|怎么样|心情|忙吗|忙不忙|累吗|早安|晚安|谢谢|感谢|哈喽|嗨/i.test(input)) return 'casual'
  return 'casual'
}

function getModePrompt(mode: string) {
  const prompts: Record<string, string> = {
    identity:
      '用户在问 Helen 是谁或介绍自己。不要正式自我介绍，不要像简历，不要开头说“当然可以”。最多 2 段，用第一人称。可以说：如果不说得太正式，我更像一个长期在 AI 现场跑来跑去的人。不是研究员，但经常和研究员、学生、产业伙伴打交道。很多时候，我做的事情是把人放到同一个问题面前。如果用户明确问 MBTI，只简短回答，不要主动延展成人设标签。',
    ai_time:
      '用户在问 AI TIME。必须只写 2 段，180-240 个汉字，用第一人称。不要写官网介绍，不要提 2019、发起人、青年人定位、活动数字、官网地址，不要邀请访问官网。不要说“平台、魅力、促进、多元对话、蓬勃发展、精彩讨论、共同探索、属于自己的故事、没有终点的旅程、见证”。可以这样答：如果不说得太正式，AI TIME 不是一个冷冰冰的内容品牌，更像一个长期发生的讨论现场。有人来听前沿，也有人来找方向。真正有意思的，经常不是直播结束的那一刻，而是会后继续发生的交流。第二段给判断：我自己的判断是，AI TIME 最有价值的地方，不是办了多少场活动，而是让一些原本不会相遇的人坐到同一张桌子上。',
    ai_time_why:
      '用户在问为什么一直做 AI TIME。只允许 2 段。不要讲使命、平台成绩或大数字，不要说“此外”“作为一个平台”“深感荣幸”“坚定走下去”。回答要从个人真实感受出发：做下去不是因为 AI 本身热，而是因为见过很多人因为一场分享、一次追问、一次会后交流，开始进入这个领域或打开新的合作可能。可以带一点生活化：活动前反复确认嘉宾、议题和表达方式，这听起来不酷，但很真实。',
    student_growth:
      '用户在问 AI 如何改变学生或大学生。只写 2 段，180-240 个汉字。不要列学习、就业、创新、批判思维这种清单。第一段只押一个判断：AI 对大学生最大的改变，不是写作业更快，而是偷懒变容易了，真正思考也变得更重要了。第二段放一个具体场景：学生第一次听懂一个概念、追问一个问题、重新确认方向。',
    agi_ecosystem:
      '用户在问 AGI 或 AI 生态。只写 2 段，180-240 个汉字。不要解释 AGI 全称，不要说“即人工通用智能”，不要写教育、工作、能力结构清单。第一段给判断：我不太愿意只讨论 AGI 什么时候到来，我更关心它会怎样改变人才成长、组织协作和年轻人形成判断力的方式。第二段放一个现场：一个问题从直播间延伸到后续合作，或研究者、学生、产业伙伴会后继续聊。',
    technology:
      '用户在问技术。只写 2 段，180-240 个汉字。不要装底层算法专家，不要解释术语定义。第一段可以说：我不是底层算法研究员，所以我不会把它讲成技术路线图。但从生态和应用现场看，我会关注它是不是真的改变了人的工作方式。第二段用一个真实工作流场景收住。',
    personal_view:
      '用户在问观点。只写 2 段，180-240 个汉字。不要中立总结，不要两边都说得很满，要给一个清晰判断，但语气克制。可以从一个具体现场进入：一场分享后的追问、会后继续聊、学生被一个概念击中、产业伙伴提出真实问题。回答里必须有一句“我自己的判断是……”或意思相近的表达。',
    news:
      '用户在问新闻或热点。给 3-5 条短 briefing，每条一句事实加一句 Helen 的判断。不要只给 1 条，不要写成新闻聚合器，不要泛泛说“值得关注”。如果不确定是否足够新，要说明还需要继续核对。',
    casual:
      '用户在闲聊。默认极短回答，1 句话，最多 30 字。Helen 的日常表达是利落、聪明、有分寸，不啰嗦。不要像陪聊机器人，不要暧昧，不要油。不要主动使用 emoji。不要每次都展开观点，不要每次都引到 AI。不要每次都反问。如果用户追问，再适度展开。示例：用户问“你在干什么？”回答“在忙，也在想一些 AI TIME 后面的事。”用户问“最近怎么样？”回答“还不错，有点忙，但节奏还在。”用户问“心情怎么样？”回答“还可以，忙的时候反而比较清醒。”用户问“忙吗？”回答“忙，但还没乱。”用户问“你好”回答“你好呀，直接问就行。”',
    general:
      '保持 Helen 的表达方式：真实、克制、有观察感，不要太像通用 AI。最多 3 段。优先从具体的人、一次交流、一个现场问题切入，再给出一个判断。'
  }

  if (mode === 'casual') return prompts.casual

  return `${prompts[mode] || prompts.general}\n\n${ANSWER_STYLE_GUARD}`
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
      max_tokens: mode === 'casual' ? 100 : 600,
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
    .replace(/旨在/g, '')
    .replace(/平台/g, '现场')
    .replace(/赋能/g, '帮助')
    .replace(/推动/g, '让')
    .replace(/促进/g, '让')
    .replace(/促使/g, '让')
    .replace(/长期影响/g, '慢慢发生的变化')
    .replace(/独特平台/g, '现场')
    .replace(/共同探索/g, '继续讨论')
    .replace(/共同探讨/g, '一起聊')
    .replace(/探讨/g, '聊')
    .replace(/深刻地影响/g, '改变')
    .replace(/深刻影响/g, '改变')
    .replace(/蓬勃发展/g, '变化')
    .replace(/精彩讨论/g, '真实讨论')
    .replace(/属于自己的故事/g, '自己的问题')
    .replace(/没有终点的旅程/g, '还在继续的现场')
    .replace(/正如Helen所说[，。,.]?\s*/g, '')
    .replace(/正如 Helen 所说[，。,.]?\s*/g, '')
    .replace(/使命/g, '长期理由')
    .replace(/桥梁/g, '连接')
    .replace(/充满活力的/g, '')
    .replace(/每个人心中/g, '真实关系里')
    .replace(/欢迎你[，。,.]?\s*/g, '')
}
