'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'

export function AIConsole() {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const { language, t } = useLanguage()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const scrollRafRef = useRef<number | null>(null)

  // 自动滚动
  const scrollToBottom = useCallback(() => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current)
    }
    
    scrollRafRef.current = requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
      scrollRafRef.current = null
    })
  }, [])

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: t('chat.greeting')
      }
    ])
    setTimeout(scrollToBottom, 100)
  }, [language, t, scrollToBottom])

  useEffect(() => {
    if (streamingContent) {
      scrollToBottom()
    }
  }, [streamingContent, scrollToBottom])

  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

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

        {/* 极简聊天容器 */}
        <div 
          ref={containerRef}
          className="glass-card p-6 max-h-[600px] overflow-y-auto overflow-x-hidden"
          style={{ 
            scrollbarWidth: 'thin',
            overscrollBehavior: 'contain',
          }}
        >
          {/* 消息列表 */}
          <div className="space-y-4 mb-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%]"
                  style={{
                    padding: message.role === 'user' ? '12px 16px' : '0',
                    background: message.role === 'user' 
                      ? 'rgba(127, 231, 196, 0.1)' 
                      : 'transparent',
                    borderRadius: message.role === 'user' ? '16px' : '0',
                    color: message.role === 'user' ? 'var(--brand)' : 'var(--text-main)',
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {/* 流式输出 */}
            {isStreaming && streamingContent && (
              <div className="flex justify-start">
                <div 
                  className="max-w-[85%]"
                  style={{ padding: 0 }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-main)' }}>
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

            {/* 等待指示器 */}
            {isStreaming && !streamingContent && (
              <div className="flex justify-start">
                <div className="flex gap-1 py-2">
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--brand)', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }}
                  />
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--brand)', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }}
                  />
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--brand)', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 预设问题（在输入框上方） */}
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isStreaming}
                className="px-3 py-1.5 text-xs transition-all duration-200 disabled:opacity-40 cursor-pointer"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  color: 'var(--text-secondary)',
                }}
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

          {/* 输入框（跟随内容） */}
          <form onSubmit={handleSend}>
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={isStreaming ? 'Response in progress...' : t('chat.placeholder')}
                disabled={isStreaming}
                className="flex-1 px-4 py-3 text-sm focus:outline-none disabled:opacity-50"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
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
                  className="px-5 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '16px',
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
                  className="px-5 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  style={{
                    background: 'var(--surface-active)',
                    color: 'var(--brand)',
                    border: '1px solid var(--border-hover)',
                    borderRadius: '16px',
                  }}
                >
                  {t('chat.send')}
                </button>
              )}
            </div>
          </form>
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
