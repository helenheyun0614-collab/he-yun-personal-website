'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { ChatSidebar } from './chat-sidebar'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

export function AIConsole() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const { language, t } = useLanguage()
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const scrollRafRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentConversation = conversations.find(c => c.id === currentConversationId)
  const messages = currentConversation?.messages || []

  useEffect(() => {
    const stored = localStorage.getItem('chat-conversations')
    if (stored) {
      try {
        const convs: Conversation[] = JSON.parse(stored)
        setConversations(convs)
        if (convs.length > 0) {
          setCurrentConversationId(convs[0].id)
        } else {
          createNewConversation()
        }
      } catch (e) {
        createNewConversation()
      }
    } else {
      createNewConversation()
    }
  }, [])

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('chat-conversations', JSON.stringify(conversations))
    }
  }, [conversations])

  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: language === 'zh' ? '新对话' : 'New conversation',
      messages: [{
        role: 'assistant',
        content: t('chat.greeting')
      }],
      createdAt: Date.now()
    }
    setConversations(prev => [newConv, ...prev])
    setCurrentConversationId(newConv.id)
    setSidebarOpen(false)
  }, [language, t])

  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id)
    setStreamingContent('')
    setIsStreaming(false)
    setSidebarOpen(false)
  }, [])

  const scrollToBottom = useCallback(() => {
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
    scrollRafRef.current = requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
      scrollRafRef.current = null
    })
  }, [])

  useEffect(() => {
    if (streamingContent) scrollToBottom()
  }, [streamingContent, scrollToBottom])

  useEffect(() => {
    if (messages.length > 1) scrollToBottom()
  }, [messages, scrollToBottom])

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (streamingContent && currentConversationId) {
      setConversations(prev => prev.map(c => 
        c.id === currentConversationId 
          ? { ...c, messages: [...c.messages, { role: 'assistant' as const, content: streamingContent }] }
          : c
      ))
    }
    setIsStreaming(false)
    setStreamingContent('')
  }, [streamingContent, currentConversationId])

  const sendMessage = async (userMessage: string) => {
    if (!currentConversationId) return

    setConversations(prev => prev.map(c => 
      c.id === currentConversationId 
        ? { 
            ...c, 
            title: c.messages.length <= 1 ? userMessage.slice(0, 30) : c.title,
            messages: [...c.messages, { role: 'user' as const, content: userMessage }]
          }
        : c
    ))

    setInput('')
    setIsStreaming(true)
    setStreamingContent('')
    abortControllerRef.current = new AbortController()

    try {
      const currentMessages = [...messages, { role: 'user' as const, content: userMessage }]
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) throw new Error('Failed')

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
                fullContent += parsed.content || ''
                setStreamingContent(fullContent)
              } catch (e) {}
            }
          }
        }
      }

      setConversations(prev => prev.map(c => 
        c.id === currentConversationId 
          ? { ...c, messages: [...c.messages, { role: 'assistant' as const, content: fullContent }] }
          : c
      ))
      setStreamingContent('')

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setConversations(prev => prev.map(c => 
          c.id === currentConversationId 
            ? { ...c, messages: [...c.messages, { role: 'assistant' as const, content: t('chat.error') }] }
            : c
        ))
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    await sendMessage(input.trim())
  }

  const handleSuggestedQuestion = async (question: string) => {
    if (isStreaming) return
    scrollToBottom()
    await sendMessage(question)
  }

  const suggestedQuestions = language === 'en' 
    ? ["What's left after Scaling?", "Are Agents more like employees or organizations?", "Why does research taste matter?", "What will be scarcer than models?", "Will AI rewrite organizational structures?", "Search for today's AI news"]
    : ["Scaling 之后还剩什么？", "Agent 更像员工还是组织？", "为什么 research taste 很重要？", "什么会比模型更稀缺？", "AI 会重写组织结构吗？", "搜索今天的AI热点新闻"]

  return (
    <section id="interact" className="section-padding relative z-10" style={{ background: 'transparent' }}>
      <div className="container-max">
        {/* Title - lighter weight on mobile */}
        <div className="mb-4 md:mb-6 lg:mb-8">
          <p className="mono-text text-xs mb-2 md:mb-3 lg:mb-4" style={{ color: 'var(--brand)' }}>INTERACT</p>
          <h2 className="editorial-heading text-xl md:text-2xl lg:text-4xl" style={{ color: 'var(--text-hero)', fontWeight: '300' }}>{t('chat.title')}</h2>
        </div>

        <div style={{ display: 'flex', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', paddingLeft: 'calc(50vw - 50%)', paddingRight: 'calc(50vw - 50%)' }}>
          <ChatSidebar
            currentConversationId={currentConversationId}
            onSelectConversation={selectConversation}
            onNewConversation={createNewConversation}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          <div style={{ flex: 1, minWidth: 0, padding: '0 0.5rem' }}>
            {/* Immersive conversation surface */}
            <div 
              className="glass-card"
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                minHeight: '42vh',
                maxHeight: '60vh',
                padding: 0,
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(127, 231, 196, 0.1)',
              }}
            >
              {/* Messages - immersive reading experience */}
              <div 
                ref={messagesContainerRef}
                style={{ 
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.5rem 1.25rem',
                  paddingBottom: '6rem',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[92%] md:max-w-[85%]"
                        style={{
                          padding: message.role === 'user' ? '12px 16px' : '0',
                          background: message.role === 'user' ? 'rgba(127, 231, 196, 0.08)' : 'transparent',
                          borderRadius: message.role === 'user' ? '16px' : '0',
                          color: message.role === 'user' ? 'var(--brand)' : 'var(--text-main)',
                        }}
                      >
                        <p 
                          className="text-base md:text-lg leading-relaxed whitespace-pre-wrap"
                          style={{ 
                            lineHeight: '1.8',
                            color: message.role === 'assistant' ? 'rgba(255, 255, 255, 0.85)' : 'var(--brand)',
                          }}
                        >
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isStreaming && streamingContent && (
                    <div className="flex justify-start">
                      <div className="max-w-[92%] md:max-w-[85%]">
                        <p 
                          className="text-base md:text-lg leading-relaxed whitespace-pre-wrap"
                          style={{ 
                            lineHeight: '1.8',
                            color: 'rgba(255, 255, 255, 0.85)',
                          }}
                        >
                          {streamingContent}
                          <span className="inline-block w-0.5 h-5 ml-1" style={{ background: 'var(--brand)', animation: 'blink 1s infinite' }} />
                        </p>
                      </div>
                    </div>
                  )}

                  {isStreaming && !streamingContent && (
                    <div className="flex justify-start">
                      <div className="flex gap-2 py-3">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-2 h-2 rounded-full" style={{ background: 'var(--brand)', opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed input area at bottom */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '1rem 1.25rem',
                  paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
                  background: 'linear-gradient(to top, var(--background) 80%, transparent)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                <form onSubmit={handleSend}>
                  <div className="flex flex-col gap-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isStreaming ? 'Generating...' : t('chat.placeholder')}
                      disabled={isStreaming}
                      className="w-full px-4 py-3.5 text-base focus:outline-none disabled:opacity-50"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        border: '1px solid rgba(127, 231, 196, 0.2)', 
                        borderRadius: '20px', 
                        color: 'var(--text-main)',
                        minHeight: '52px',
                        fontSize: '16px',
                      }}
                    />
                    
                    {isStreaming ? (
                      <button 
                        type="button" 
                        onClick={stopStreaming} 
                        className="w-full py-3.5 text-sm font-medium flex items-center justify-center gap-2"
                        style={{ 
                          background: 'rgba(239, 68, 68, 0.08)', 
                          color: '#ef4444', 
                          border: '1px solid rgba(239, 68, 68, 0.2)', 
                          borderRadius: '20px',
                          minHeight: '52px',
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" /></svg>
                        Stop Generating
                      </button>
                    ) : (
                      <button 
                        type="submit" 
                        disabled={!input.trim()} 
                        className="w-full py-3.5 text-sm font-medium disabled:opacity-50"
                        style={{ 
                          background: 'rgba(127, 231, 196, 0.08)', 
                          color: 'var(--brand)', 
                          border: '1px solid rgba(127, 231, 196, 0.2)', 
                          borderRadius: '20px',
                          minHeight: '52px',
                        }}
                      >
                        Send
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Floating preset questions - outside the main card */}
            <div 
              className="flex flex-wrap gap-2 mt-4"
              style={{ 
                justifyContent: 'center',
                opacity: isStreaming ? 0.3 : 1,
                pointerEvents: isStreaming ? 'none' : 'auto',
                transition: 'opacity 0.3s ease',
              }}
            >
              {suggestedQuestions.slice(0, 4).map((question, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestedQuestion(question)}
                  disabled={isStreaming}
                  className="px-4 py-2 text-xs md:text-sm transition-all duration-300 hover:scale-105"
                  style={{ 
                    background: 'rgba(127, 231, 196, 0.05)', 
                    border: '1px solid rgba(127, 231, 196, 0.15)', 
                    borderRadius: '20px', 
                    color: 'var(--text-secondary)',
                    minHeight: '40px',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }`}</style>
    </section>
  )
}
