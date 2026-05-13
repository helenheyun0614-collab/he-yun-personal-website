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
        background: 'var(--background)',
        surface: 'var(--surface)',
        surfaceHover: 'var(--surface-hover)',
        primary: 'var(--primary)',
        primaryDim: 'rgba(199, 210, 255, 0.6)',
        text: {
          main: 'var(--text-main)',
          secondary: 'var(--secondary)',
          tertiary: 'var(--tertiary)'
        }
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        // 额外的字体族支持
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
    },
  },
  plugins: [],
}
