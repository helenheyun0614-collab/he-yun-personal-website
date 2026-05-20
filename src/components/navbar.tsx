'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { key: 'nav.ecosystem', href: '#ecosystem' },
    { key: 'nav.interact', href: '#interact' },
    { key: 'nav.journey', href: '#journey' },
    { key: 'nav.contact', href: '#contact' },
  ]

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled
          ? 'backdrop-blur-md border-b'
          : 'bg-transparent'
      }`}
      style={{
        background: isScrolled ? 'rgba(11, 15, 20, 0.85)' : 'transparent',
        borderColor: isScrolled ? 'var(--border-color)' : 'transparent'
      }}
    >
      <div className="section-padding py-4">
        <div className="container-max flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: 'var(--brand)' }}
            />
            <span 
              className="text-lg font-light tracking-tight"
              style={{ color: 'var(--text-hero)' }}
            >
              Helen Heyun
            </span>
            <span 
              className="text-sm hidden md:inline-block ml-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              | {language === 'en' ? 'AI TIME | AI Ecosystem Builder' : 'AI TIME | 生态构建 · 社区连接 · AI传播'}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="mono-text text-xs transition-colors duration-300"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--brand)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-tertiary)'
                }}
              >
                {t(item.key)}
              </a>
            ))}

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="mono-text text-xs px-3 py-1.5 rounded-lg transition-all duration-300"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
              }}
            >
              {language === 'en' ? '中文' : 'EN'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 transition-colors"
            style={{ color: 'var(--text-main)' }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div 
            className="md:hidden mt-4 pt-4"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <div className="space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className="block mono-text text-xs transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t(item.key)}
                </a>
              ))}

              {/* Mobile Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="w-full mono-text text-xs px-4 py-2 rounded-lg transition-all duration-300"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                {language === 'en' ? '中文' : 'EN'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
