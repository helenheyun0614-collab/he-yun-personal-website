'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'

interface Conversation {
  id: string
  title: string
  messages: Array<{role: 'user' | 'assistant', content: string}>
  createdAt: number
}

interface ChatSidebarProps {
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  isOpen: boolean
  onToggle: () => void
}

export function ChatSidebar({ 
  currentConversationId, 
  onSelectConversation, 
  onNewConversation,
  isOpen,
  onToggle
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const { language } = useLanguage()

  useEffect(() => {
    const stored = localStorage.getItem('chat-conversations')
    if (stored) {
      try {
        setConversations(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to load conversations:', e)
      }
    }
  }, [])

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const filtered = conversations.filter(c => c.id !== id)
    localStorage.setItem('chat-conversations', JSON.stringify(filtered))
    setConversations(filtered)
  }

  const clearAll = () => {
    if (confirm(language === 'zh' ? '确定要清空所有对话吗？' : 'Clear all conversations?')) {
      localStorage.removeItem('chat-conversations')
      setConversations([])
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return language === 'zh' ? '今天' : 'Today'
    if (diffDays === 1) return language === 'zh' ? '昨天' : 'Yesterday'
    if (diffDays < 7) return language === 'zh' ? `${diffDays}天前` : `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* 侧边栏 */}
      <div
        className={`
          fixed md:relative
          top-0 left-0
          h-screen
          z-50 md:z-0
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          width: isOpen ? '280px' : '0px',
          minWidth: isOpen ? '280px' : '0px',
          background: 'var(--background)',
          borderRight: isOpen ? '1px solid var(--border-color)' : 'none',
          flexShrink: 0,
        }}
      >
        {isOpen && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* 头部 */}
            <div className="p-4 pt-16 md:pt-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={onNewConversation}
                className="w-full px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  color: 'var(--text-main)',
                  minHeight: '48px',
                }}
              >
                <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {language === 'zh' ? '新对话' : 'New chat'}
              </button>
            </div>

            {/* 对话列表 */}
            <div className="flex-1 overflow-y-auto p-2">
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs px-4" style={{ color: 'var(--text-tertiary)' }}>
                    {language === 'zh' ? '暂无历史对话' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className="group p-3 rounded-lg cursor-pointer transition-all duration-200"
                      style={{
                        background: currentConversationId === conv.id 
                          ? 'var(--surface)' 
                          : 'transparent',
                        minHeight: '60px',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate" style={{ color: 'var(--text-main)' }}>
                            {conv.title}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                            {formatTime(conv.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 -mr-1"
                          style={{ color: 'var(--text-tertiary)', minHeight: '44px', minWidth: '44px' }}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部 */}
            {conversations.length > 0 && (
              <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={clearAll}
                  className="w-full px-4 py-3 text-xs transition-all duration-200"
                  style={{ 
                    color: 'var(--text-tertiary)',
                    minHeight: '44px',
                  }}
                >
                  {language === 'zh' ? '清空所有对话' : 'Clear all conversations'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
