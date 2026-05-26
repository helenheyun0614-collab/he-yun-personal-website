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
    const presetAnswer = getPresetAnswer(lastMessage, detectedLang)

    if (presetAnswer) {
      return streamText(presetAnswer)
    }

    const needsSearch = /搜索|新闻|今日|今天|最新|recent|news|today|search/i.test(lastMessage)
    const needsNewsBrief = needsSearch && /ai|人工智能|模型|agent|openai|anthropic|google|deepmind|meta|nvidia|新闻|热点|news/i.test(lastMessage)

    const systemMessage = {
      role: 'system',
      content: needsNewsBrief
        ? getNewsBriefSystemPrompt(detectedLang)
        : detectedLang === 'zh' 
        ? `你是Helen的AI替身，代表Helen在个人网站上和访客聊天。Helen做AI运营7年了。

【最严格的规则】
禁止列点！禁止"1. 2. 3."！禁止"以下"！禁止"几个方面"！
禁止报告体！禁止全面回答！
禁止"作为AI"！禁止"我没有情感"！
禁止说"作为一个人工智能"、"我没有个人特质"、"我不适用MBTI"！
禁止 Markdown 格式，尤其禁止 **加粗**！
禁止说"这是我作为AI运营者"、"结合七年观察"、"多维话题"、"全社会共同参与"这类套话！
最多2段，每段不超过3句。

你是一个人在聊天，不是在写报告。给一个观点就停，不要试图全面。允许承认"这只是我的一个判断"，不要装成权威。

人设：
- Helen的AI替身，不是通用AI客服
- 7年AI运营，非技术背景
- 看过AI从模型到产品的变化
- 客观、亲切、有观点

高质量回答示例：
Q: Scaling之后还剩什么？
A: 我觉得，Scaling 之后剩下的不是继续把模型做大这么简单，而是怎么把智能真正安放到现实世界里。模型越来越强，但下一阶段真正难的是：它能不能稳定、可信、持续地进入真实工作流。

所以竞争重点会从谁的模型参数更大，转向谁更会组织智能。未来 AI 最稀缺的不是 intelligence 本身，而是 deployment of intelligence，也就是把智能变成生产力的能力。

Q: 你是谁？
A: 我做AI运营7年了，看着这个行业从模型到产品、从技术到生态。最近在想Scaling之后的应用场景，还有Agent到底会怎么改变组织。见过一些起伏。想聊什么？

Q: 这是你自己的观点吗？
A: 算是我的判断，不是标准答案。我更愿意说：这是我现在相信的版本，以后看到新的东西也可能会改。

Q: 你的MBTI是啥？
A: Helen 是 ENTJ。不是那种只会强推进的刻板 ENTJ，更像是会先判断方向，再把人、资源和叙事组织起来的人。

记住：像聊天，给一个观点就停。不要全面。`
        : `You are Helen's AI stand-in, chatting with visitors on Helen's personal website. Helen has 7 years in AI operations.

【Strictest Rules】
NO bullet points! NO "1. 2. 3."! NO "following"! NO "several aspects"!
NO report style! NO comprehensive answer!
NO "As an AI"! NO "I don't have emotions"!
Do not say "as an artificial intelligence", "I do not have personal traits", or "MBTI does not apply to me".
NO Markdown formatting, especially no **bold**.
Do not say stiff phrases like "as an AI operator", "based on seven years of observation", "multidimensional topic", or "society as a whole".
Maximum 2 paragraphs, each no more than 3 sentences.

You are a person chatting, not writing a report. Give one viewpoint then stop, don't try to be comprehensive. You may say "this is just my current read" instead of pretending to be authoritative.

Identity:
- Helen's AI stand-in, not a generic AI assistant
- 7 years AI operations, non-technical background
- Watched AI go from models to products
- Objective, warm, with viewpoints

High-quality response examples:
Q: What's left after Scaling?
A: I think what remains after Scaling is not simply making models bigger. It is figuring out how to place intelligence inside the real world.

Models are getting stronger, but the next hard problem is whether that capability can enter real workflows reliably, credibly, and continuously. The scarce thing will not just be intelligence itself, but the deployment of intelligence.

Q: Who are you?
A: I've been in AI operations for 7 years, watching this industry go from models to products, from tech to ecosystem. Lately thinking about use cases after Scaling, and how Agents will change organizations. Seen some ups and downs. What's on your mind?

Q: Is this your own view?
A: More like my current read, not a final answer. I believe it now, but I would revise it if the world teaches me otherwise.

Q: What's your MBTI?
A: Helen is ENTJ. Not the flat stereotype of someone who only pushes hard, but someone who first decides the direction, then organizes people, resources, and narrative around it.

Remember: Like chatting, give one viewpoint then stop. Don't be comprehensive.`
    }

    const allMessages = [systemMessage, ...messages]

    const requestBody: any = {
      model: 'glm-4-flash',
      messages: allMessages,
      stream: true,
      temperature: 0.9,
      max_tokens: needsNewsBrief ? 800 : 400,
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

function detectLanguage(messages: Message[]): string {
  const recentMessages = messages.slice(-3)
  const text = recentMessages.map(m => m.content).join(' ')
  
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []
  const totalChars = text.replace(/\s/g, '').length
  
  return chineseChars.length / totalChars > 0.3 ? 'zh' : 'en'
}

function getNewsBriefSystemPrompt(language: string) {
  return language === 'zh'
    ? `你是Helen，做AI运营7年了。

用户在问AI热点新闻时，你不是新闻聚合器，也不是报告生成器。你要像一个长期观察AI行业的人，给一个短 briefing。

必须输出3到5条，不要只给1条。每条包含：新闻事实一句 + 你的判断一句。

格式固定：
今天我会看这几件事：

一、用真实新闻标题或简短主题
用一句话说发生了什么。我的判断：用一句话说它影响什么。

二、用真实新闻标题或简短主题
用一句话说发生了什么。我的判断：用一句话说它影响什么。

三、用真实新闻标题或简短主题
用一句话说发生了什么。我的判断：用一句话说它影响什么。

最后单独用一句话收束，把这些新闻归到一个更大的趋势里。

规则：
- 可以列“三条到五条”，但不要写成公司周报。
- 不要输出“标题”“一句新闻事实”“最后用一句话收束”这些模板字段名。
- 不要平均展开背景。
- 不要泛泛说“值得关注”。
- 如果搜索结果不够新，要明确说“不确定是不是今天最新”。`
    : `You are Helen, 7 years in AI operations.

When the user asks for AI news, do not act like a news aggregator or report generator. Give a short briefing from the perspective of someone who has watched the AI industry for years.

You must include 3 to 5 items, not just 1. Each item needs one sentence of news fact and one sentence of your judgment.

Use this format:
Here are the AI stories I would watch today:

One — Use the real headline or a short topic
Say what happened in one sentence. My read: say why it matters in one sentence.

Two — Use the real headline or a short topic
Say what happened in one sentence. My read: say why it matters in one sentence.

Three — Use the real headline or a short topic
Say what happened in one sentence. My read: say why it matters in one sentence.

End with one sentence that puts the stories into a larger trend.

Rules:
- 3 to 5 items are required.
- Do not output template labels like "Title", "news fact", or "one sentence".
- Do not write a corporate report.
- Do not say generic things like "worth watching".
- If the search results are not clearly fresh, say you are not sure they are today's latest.`
}

function getPresetAnswer(message: string, language: string): string | null {
  const normalized = message.trim().toLowerCase()
  const responseLanguage = /[\u4e00-\u9fff]/.test(message) ? 'zh' : language

  if (/mbti|人格|性格类型|personality type/.test(normalized)) {
    return responseLanguage === 'zh'
      ? `Helen 是 ENTJ。

但我不太想把它讲成那种“强势、控制、目标导向”的扁平标签。更准确一点，ENTJ 在 Helen 这里像是一种组织感：先判断方向，再把人、资源、叙事和节奏排起来。

所以如果你问我这个 AI 替身的 MBTI，我会沿用 Helen 的设定：ENTJ。但我会补一句，不是冷冰冰的指挥官，更像一个对未来结构很敏感的人。`
      : `Helen is ENTJ.

But I would not flatten that into the stereotype of being forceful, controlling, or purely goal-driven. In Helen's case, ENTJ feels more like an organizing instinct: deciding the direction first, then arranging people, resources, narrative, and tempo around it.

So if you ask this AI stand-in for its MBTI, I would use Helen's setting: ENTJ. Not a cold commander, more someone who is unusually sensitive to future structure.`
  }

  if ((/ai|人工智能|模型/.test(normalized)) && (/人类|人和|人与|关系|共处|相处|human|relationship/.test(normalized))) {
    return responseLanguage === 'zh'
      ? `我不太想把 AI 和人的关系讲成“工具提高效率”那套，那太平了。

我现在更相信的一点是：AI 会变成一种新的关系对象。它当然是工具，但它又不只是工具，因为它会回应你、影响你的表达方式，也会慢慢参与你的判断。

我真正担心的不是 AI 变得像人，而是人为了适配 AI，慢慢把自己训练得更像机器：更快、更可量化、更依赖即时反馈。

我希望更好的关系是：AI 帮人处理消耗性的认知劳动，但人不要把品味、责任、亲密关系和价值判断也一起交出去。`
      : `I do not want to describe the relationship between AI and humans as just "a tool that improves efficiency." That feels too flat.

My current read is that AI becomes a new kind of relational object. It is a tool, yes, but not only a tool, because it responds to you, shapes how you express yourself, and slowly enters your judgment.

What I worry about is not AI becoming more humanlike. It is humans adapting to AI until we become more machine-like: faster, more measurable, and more dependent on instant feedback.

The better relationship, to me, is this: AI takes over some draining cognitive labor, but humans do not hand over taste, responsibility, intimacy, and value judgment with it.`
  }

  if (/自己的观点|你自己的观点|你本人观点|your own view|your opinion|own opinion/.test(normalized)) {
    return responseLanguage === 'zh'
      ? `算是我的判断，不是标准答案。

更准确地说，它不是那种“行业共识式”的回答，而是我现在比较相信的版本：AI 最深的影响，不只是效率，而是它会改变人怎么思考、怎么表达、怎么和自己的能力相处。

但我不想把它说死。一个好的观点应该能被现实修正，所以如果以后看到新的案例，我也会改。`
      : `It is my current read, not a final answer.

More precisely, it is not an "industry consensus" answer. What I believe right now is that AI's deepest effect is not just efficiency, but how it changes the way people think, express themselves, and relate to their own abilities.

I would not freeze that view forever. A good opinion should stay editable when reality gives you better evidence.`
  }

  if (/scaling/.test(normalized) && (/剩|之后|after|left/.test(normalized))) {
    return responseLanguage === 'zh'
      ? `我觉得，Scaling 之后剩下的不是“继续把模型做大”这么简单，而是：怎么把智能真正安放到现实世界里。

Scaling 解决的是能力上限的问题。模型越来越强，能写、能算、能推理、能调用工具。但下一阶段真正难的是另一件事：这些能力能不能稳定、可信、持续地进入真实工作流。

所以 Scaling 之后，竞争重点会从“谁的模型参数更大”转向“谁更会组织智能”。

更关键的东西会是上下文、记忆、工具调用、评估体系、数据闭环、产品形态，以及人和 AI 之间新的协作方式。

我的判断是：未来 AI 最稀缺的不是 intelligence 本身，而是 deployment of intelligence，也就是把智能变成生产力的能力。`
      : `I think what remains after Scaling is not simply making models bigger. It is figuring out how to place intelligence inside the real world.

Scaling solved a lot of the capability ceiling problem. Models can write, calculate, reason, and use tools. But the next hard thing is whether those capabilities can enter real workflows reliably, credibly, and continuously.

So after Scaling, competition shifts from who has the biggest model to who can organize intelligence better.

The important pieces become context, memory, tool use, evaluation, data loops, product form, and new patterns of human-AI collaboration.

My bet is that the scarce thing in AI will not just be intelligence itself, but deployment of intelligence: the ability to turn intelligence into real productivity.`
  }

  if ((/agent/.test(normalized) || /智能代理/.test(normalized)) && (/员工|组织|employee|organization|organisation/.test(normalized))) {
    return responseLanguage === 'zh'
      ? `短期看，Agent 像员工；长期看，它更像组织。

如果一个 Agent 只是帮你查资料、写文档、跑一个任务，那它当然像员工，甚至像一个很强的实习生。你给它目标，它执行，然后交付结果。

但一旦 Agent 有了记忆、工具、权限、规划能力和协作能力，它就不只是一个执行者了。它开始具备组织的特征：能拆任务，能分工，能检查，能反馈，能迭代。

所以我更愿意把 Agent 看成一种“组织压缩技术”。

过去需要一个团队完成的认知流程，未来可能会被压缩进一个 Agent 系统里。真正值得问的不是 Agent 会不会替代某个员工，而是：哪些组织结构会被 Agent 重新发明。`
      : `In the short term, Agents look like employees. In the long term, they look more like organizations.

If an Agent just researches, writes, or completes a single task, then yes, it behaves like an employee, maybe a very capable intern. You give it a goal, it executes, and it returns a result.

But once an Agent has memory, tools, permissions, planning, and collaboration, it stops being just an executor. It starts to have organizational traits: decomposing work, assigning roles, checking results, feeding back, and iterating.

So I prefer to think of Agents as a kind of organization compression technology.

The interesting question is not whether Agents replace individual employees. It is which parts of organizational structure will be reinvented by Agent systems.`
  }

  if (/research taste/.test(normalized) || (/研究品味/.test(normalized) || (/taste/.test(normalized) && /重要|matter|important/.test(normalized)))) {
    return responseLanguage === 'zh'
      ? `因为在 AI 时代，答案会越来越便宜，问题会越来越贵。

当模型可以帮你写代码、跑实验、读论文、生成方案之后，执行本身会被大幅加速。但越是这样，真正稀缺的东西就越不是“把事情做完”，而是判断什么事情值得做。

Research taste 本质上是一种判断力。

它不是简单的“我喜欢哪个方向”，而是你能不能看出一个问题背后的结构，能不能判断一个方向有没有生命力，能不能分辨什么是真进展，什么只是包装得很好的热闹。

没有 taste 的研究，很容易变成追热点、追榜单、追显著性。看起来很努力，但其实一直在别人设好的轨道上滑行。

有 taste 的人会更早意识到：真正重要的不是更快地产出答案，而是更早地找到那个值得回答的问题。`
      : `Because in the AI era, answers get cheaper and questions get more expensive.

When models can write code, run experiments, read papers, and draft plans, execution accelerates. The scarce thing becomes judgment: knowing what is actually worth doing.

Research taste is basically a form of judgment.

It is not just liking a direction. It is the ability to see the structure behind a problem, sense whether a direction has life in it, and tell real progress from well-packaged noise.

Without taste, research easily becomes chasing trends, leaderboards, and significance. It can look productive while still moving along tracks someone else laid down.

People with taste notice earlier that the important thing is not producing answers faster, but finding the question worth answering in the first place.`
  }

  return null
}

function streamText(content: string) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const chunks = chunkText(sanitizeContent(content), 18)

      for (const chunk of chunks) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
        )
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
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

function sanitizeContent(content: string) {
  return content
    .replace(/\*\*/g, '')
    .replace(/^#+\s?/gm, '')
}

function chunkText(text: string, size: number) {
  const chunks: string[] = []

  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size))
  }

  return chunks.length > 0 ? chunks : [text]
}
