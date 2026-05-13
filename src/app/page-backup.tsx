import { Hero } from '@/components/hero'
import { ThinkingStream } from '@/components/thinking-stream'
import { Ecosystem } from '@/components/ecosystem'
import { AIConsole } from '@/components/ai-console'
import { JourneyTimeline } from '@/components/journey-timeline'
import { Contact } from '@/components/contact'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <ThinkingStream />
      <Ecosystem />
      <AIConsole />
      <JourneyTimeline />
      <Contact />
    </div>
  )
}
