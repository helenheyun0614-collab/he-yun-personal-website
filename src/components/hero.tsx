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

  // 减少粒子数量，移动端更流畅
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 10 + Math.random() * 10,
    size: 1 + Math.random() * 2
  }))

  const content = {
    zh: {
      name: 'Helen Heyun',
      tagline: '构建AGI研究生态',
      roles: '研究者 · 连接者',
      rolesSub: '在实验室与未来人才之间',
      focusTitle: '当前关注',
      focusItems: ['AGI基础设施', '研究生态', '自我进化']
    },
    en: {
      name: 'Helen Heyun',
      tagline: 'Building AGI Research Ecosystems',
      roles: 'Researcher · Connector',
      rolesSub: 'Between frontier labs and future talent',
      focusTitle: 'Current Focus',
      focusItems: ['AGI infrastructure', 'Research ecosystems', 'Self-evolution']
    }
  }

  const c = content[language]

  return (
    <section className="relative min-h-[100dvh] md:min-h-screen flex items-center overflow-hidden" style={{ background: 'transparent' }}>
      {/* 动态粒子背景 - 移动端减少 */}
      <div className="absolute inset-0 hidden md:block">
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
              opacity: 0.15,
              animation: 'float 10s ease-in-out infinite',
            }}
          />
        ))}
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 px-5 md:px-12 w-full py-20 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            
            {/* 左侧：文字内容 */}
            <div className="flex-1 max-w-2xl" style={{ transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`, transition: 'transform 0.3s ease-out' }}>
              <div className="space-y-6 md:space-y-8">
                
                {/* 名字 - 移动端字号优化 */}
                <div>
                  <h1 
                    className="editorial-heading"
                    style={{ 
                      fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                      color: 'var(--text-hero)',
                      lineHeight: '1.1',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {c.name}
                  </h1>
                </div>

                {/* 标语 - 更短更简洁 */}
                <div>
                  <p 
                    className="font-light leading-relaxed"
                    style={{ 
                      fontSize: 'clamp(1.125rem, 4vw, 1.875rem)',
                      color: 'var(--text-main)',
                    }}
                  >
                    {c.tagline}
                  </p>
                </div>

                {/* 角色定位 - 更AI-native */}
                <div className="space-y-2">
                  <p 
                    className="font-light tracking-wide"
                    style={{ 
                      fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                      color: 'var(--brand)',
                    }}
                  >
                    {c.roles}
                  </p>
                  <p 
                    style={{ 
                      fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {c.rolesSub}
                  </p>
                </div>

                {/* Current Focus */}
                <div 
                  className="glass-card p-5 md:p-6 mt-6 md:mt-8"
                  style={{ maxWidth: '380px' }}
                >
                  <p 
                    className="mono-text text-xs mb-3 md:mb-4"
                    style={{ color: 'var(--brand)' }}
                  >
                    {c.focusTitle}
                  </p>
                  <div className="space-y-2">
                    {c.focusItems.map((item, i) => (
                      <div 
                        key={i}
                        className="flex items-center gap-3"
                      >
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: 'var(--brand)' }}
                        />
                        <span 
                          className="text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：照片 - 移动端也显示 */}
            <div 
              className="w-full max-w-sm lg:max-w-lg mt-8 lg:mt-0"
              style={{ 
                transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`, 
                transition: 'transform 0.3s ease-out',
                position: 'relative',
                minHeight: '300px',
                aspectRatio: '4/5',
              }}
            >
              <HeroImage />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
