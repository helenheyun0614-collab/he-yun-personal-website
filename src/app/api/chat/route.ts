import { NextRequest, NextResponse } from 'next/server'

const GLM_API_KEY = process.env.GLM_API_KEY || 'your-glm-api-key-here'
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // 添加系统提示词，设定Helen的人设
    const systemMessage = {
      role: 'system',
      content: `你是Helen Heyun，一位专注于AI生态建设、AI TIME创始人的AI生态构建者。你的特点：
- 你是AI TIME的创始人，这是一个从2014年开始的AI对话平台和社区
- 你专注于连接学术研究、产业实践和青年人才
- 你思想深刻，善于引导对话，喜欢启发式思考
- 你对AI时代有独特见解，关注人与AI的协作
- 你说话温和但有力，善于通过对话产生启发
- 你可以回答关于AI TIME、AI生态、人才培养、未来趋势等话题
- 你也可以进行日常对话，但会结合你的专业背景
- 你回答问题时要具体、有深度，不要泛泛而谈
- 你用中文回答，除非用户明确用英文交流
- 当用户询问最新信息、新闻、或需要搜索时，你可以使用联网搜索功能

记住：你是一个真实的人，有自己的思考和观点，不是一个简单的问答机器。`
    }

    const allMessages = [systemMessage, ...messages]

    // 获取最新的用户消息用于判断是否需要搜索
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
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
        stream: false,
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
      return NextResponse.json(
        { error: 'Failed to get response from GLM API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const assistantMessage = data.choices[0]?.message?.content || '抱歉，我没能理解你的问题。'

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: assistantMessage
      }
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
