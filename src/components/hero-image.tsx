'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export function HeroImage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = ((e.clientX / window.innerWidth) - 0.5) * 12
      const y = ((e.clientY / window.innerHeight) - 0.5) * 12
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 背景光晕 - 品牌色呼吸效果 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="absolute w-80 h-80 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(127, 231, 196, 0.08) 0%, transparent 70%)',
            animation: 'breathGlow 6s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full blur-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(139, 233, 253, 0.06) 0%, transparent 70%)',
            animation: 'breathGlow 8s ease-in-out infinite',
            animationDelay: '2s',
          }}
        />
      </div>

      {/* 主照片容器 */}
      <div
        className="relative w-[85%] h-[90%] animate-fade-in"
        style={{
          transform: `perspective(1200px) rotateY(${mousePosition.x * 0.2}deg) rotateX(${-mousePosition.y * 0.2}deg) translateY(${isHovered ? '-4px' : '0'})`,
          transition: 'transform 0.2s ease-out',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 照片 */}
        <div 
          className="relative w-full h-full overflow-hidden"
          style={{
            borderRadius: 'var(--border-radius)',
            boxShadow: isHovered 
              ? '0 0 40px rgba(127, 231, 196, 0.12), 0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 0 20px rgba(127, 231, 196, 0.05), 0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          <Image
            src="/images/hero-photo.jpg"
            alt="Helen Heyun - AI Ecosystem Builder"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
            quality={95}
            className="object-cover transition-all duration-700"
            style={{
              filter: 'grayscale(20%) contrast(1.05) brightness(0.95)',
              opacity: 0.92,
              transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            }}
            onLoad={() => setIsLoaded(true)}
            priority
          />

          {/* 冷色调叠加层 */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(127, 231, 196, 0.05) 0%, transparent 50%, rgba(139, 233, 253, 0.05) 100%)',
              mixBlendMode: 'overlay',
            }}
          />

          {/* 边缘渐隐效果 */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 60px rgba(11, 15, 20, 0.5)',
            }}
          />

          {/* 微妙的边框 */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
            }}
          />
        </div>

        {/* 悬浮粒子 - 品牌色 */}
        <div 
          className="absolute -top-2 -right-2 w-5 h-5"
          style={{ animation: 'float 6s ease-in-out infinite' }}
        >
          <div 
            className="absolute inset-0 rounded-full blur-md"
            style={{ background: 'var(--brand)', opacity: 0.3 }}
          />
          <div 
            className="absolute inset-1.5 rounded-full blur-sm"
            style={{ background: 'var(--brand)', opacity: 0.4 }}
          />
        </div>

        <div 
          className="absolute -bottom-3 -left-3 w-6 h-6"
          style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '1s' }}
        >
          <div 
            className="absolute inset-0 rounded-full blur-md"
            style={{ background: 'var(--brand-highlight)', opacity: 0.25 }}
          />
          <div 
            className="absolute inset-2 rounded-full blur-sm"
            style={{ background: 'var(--brand-highlight)', opacity: 0.35 }}
          />
        </div>

        <div 
          className="absolute top-1/2 -right-5 w-3 h-3"
          style={{ animation: 'float 5s ease-in-out infinite', animationDelay: '0.5s' }}
        >
          <div 
            className="absolute inset-0 rounded-full blur-md"
            style={{ background: 'var(--brand)', opacity: 0.2 }}
          />
        </div>

        {/* 加载状态 */}
        {!isLoaded && (
          <div 
            className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
            style={{ 
              background: 'rgba(11, 15, 20, 0.8)',
              borderRadius: 'var(--border-radius)',
            }}
          >
            <div className="flex gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--brand)', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }}
              />
              <div 
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--brand)', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }}
              />
              <div 
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--brand)', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 研究档案风格的标注 */}
      <div 
        className="absolute bottom-4 left-4 mono-text text-[10px]"
        style={{ color: 'var(--text-tertiary)', opacity: 0.6 }}
      >
        AGI Ecosystem Builder
      </div>
    </div>
  )
}
