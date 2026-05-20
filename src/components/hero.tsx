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
      tagline: '为 AGI 时代构建研究生态系统',
      roles: '运营者 · 观察者 · 连接者',
      rolesSub: '连接前沿实验室与未来人才',
      focusTitle: '当前关注',
      focusItems: ['AGI 基础设施', '研究生态系统', '自我进化']
    },
    en: {
      name: 'Helen Heyun',
      tagline: 'Building research ecosystems for the AGI era',
      roles: 'Operator · Observer · Connector',
      rolesSub: 'between frontier labs and future talent',
      focusTitle: 'Current Focus',
      focusItems: ['AGI infrastructure', 'Research ecosystems', 'Self-evolution']
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
            <div className="flex-1 max-w-2xl" style={{ transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`, transition: 'transform 0.3s ease-out' }}>
              <div className="space-y-8">
                {/* 名字 */}
                <div>
                  <h1 
                    className="editorial-heading text-5xl md:text-6xl lg:text-7xl"
                    style={{ color: 'var(--text-hero)' }}
                  >
                    {c.name}
                  </h1>
                </div>

                {/* 标语 */}
                <div>
                  <p 
                    className="text-xl md:text-2xl lg:text-3xl font-light leading-relaxed"
                    style={{ color: 'var(--text-main)' }}
                  >
                    {c.tagline}
                  </p>
                </div>

                {/* 角色定位 */}
                <div className="space-y-3">
                  <p 
                    className="text-lg md:text-xl font-light tracking-wide"
                    style={{ color: 'var(--brand)' }}
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
                <div 
                  className="glass-card p-6 mt-8"
                  style={{ maxWidth: '400px' }}
                >
                  <p 
                    className="mono-text text-xs mb-4"
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

            {/* 右侧：照片 */}
            <div 
              className="flex-1 max-w-md lg:max-w-lg h-[400px] md:h-[500px] lg:h-[600px]"
              style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`, transition: 'transform 0.3s ease-out' }}
            >
              <HeroImage />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
