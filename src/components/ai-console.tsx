'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'

export function AIConsole() {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const { language, t } = useLanguage()

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: t('chat.greeting')
      }
    ])
  }, [language])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!input.trim() || isTyping) return

    const userMessage = input.trim()
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }]

    setMessages(newMessages)
    setInput('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: newMessages
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message.content
      }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('chat.error')
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    // 自动提交
    setTimeout(async () => {
      const newMessages = [...messages, { role: 'user' as const, content: question }]

      setMessages(newMessages)
      setInput('')
      setIsTyping(true)

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: newMessages
          })
        })

        if (!response.ok) {
          throw new Error('Failed to get response')
        }

        const data = await response.json()

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message.content
        }])
      } catch (error) {
        console.error('Chat error:', error)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: t('chat.error')
        }])
      } finally {
        setIsTyping(false)
      }
    }, 300)
  }

  const suggestedQuestionsEn = [
    "What's left after Scaling?",
    "Are Agents more like employees or organizations?",
    "Why does research taste matter?",
    "What will be scarcer than models?",
    "Will AI rewrite organizational structures?",
    "Search for today's AI news"
  ]

  const suggestedQuestionsZh = [
    "Scaling 之后还剩什么？",
    "Agent 更像员工还是组织？",
    "为什么 research taste 很重要？",
    "什么会比模型更稀缺？",
    "AI 会重写组织结构吗？",
    "搜索今天的AI热点新闻"
  ]

  const suggestedQuestions = language === 'en' ? suggestedQuestionsEn : suggestedQuestionsZh

  return (
    <section id="interact" className="section-padding bg-background border-t border-white/5 relative z-10">
      <div className="container-max max-w-4xl">
        <div className="mb-8">
          <p className="mono-text text-xs text-tertiary mb-4">INTERACT</p>
          <h2 className="editorial-heading text-3xl md:text-4xl">
            {t('chat.title')}
          </h2>
        </div>

        {/* 聊天界面 */}
        <div className="glass-card relative z-20">
          {/* 消息区域 */}
          <div className="p-6 space-y-6 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 ${
                    message.role === 'user'
                      ? 'bg-primary/10 text-text-main border border-primary/20'
                      : 'bg-surface text-secondary'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-surface p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse delay-100" />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <form onSubmit={handleSend} className="p-6 border-t border-white/5">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={t('chat.placeholder')}
                className="flex-1 bg-background border border-white/10 rounded-lg px-4 py-3 text-sm text-text-main placeholder-tertiary focus:outline-none focus:border-primary/30 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="px-6 py-3 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-primary/20"
              >
                {t('chat.send')}
              </button>
            </div>
          </form>
        </div>

        {/* 示例问题 */}
        <div className="mt-6">
          <p className="mono-text text-xs text-tertiary mb-3">{t('chat.suggested')}</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestedQuestion(question)}
                className="px-3 py-1.5 bg-surface hover:bg-surfaceHover border border-white/10 rounded-full text-xs text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
