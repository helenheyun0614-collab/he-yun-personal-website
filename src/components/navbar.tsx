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

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const navItems = [
    { key: 'nav.ecosystem', href: '#ecosystem' },
    { key: 'nav.interact', href: '#interact' },
    { key: 'nav.journey', href: '#journey' },
    { key: 'nav.contact', href: '#contact' },
  ]

  return (
    <>
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
        <div className="px-5 md:px-12 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: 'var(--brand)' }}
              />
              <span 
                className="text-base md:text-lg font-light tracking-tight"
                style={{ color: 'var(--text-hero)' }}
              >
                Helen Heyun
              </span>
              <span 
                className="text-xs md:text-sm hidden md:inline-block ml-2"
                style={{ color: 'var(--text-tertiary)' }}
              >
                | AI TIME
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

              <button
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="mono-text text-xs px-3 py-1.5 rounded-lg transition-all duration-300"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                {language === 'en' ? '中文' : 'EN'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 -mr-2"
              style={{ color: 'var(--text-main)', minHeight: '44px', minWidth: '44px' }}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          
          <div 
            className="fixed top-0 left-0 h-full w-[280px] z-[70] md:hidden transform transition-transform duration-300 ease-out"
            style={{ 
              background: 'var(--background)',
              borderRight: '1px solid var(--border-color)',
            }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-base font-light" style={{ color: 'var(--text-hero)' }}>Menu</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 -mr-2"
                  style={{ color: 'var(--text-main)', minHeight: '44px', minWidth: '44px' }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-5">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <a
                      key={item.key}
                      href={item.href}
                      className="block py-3 px-4 text-base rounded-lg transition-colors"
                      style={{ color: 'var(--text-main)', minHeight: '48px' }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t(item.key)}
                    </a>
                  ))}
                </div>
              </div>

              <div className="p-5 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={() => {
                    setLanguage(language === 'en' ? 'zh' : 'en')
                    setIsMenuOpen(false)
                  }}
                  className="w-full py-3 px-4 text-sm rounded-lg transition-colors"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', minHeight: '48px' }}
                >
                  {language === 'en' ? '切换至中文' : 'Switch to English'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
