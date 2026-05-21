'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'

export function AIConsole() {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const { language, t } = useLanguage()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const shouldAutoScrollRef = useRef(true)

  // 自动滚动到底部 - 使用直接设置 scrollTop
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const scrollHeight = container.scrollHeight
      
      if (smooth) {
        // 平滑滚动
        container.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        })
      } else {
        // 立即滚动
        container.scrollTop = scrollHeight
      }
    }
  }, [])

  // 检测用户是否在查看历史消息
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 80
      shouldAutoScrollRef.current = isAtBottom
    }
  }, [])

  // 初始问候
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: t('chat.greeting')
      }
    ])
  }, [language, t])

  // 流式输出时自动滚动
  useEffect(() => {
    if (streamingContent && shouldAutoScrollRef.current) {
      // 使用 requestAnimationFrame 确保在 DOM 更新后滚动
      requestAnimationFrame(() => {
        scrollToBottom(false) // 流式输出时用即时滚动，避免卡顿
      })
    }
  }, [streamingContent, scrollToBottom])

  // 新消息添加后滚动
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom(true)
    })
  }, [messages, scrollToBottom])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    // 保留当前已生成的内容
    if (streamingContent) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: streamingContent
      }])
    }
    
    setIsStreaming(false)
    setStreamingContent('')
  }

  const sendMessage = async (userMessage: string) => {
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }]

    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')
    shouldAutoScrollRef.current = true

    // 创建 AbortController
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

      // 处理流式响应
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
              } catch (e) {
                // 跳过解析错误
              }
            }
          }
        }
      }

      // 完成
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fullContent
      }])
      setStreamingContent('')

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // 用户中止，已在上面的 stopStreaming 处理
      } else {
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
    
    // 立即滚动到底部
    shouldAutoScrollRef.current = true
    scrollToBottom(false)
    
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

        {/* 聊天界面 */}
        <div className="glass-card relative z-20">
          {/* 消息区域 */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="p-6 space-y-6 min-h-[300px] max-h-[500px] overflow-y-auto overflow-x-hidden"
            style={{ 
              scrollBehavior: 'smooth',
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

            {/* 流式输出内容 */}
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

            {/* 等待响应指示器 */}
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

            {/* 滚动锚点 */}
            <div ref={messagesEndRef} style={{ height: '1px' }} />
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
              
              {/* Stop按钮或Send按钮 */}
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="px-6 py-3 text-sm font-medium transition-all duration-300 flex items-center gap-2"
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
              )}
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
                disabled={isStreaming}
                className="px-3 py-1.5 text-xs transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* CSS动画 */}
      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </section>
  )
}
