'use client'

import { useState, useEffect } from 'react'

interface Theme {
  name: string
  id: string
  description: string
  colors: {
    background: string
    backgroundGradient: string
    text: string
    primary: string
    primaryGlow: string
    secondary: string
    tertiary: string
    surface: string
    surfaceHover: string
    border: string
  }
  fonts: {
    heading: string
    body: string
    mono: string
  }
  effects: {
    particleColor: string
    glassOpacity: string
    shadowIntensity: string
  }
  styles: {
    borderRadius: string
    borderWidth: string
  }
}

const themes: Theme[] = []

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('neon-purple')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setCurrentTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  const applyTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId)
    if (!theme) return

    const root = document.documentElement

    root.style.setProperty('--background', theme.colors.background)
    root.style.setProperty('--background-gradient', theme.colors.backgroundGradient)
    root.style.setProperty('--text-main', theme.colors.text)
    root.style.setProperty('--primary', theme.colors.primary)
    root.style.setProperty('--primary-glow', theme.colors.primaryGlow)
    root.style.setProperty('--secondary', theme.colors.secondary)
    root.style.setProperty('--tertiary', theme.colors.tertiary)
    root.style.setProperty('--surface', theme.colors.surface)
    root.style.setProperty('--surface-hover', theme.colors.surfaceHover)
    root.style.setProperty('--border-color', theme.colors.border)

    root.style.setProperty('--font-heading', theme.fonts.heading)
    root.style.setProperty('--font-body', theme.fonts.body)
    root.style.setProperty('--font-mono', theme.fonts.mono)

    root.style.setProperty('--particle-color', theme.effects.particleColor)
    root.style.setProperty('--glass-opacity', theme.effects.glassOpacity)
    root.style.setProperty('--shadow-intensity', theme.effects.shadowIntensity)

    root.style.setProperty('--border-radius', theme.styles.borderRadius)
    root.style.setProperty('--border-width', theme.styles.borderWidth)

    document.body.style.fontFamily = theme.fonts.body

    localStorage.setItem('theme', themeId)
    setCurrentTheme(themeId)
    setIsOpen(false)
  }

  const getCurrentTheme = () => {
    return themes.find(t => t.id === currentTheme) || { name: '', colors: { primary: '#000' }, description: '' }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-surfaceHover border border-white/10 rounded-lg transition-all duration-300"
        title="切换主题"
      >
        <div
          className="w-4 h-4 rounded-full border border-white/20 shadow-lg"
          style={{ backgroundColor: getCurrentTheme().colors.primary }}
        />
        <span className="mono-text text-xs text-tertiary hidden md:block">
          {getCurrentTheme().name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-surface border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              className={`w-full p-4 transition-all duration-200 text-left ${
                currentTheme === theme.id
                  ? 'bg-primary/10 border-l-4 border-primary'
                  : 'hover:bg-surfaceHover border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-lg border-2"
                    style={{
                      background: theme.colors.backgroundGradient,
                      borderColor: theme.colors.border,
                      borderRadius: theme.styles.borderRadius
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className="text-sm font-medium"
                      style={{ color: theme.colors.primary }}
                    >
                      {theme.name}
                    </h4>
                    {currentTheme === theme.id && (
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                    )}
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: theme.colors.tertiary }}
                  >
                    {theme.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
