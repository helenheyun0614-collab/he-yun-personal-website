import './globals.css'
import { Inter, Playfair_Display } from 'next/font/google'
import { Metadata, Viewport } from 'next'
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
}

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
  twitter: {
    card: 'summary_large_image',
    title: 'Helen Heyun — AI Ecosystem Builder',
    description: 'Building AGI-native ecosystems, connecting research with industry, and cultivating the next generation of AI talent.',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Helen Heyun',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={playfair.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <BackgroundAtmosphere />
          <div className="relative z-10">
            <Navbar />
            <main>{children}</main>
            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  )
}
