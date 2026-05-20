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
    <section 
      id="interact" 
      className="section-padding relative z-10"
      style={{ background: 'transparent' }}
    >
      <div className="container-max max-w-4xl">
        <div className="mb-8">
          <p 
            className="mono-text text-xs mb-4"
            style={{ color: 'var(--brand)' }}
          >
            INTERACT
          </p>
          <h2 
            className="editorial-heading text-3xl md:text-4xl"
            style={{ color: 'var(--text-hero)' }}
          >
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
                  className="max-w-[80%] p-4"
                  style={{
                    background: message.role === 'user' 
                      ? 'var(--surface-active)' 
                      : 'var(--surface)',
                    border: `1px solid ${message.role === 'user' ? 'var(--border-hover)' : 'var(--border-color)'}`,
                    color: message.role === 'user' ? 'var(--brand)' : 'var(--text-main)',
                    borderRadius: 'var(--border-radius)',
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div 
                  className="p-4"
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--border-radius)',
                  }}
                >
                  <div className="flex gap-1">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'var(--brand)', opacity: 0.6, animation: 'pulse 1.5s ease-in-out infinite' }}
                    />
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'var(--brand)', opacity: 0.6, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }}
                    />
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'var(--brand)', opacity: 0.6, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <form 
            onSubmit={handleSend} 
            className="p-6"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={t('chat.placeholder')}
                className="flex-1 px-4 py-3 text-sm focus:outline-none transition-colors"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--text-main)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="px-6 py-3 text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--surface-active)',
                  color: 'var(--brand)',
                  border: '1px solid var(--border-hover)',
                  borderRadius: 'var(--border-radius)',
                }}
              >
                {t('chat.send')}
              </button>
            </div>
          </form>
        </div>

        {/* 示例问题 */}
        <div className="mt-6">
          <p 
            className="mono-text text-xs mb-3"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {t('chat.suggested')}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestedQuestion(question)}
                className="px-3 py-1.5 text-xs transition-all duration-300 cursor-pointer"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)'
                  e.currentTarget.style.color = 'var(--brand)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
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
