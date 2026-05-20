'use client'

import { useState, useEffect } from 'react'
import { HeroImage } from './hero-image'
import { useLanguage } from '@/contexts/language-context'

export function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { language } = useLanguage()

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 8 + Math.random() * 8,
    size: 1 + Math.random() * 2
  }))

  const content = {
    zh: {
      name: 'Helen Heyun',
      tagline: 'Building research ecosystems for the AGI era',
      roles: 'Operator · Observer · Connector',
      rolesSub: 'between frontier labs and future talent',
      focusTitle: 'Current Focus',
      focusItems: ['AGI infrastructure', 'Research ecosystems', 'Human-AI collaboration']
    },
    en: {
      name: 'Helen Heyun',
      tagline: 'Building research ecosystems for the AGI era',
      roles: 'Operator · Observer · Connector',
      rolesSub: 'between frontier labs and future talent',
      focusTitle: 'Current Focus',
      focusItems: ['AGI infrastructure', 'Research ecosystems', 'Human-AI collaboration']
    }
  }

  const c = content[language]

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'transparent' }}>
      {/* 动态粒子背景 */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              background: 'var(--brand)',
              opacity: 0.2,
              animation: 'float 8s ease-in-out infinite',
            }}
          />
        ))}
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 px-6 md:px-12 w-full py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 justify-center">
            {/* 左侧：文字内容 */}
            <div
              className="space-y-8 w-full lg:w-3/5"
              style={{
                transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
              }}
            >
              <div className="animate-blur-in">
                {/* 名字 */}
                <h1 
                  className="text-5xl md:text-6xl lg:text-7xl font-heading font-light leading-tight mb-6"
                  style={{ 
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-hero)'
                  }}
                >
                  {c.name}
                </h1>

                {/* 标语 */}
                <p 
                  className="text-xl md:text-2xl font-light mb-6 leading-relaxed"
                  style={{ 
                    color: 'var(--brand)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {c.tagline}
                </p>

                {/* 角色定位 */}
                <div className="mb-8">
                  <p 
                    className="text-lg md:text-xl mb-2"
                    style={{ color: 'var(--text-main)' }}
                  >
                    {c.roles}
                  </p>
                  <p 
                    className="text-base md:text-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {c.rolesSub}
                  </p>
                </div>

                {/* Current Focus */}
                <div className="glass-card p-6 inline-block">
                  <p 
                    className="mono-text text-xs mb-3"
                    style={{ color: 'var(--brand)' }}
                  >
                    {c.focusTitle}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {c.focusItems.map((item, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-sm"
                        style={{
                          background: 'var(--surface)',
                          color: 'var(--text-main)',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：照片展示 */}
            <div
              className="relative h-72 md:h-[400px] lg:h-[450px] w-full lg:w-2/5 flex items-center justify-center"
              style={{
                transform: `translate(${-mousePosition.x * 0.08}px, ${-mousePosition.y * 0.08}px)`
              }}
            >
              <HeroImage />
            </div>
          </div>
        </div>
      </div>

      {/* 滚动提示 */}
      <div 
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-fade-in" 
        style={{ animationDelay: '2s' }}
      >
        <div 
          className="w-px h-16 mx-auto mb-2"
          style={{ 
            background: 'linear-gradient(to bottom, var(--brand), transparent)',
            opacity: 0.5
          }} 
        />
        <p 
          className="mono-text text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {language === 'zh' ? '向下探索' : 'scroll to explore'}
        </p>
      </div>
    </section>
  )
}
