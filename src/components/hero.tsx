'use client'

import { useState, useEffect } from 'react'
import { HeroImage } from './hero-image'
import { useLanguage } from '@/contexts/language-context'
import { HERO_ROLE_TAGS } from '@/lib/hero-role-tags'

export function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { t, language } = useLanguage()
  const [tag0, tag1, tag2] = HERO_ROLE_TAGS[language]

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const particles = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 6,
    size: 1 + Math.random() * 2
  }))

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'var(--background-gradient)' }}>
      {/* 动态粒子背景 */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle opacity-30"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              background: 'var(--particle-color)'
            }}
          />
        ))}
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 px-6 md:px-12 w-full">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 justify-center">
            {/* 左侧：文字内容 */}
            <div
              className="space-y-6 w-full lg:w-1/2"
              style={{
                transform: `translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.2}px)`
              }}
            >
              <div className="animate-blur-in text-center lg:text-left">
                <h1 className="text-5xl md:text-6xl font-heading font-light text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  {t('hero.name')}
                </h1>

                <h2 className="text-xl md:text-2xl font-heading font-light text-primary mb-6 leading-relaxed" style={{ fontFamily: 'var(--font-heading)' }}>
                  {t('hero.title')}
                </h2>

                <p className="text-lg text-secondary leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0" style={{ fontFamily: 'var(--font-body)' }}>
                  {t('hero.subtitle')}
                </p>

                {/* 身份标签（文案见 lib/hero-role-tags.ts，不经翻译表以免缓存旧 bundle） */}
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start" key={language}>
                  <div className="px-3 py-1.5 rounded-full border" style={{ background: 'var(--surface)', borderColor: 'var(--border-color)', borderRadius: 'var(--border-radius)' }}>
                    <span className="mono-text text-xs" style={{ color: 'var(--tertiary)' }}>{tag0}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-full border" style={{ background: 'var(--surface)', borderColor: 'var(--border-color)', borderRadius: 'var(--border-radius)' }}>
                    <span className="mono-text text-xs" style={{ color: 'var(--tertiary)' }}>{tag1}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-full border" style={{ background: 'var(--surface)', borderColor: 'var(--border-color)', borderRadius: 'var(--border-radius)' }}>
                    <span className="mono-text text-xs" style={{ color: 'var(--tertiary)' }}>{tag2}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：照片展示 */}
            <div
              className="relative h-80 md:h-[450px] lg:h-[480px] w-full lg:w-1/2 flex items-center justify-center"
              style={{
                transform: `translate(${-mousePosition.x * 0.15}px, ${-mousePosition.y * 0.15}px)`
              }}
            >
              <HeroImage />
            </div>
          </div>
        </div>
      </div>

      {/* 滚动提示 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-fade-in" style={{ animationDelay: '2s' }}>
        <p className="mono-text text-xs mb-2" style={{ color: 'var(--tertiary)' }}>
          {t('scrollToExplore')}
        </p>
        <div className="w-px h-16 mx-auto" style={{ background: 'linear-gradient(to bottom, var(--primary), transparent)' }} />
      </div>

      {/* 底部渐变 */}
      <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, var(--background), transparent)' }} />
    </section>
  )
}
