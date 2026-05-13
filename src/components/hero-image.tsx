'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export function HeroImage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = ((e.clientX / window.innerWidth) - 0.5) * 15
      const y = ((e.clientY / window.innerHeight) - 0.5) * 15
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 背景光晕 - 更柔和的动态效果 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-72 h-72 bg-primary/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-56 h-56 bg-secondary/6 rounded-full blur-2xl animate-pulse delay-700" />
        <div className="absolute w-40 h-40 bg-purple-500/5 rounded-full blur-xl animate-pulse delay-1400" />
      </div>

      {/* 主照片容器 - 淡入淡出边缘 */}
      <div
        className="relative w-[90%] h-[95%] animate-fade-in"
        style={{
          transform: `perspective(1200px) rotateY(${mousePosition.x * 0.3}deg) rotateX(${-mousePosition.y * 0.3}deg)`,
          transition: 'transform 0.15s ease-out'
        }}
      >
        {/* 照片 */}
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src="/images/hero-photo.jpg"
            alt="Helen Heyun - AI Ecosystem Builder"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
            quality={100}
            className="object-cover transition-transform duration-1000 hover:scale-105"
            onLoad={() => setIsLoaded(true)}
            priority
          />


          {/* 柔和的边缘光晕 */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10 rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-bl from-secondary/8 via-transparent to-primary/8 rounded-full" />
          </div>

          {/* 轻微的边框光效 */}
          <div className="absolute inset-0 border border-white/5 rounded-sm" />

          {/* 右上角动态光点 */}
          <div className="absolute top-6 right-6 w-3 h-3">
            <div className="absolute inset-0 bg-primary/40 rounded-full blur-lg animate-pulse" />
            <div className="absolute inset-1 bg-primary/60 rounded-full blur-md animate-pulse delay-300" />
          </div>
        </div>

        {/* 灵动的悬浮粒子 */}
        <div className="absolute -top-3 -right-3 w-6 h-6 animate-float">
          <div className="absolute inset-0 bg-primary/25 rounded-full blur-md animate-pulse" />
          <div className="absolute inset-1.5 bg-primary/40 rounded-full blur-sm animate-pulse delay-200" />
        </div>

        <div className="absolute -bottom-4 -left-4 w-8 h-8 animate-float" style={{ animationDelay: '1s' }}>
          <div className="absolute inset-0 bg-secondary/25 rounded-full blur-md animate-pulse" />
          <div className="absolute inset-2 bg-secondary/40 rounded-full blur-sm animate-pulse delay-400" />
        </div>

        <div className="absolute top-1/2 -right-6 w-4 h-4 animate-float" style={{ animationDelay: '0.5s' }}>
          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md animate-pulse" />
          <div className="absolute inset-1 bg-purple-500/35 rounded-full blur-sm animate-pulse delay-300" />
        </div>

        {/* 加载状态 */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-primary/50 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-primary/50 rounded-full animate-pulse delay-100" />
              <div className="w-2 h-2 bg-primary/50 rounded-full animate-pulse delay-200" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
