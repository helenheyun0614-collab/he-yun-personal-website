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
    <nav className={`fixed w-full z-50 transition-all duration-500 ${
      isScrolled
        ? 'bg-background/80 backdrop-blur-md border-b border-white/5'
        : 'bg-transparent'
    }`}>
      <div className="section-padding">
        <div className="container-max flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-lg font-light text-text-main tracking-tight">
              Helen Heyun
            </span>
            <span className="text-sm text-secondary hidden md:inline-block ml-2">
              | {language === 'en' ? 'AI TIME | AI Ecosystem Builder' : 'AI TIME | 生态构建 · 社区连接 · AI传播'}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="mono-text text-xs text-tertiary hover:text-primary transition-colors"
              >
                {t(item.key)}
              </a>
            ))}

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="mono-text text-xs px-3 py-1.5 bg-surface hover:bg-surfaceHover border border-white/10 rounded-lg transition-all duration-300"
            >
              {language === 'en' ? '中文' : 'EN'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-text-main hover:text-primary transition-colors"
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
          <div className="md:hidden mt-4 pt-4 border-t border-white/10">
            <div className="space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className="block mono-text text-xs text-tertiary hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t(item.key)}
                </a>
              ))}

              {/* Mobile Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="w-full mono-text text-xs px-4 py-2 bg-surface hover:bg-surfaceHover border border-white/10 rounded-lg transition-all duration-300"
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
