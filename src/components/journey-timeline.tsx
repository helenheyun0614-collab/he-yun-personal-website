'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface StoryMoment {
  id: string
  image: string
  year: string
  observation: string
}

export function JourneyTimeline() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const { language, t } = useLanguage()

  const storyMomentsEn: StoryMoment[] = [
    {
      id: '1',
      image: '/images/1.jpg',
      year: '2019',
      observation: 'AI begins to transform from technology into an era.'
    },
    {
      id: '2',
      image: '/images/2.jpg',
      year: '2020',
      observation: 'The future lies in human-AI collaboration.'
    },
    {
      id: '3',
      image: '/images/3.jpg',
      year: '2021',
      observation: 'Young people are redefining creativity.'
    },
    {
      id: '4',
      image: '/images/4.jpg',
      year: '2022',
      observation: 'The next generation needs to dance with AI.'
    },
    {
      id: '5',
      image: '/images/5.jpg',
      year: '2023',
      observation: 'Ecosystems will be the core competitiveness.'
    },
    {
      id: '6',
      image: '/images/6.jpg',
      year: '2023',
      observation: 'Connections matter more than code.'
    },
    {
      id: '7',
      image: '/images/7.jpg',
      year: '2024',
      observation: 'We are witnessing a cognitive evolution.'
    },
    {
      id: '8',
      image: '/images/8.jpg',
      year: '2025',
      observation: 'The future belongs to those who coexist with AI.'
    }
  ]

  const storyMomentsZh: StoryMoment[] = [
    {
      id: '1',
      image: '/images/1.jpg',
      year: '2019',
      observation: 'AI 开始从技术转变为一个时代。'
    },
    {
      id: '2',
      image: '/images/2.jpg',
      year: '2020',
      observation: '未来在于人机协作。'
    },
    {
      id: '3',
      image: '/images/3.jpg',
      year: '2021',
      observation: '年轻人正在重新定义创造力。'
    },
    {
      id: '4',
      image: '/images/4.jpg',
      year: '2022',
      observation: '下一代需要与 AI 共舞。'
    },
    {
      id: '5',
      image: '/images/5.jpg',
      year: '2023',
      observation: '生态系统将成为核心竞争力。'
    },
    {
      id: '6',
      image: '/images/6.jpg',
      year: '2023',
      observation: '连接比代码更重要。'
    },
    {
      id: '7',
      image: '/images/7.jpg',
      year: '2024',
      observation: '我们正在见证认知进化。'
    },
    {
      id: '8',
      image: '/images/8.jpg',
      year: '2025',
      observation: '未来属于与 AI 共生共存的人。'
    }
  ]

  const storyMoments = language === 'en' ? storyMomentsEn : storyMomentsZh

  useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % storyMoments.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [isPlaying, currentIndex])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % storyMoments.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + storyMoments.length) % storyMoments.length)
  }

  const getSlideStyle = (index: number) => {
    const diff = (index - currentIndex + storyMoments.length) % storyMoments.length

    if (diff === 0) {
      // 中间当前图片
      return {
        transform: 'translateX(0) scale(1)',
        opacity: 1,
        filter: 'grayscale(0)',
        zIndex: 3
      }
    } else if (diff === 1 || diff === storyMoments.length - 1) {
      // 两侧图片 - 大屏幕间距更紧凑，尺寸更大
      const isLeft = diff === storyMoments.length - 1
      return {
        transform: `translateX(${isLeft ? '-70%' : '70%'}) scale(0.85)`,
        opacity: 0.6,
        filter: 'grayscale(100%)',
        zIndex: 1
      }
    } else {
      // 其他隐藏图片
      return {
        transform: 'translateX(0) scale(0.7)',
        opacity: 0,
        filter: 'grayscale(100%)',
        zIndex: 0
      }
    }
  }

  return (
    <section id="journey" className="section-padding bg-background border-t border-white/5">
      <div className="container-max">
        {/* 标题 */}
        <div className="text-center mb-12">
          <p className="mono-text text-xs text-tertiary mb-4 tracking-wider">OBSERVATIONS</p>
          <h2 className="text-3xl md:text-4xl text-white font-light">
            {language === 'en' ? 'Journey Through the AI Era' : '穿越 AI 时代的历程'}
          </h2>
          <p className="text-xl text-secondary max-w-2xl mx-auto mt-4">
            {language === 'en' 
              ? 'In the AGI era, we are all participants and shapers.' 
              : '在 AGI 时代，我们都是参与者和塑造者。'}
          </p>
        </div>

        {/* 轮播展示 */}
        <div className="relative w-full h-[350px] md:h-[450px] lg:h-[550px] flex items-center justify-center overflow-hidden">
          {/* 轮播图片 */}
          <div className="absolute inset-0 flex items-center justify-center">
            {storyMoments.map((moment, index) => {
              const style = getSlideStyle(index)
              const isVisible = style.opacity > 0

              return (
                <div
                  key={moment.id}
                  className="absolute transition-all duration-700 ease-out"
                  style={style}
                >
                  {isVisible && (
                    <div className="relative w-[280px] md:w-[320px] lg:w-[400px] aspect-[3/4] overflow-hidden rounded-lg shadow-2xl">
                      <Image
                        src={moment.image}
                        alt={moment.year}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, (max-width: 640px) 100vw, (max-width: 750px) 100vw, (max-width: 1080px) 100vw"
                        priority
                      />

                      {/* 渐变覆盖 */}
                      <div
                        className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-transparent"
                        style={{ opacity: 0.3 }}
                      />

                      {/* 文字信息 */}
                      {index === currentIndex && (
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <p className="mono-text text-xs text-primary/90 mb-2 tracking-wider">
                            {moment.year}
                          </p>
                          <h3 className="text-white font-light leading-relaxed">
                            {moment.observation}
                          </h3>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 左侧按钮 */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-8 lg:left-12 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/30 z-10 group"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-[-4px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7" />
            </svg>
          </button>

          {/* 右侧按钮 */}
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-8 lg:right-12 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/30 z-10 group"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-[4px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 5" />
            </svg>
          </button>

          {/* 底部指示器 */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
            {storyMoments.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-white'
                    : 'bg-white/30 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
