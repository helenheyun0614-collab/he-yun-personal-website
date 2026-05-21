'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'

export function AIConsole() {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const { language, t } = useLanguage()
  
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const scrollRafRef = useRef<number | null>(null)

  // 防抖滚动 - 降低频率但不阻塞 UI
  const scrollToBottom = useCallback(() => {
    // 取消之前的滚动请求
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current)
    }
    
    // 使用 requestAnimationFrame 批量处理
    scrollRafRef.current = requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current
        container.scrollTop = container.scrollHeight
      }
      scrollRafRef.current = null
    })
  }, [])

  // 初始问候
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: t('chat.greeting')
      }
    ])
    setTimeout(scrollToBottom, 100)
  }, [language, t, scrollToBottom])

  // 流式输出时滚动（已由防抖处理）
  useEffect(() => {
    if (streamingContent) {
      scrollToBottom()
    }
  }, [streamingContent, scrollToBottom])

  // 新消息添加后滚动
  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

  // 清理
  useEffect(() => {
    return () => {
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current)
      }
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    if (streamingContent) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: streamingContent
      }])
    }
    
    setIsStreaming(false)
    setStreamingContent('')
  }, [streamingContent])

  const sendMessage = async (userMessage: string) => {
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }]

    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: newMessages
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.content || ''
                fullContent += content
                setStreamingContent(fullContent)
              } catch (e) {}
            }
          }
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fullContent
      }])
      setStreamingContent('')

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: t('chat.error')
        }])
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!input.trim() || isStreaming) return
    await sendMessage(input.trim())
  }

  const handleSuggestedQuestion = async (question: string) => {
    if (isStreaming) return
    scrollToBottom()
    await sendMessage(question)
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

        <div className="glass-card relative z-20">
          <div 
            ref={messagesContainerRef}
            className="p-6 space-y-6 min-h-[300px] max-h-[500px] overflow-y-auto overflow-x-hidden"
            style={{ 
              scrollbarWidth: 'thin',
              overscrollBehavior: 'contain',
            }}
          >
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

            {isStreaming && streamingContent && (
              <div className="flex justify-start">
                <div
                  className="max-w-[80%] p-4"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: 'var(--border-radius)',
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {streamingContent}
                    <span 
                      className="inline-block w-0.5 h-4 ml-0.5"
                      style={{ 
                        background: 'var(--brand)',
                        animation: 'blink 1s infinite',
                        verticalAlign: 'middle'
                      }}
                    />
                  </p>
                </div>
              </div>
            )}

            {isStreaming && !streamingContent && (
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
                placeholder={isStreaming ? 'Response in progress...' : t('chat.placeholder')}
                disabled={isStreaming}
                className="flex-1 px-4 py-3 text-sm focus:outline-none transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--text-main)',
                }}
                onFocus={(e) => {
                  if (!isStreaming) {
                    e.currentTarget.style.borderColor = 'var(--border-hover)'
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                }}
              />
              
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="px-6 py-3 text-sm font-medium transition-all duration-300 flex items-center gap-2 cursor-pointer hover:opacity-80"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--border-radius)',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" />
                  </svg>
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-6 py-3 text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: 'var(--surface-active)',
                    color: 'var(--brand)',
                    border: '1px solid var(--border-hover)',
                    borderRadius: 'var(--border-radius)',
                  }}
                >
                  {t('chat.send')}
                </button>
              )}
            </div>
          </form>
        </div>

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
                disabled={isStreaming}
                className="px-3 py-1.5 text-xs transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--text-secondary)',
                }}
                title={isStreaming ? 'Current response in progress' : ''}
                onMouseEnter={(e) => {
                  if (!isStreaming) {
                    e.currentTarget.style.borderColor = 'var(--border-hover)'
                    e.currentTarget.style.color = 'var(--brand)'
                  }
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

      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </section>
  )
}
