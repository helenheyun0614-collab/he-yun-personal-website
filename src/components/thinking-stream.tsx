'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { useInView } from 'react-intersection-observer'
import { useLanguage } from '@/contexts/language-context'

const PARTICLES = [
  { left: '6%', top: '18%', d: 0, dur: 16 },
  { left: '14%', top: '72%', d: 1.2, dur: 12 },
  { left: '22%', top: '34%', d: 2.1, dur: 18 },
  { left: '78%', top: '22%', d: 0.4, dur: 14 },
  { left: '88%', top: '58%', d: 2.8, dur: 13 },
  { left: '52%', top: '12%', d: 1.6, dur: 20 },
  { left: '68%', top: '78%', d: 0.9, dur: 15 },
  { left: '38%', top: '86%', d: 2.4, dur: 17 },
  { left: '92%', top: '38%', d: 1.1, dur: 11 },
  { left: '10%', top: '48%', d: 2.6, dur: 19 },
  { left: '44%', top: '64%', d: 0.2, dur: 14 },
  { left: '58%', top: '42%', d: 1.9, dur: 16 },
]

const COORD_KEYS = ['research.coord.1', 'research.coord.2', 'research.coord.3', 'research.coord.4', 'research.coord.5', 'research.coord.6'] as const

export function ThinkingStream() {
  const { ref: sectionRef, inView } = useInView({
    triggerOnce: true,
    threshold: 0.08,
    rootMargin: '0px 0px -10% 0px',
  })
  const { t, language } = useLanguage()
  const [hovered, setHovered] = useState<number | null>(null)
  const [pulseIndex, setPulseIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setPulseIndex((i) => (i + 1) % COORD_KEYS.length)
    }, 5600)
    return () => window.clearInterval(id)
  }, [])

  const activeIndex = hovered ?? pulseIndex
  const coords = COORD_KEYS.map((key) => t(key))
  const visible = inView ? 'research-console-in-view' : ''

  return (
    <section
      ref={sectionRef}
      className={`relative overflow-hidden border-t border-white/[0.04] bg-[#040406] ${visible}`}
    >
      <div className="pointer-events-none absolute inset-0 research-console-grid" aria-hidden />
      <div className="pointer-events-none absolute inset-0 research-console-noise mix-blend-overlay" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" aria-hidden />

      {PARTICLES.map((p) => (
        <span
          key={`${p.left}-${p.top}`}
          className="research-particle pointer-events-none absolute h-[3px] w-[3px] rounded-full bg-primary/40"
          style={
            {
              left: p.left,
              top: p.top,
              '--p-delay': `${p.d}s`,
              '--p-dur': `${p.dur}s`,
            } as CSSProperties
          }
          aria-hidden
        />
      ))}

      <div className="section-padding relative z-10">
        <div className="container-max">
          <div
            key={language}
            className={`mx-auto max-w-3xl transition-all duration-[950ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              inView ? 'translate-y-0 opacity-100' : 'translate-y-9 opacity-0'
            }`}
          >
            <div className="flex gap-10 md:gap-14 lg:gap-16">
              <div className="relative flex w-5 shrink-0 flex-col items-center pt-1 md:w-6">
                <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-gradient-to-b from-primary/[0.35] via-white/[0.07] to-transparent" />
                <div className="research-signal-dot relative z-[1] mt-0.5 h-2 w-2 rounded-full bg-primary/75 shadow-[0_0_14px_rgba(199,210,255,0.35)]" />
                <div className="mt-2 flex flex-col gap-2.5 pt-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1 w-1 rounded-full bg-white/15"
                      style={{ opacity: 1 - i * 0.25 }}
                    />
                  ))}
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-14 md:space-y-20">
                <header className="space-y-6">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="mono-text text-[10px] font-normal tracking-[0.22em] text-text-tertiary md:text-[11px]">
                      {t('research.statusWord')}
                    </span>
                    <span className="text-[10px] text-white/25 md:text-xs" aria-hidden>
                      {t('research.statusSep')}
                    </span>
                    <span className="font-heading text-sm font-light tracking-[0.18em] text-primary/90 md:text-base">
                      {t('research.statusState')}
                    </span>
                  </div>

                  <div className="space-y-5 border-l border-white/[0.06] pl-6 md:pl-8">
                    <p className="font-mono text-[10px] normal-case tracking-[0.2em] text-text-tertiary/90">
                      {t('research.thesisLabel')}
                    </p>
                    <blockquote className="font-playfair text-[1.35rem] font-light leading-[1.45] tracking-[-0.02em] text-text-secondary md:text-[1.65rem] md:leading-[1.5]">
                      <span className="text-white/[0.88]">{t('research.thesisQuote')}</span>
                      <span className="research-console-cursor ml-0.5 inline-block h-[1em] w-px translate-y-px align-middle bg-primary/55" aria-hidden />
                    </blockquote>
                  </div>
                </header>

                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] normal-case tracking-[0.2em] text-text-tertiary/90">
                      {t('research.coordsLabel')}
                    </span>
                    <div className="h-px max-w-[8rem] flex-1 bg-gradient-to-r from-white/12 to-transparent" />
                  </div>

                  <ul className="space-y-1">
                    {coords.map((label, i) => {
                      const isActive = i === activeIndex
                      return (
                        <li
                          key={`${language}-${i}`}
                          className="research-coord-row group relative"
                          style={{ '--row-i': i } as CSSProperties}
                          onMouseEnter={() => setHovered(i)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          <div
                            className={`research-coord-surface relative flex cursor-default items-start gap-4 rounded-lg border px-3 py-3.5 transition-[background-color,border-color,box-shadow] duration-500 md:gap-5 md:px-4 md:py-4 ${
                              isActive
                                ? 'border-white/[0.06] bg-[rgba(199,210,255,0.04)] shadow-[0_0_40px_rgba(199,210,255,0.06),inset_0_1px_0_rgba(255,255,255,0.04)]'
                                : 'border-transparent'
                            } hover:border-white/[0.05] hover:bg-white/[0.03]`}
                          >
                            <span className="relative mt-[0.55em] flex h-2 w-2 shrink-0 items-center justify-center">
                              <span
                                className={`absolute h-2 w-2 rounded-full transition-all duration-500 ${
                                  isActive ? 'bg-primary/50 shadow-[0_0_10px_rgba(199,210,255,0.4)]' : 'bg-white/12'
                                }`}
                              />
                              {isActive && (
                                <span className="research-coord-pulse-ring absolute h-2 w-2 rounded-full bg-primary/30" />
                              )}
                            </span>
                            <span
                              className={`text-[0.95rem] font-light leading-snug tracking-[-0.01em] transition-colors duration-500 md:text-[1.05rem] ${
                                isActive ? 'text-primary/95' : 'text-text-secondary group-hover:text-text-main'
                              }`}
                            >
                              {label}
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
