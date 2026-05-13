'use client'

import { Hero } from '@/components/hero'
import { ThinkingStream } from '@/components/thinking-stream'
import { Ecosystem } from '@/components/ecosystem'
import { AIConsole } from '@/components/ai-console'
import { Contact } from '@/components/contact'
import { JourneyTimeline } from '@/components/journey-timeline'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <ThinkingStream />
      <Ecosystem />
      <AIConsole />
      <Contact />
    </div>
  )
}
