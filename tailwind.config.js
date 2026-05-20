/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 背景系统
        background: 'var(--background)',
        backgroundSecondary: 'var(--background-secondary)',
        
        // 卡片层
        surface: 'var(--surface)',
        surfaceHover: 'var(--surface-hover)',
        surfaceActive: 'var(--surface-active)',
        
        // 品牌色
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          highlight: 'var(--brand-highlight)',
          glow: 'var(--brand-glow)',
        },
        
        // 文字层次
        text: {
          hero: 'var(--text-hero)',
          main: 'var(--text-main)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        
        // 边框
        border: {
          DEFAULT: 'var(--border-color)',
          hover: 'var(--border-hover)',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
        orbitron: ['Orbitron', 'Rajdhani', 'sans-serif'],
        rajdhani: ['Rajdhani', 'Segoe UI', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
        lato: ['Lato', 'Helvetica Neue', 'sans-serif'],
        merriweather: ['Merriweather', 'Georgia', 'serif'],
        sourceSans: ['Source Sans Pro', 'Arial', 'sans-serif'],
        poppins: ['Poppins', 'Arial', 'sans-serif'],
        openSans: ['Open Sans', 'Helvetica', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 2s ease-out',
        'blur-in': 'blurIn 3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing': 'typing 3.5s steps(40, end)',
        'breath': 'breathGlow 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(10px)' },
          '100%': { opacity: '1', filter: 'blur(0px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        typing: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        breathGlow: {
          '0%, 100%': { opacity: '0.15', transform: 'scale(1)' },
          '50%': { opacity: '0.25', transform: 'scale(1.05)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        variable: 'var(--border-radius)',
      },
      borderWidth: {
        variable: 'var(--border-width)',
      },
      boxShadow: {
        'brand': '0 0 30px var(--brand-glow)',
        'brand-strong': '0 0 40px var(--brand-glow-strong)',
      },
    },
  },
  plugins: [],
}
