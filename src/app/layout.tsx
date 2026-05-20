import './globals.css'
import { Inter, Playfair_Display } from 'next/font/google'
import { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { LanguageProvider } from '@/contexts/language-context'
import BackgroundAtmosphere from '@/components/ui/BackgroundAtmosphere'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Helen Heyun — AI Ecosystem Builder',
  description: 'Building AGI-native ecosystems, connecting research with industry, and cultivating the next generation of AI talent.',
  keywords: ['AI', 'AGI', 'Ecosystem Builder', 'Research', 'Education', 'Innovation'],
  authors: [{ name: 'Helen Heyun' }],
  creator: 'Helen Heyun — AI Ecosystem Builder',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Helen Heyun — AI Ecosystem Builder',
    description: 'Building AGI-native ecosystems, connecting research with industry, and cultivating the next generation of AI talent.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${inter.className} ${playfair.variable}`}>
      <body
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: '#0B0F14', color: 'var(--text-main)' }}
      >
        <LanguageProvider>
          <BackgroundAtmosphere />
          <Navbar />
          <main className="flex-1 relative z-10">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  )
}
