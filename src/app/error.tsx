'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <p className="mono-text text-[10px] tracking-[0.2em] text-text-tertiary">ERROR</p>
      <h1 className="font-heading text-2xl font-light text-text-main md:text-3xl">Something went wrong</h1>
      <p className="text-sm text-text-secondary leading-relaxed">
        {error.digest ? `Ref: ${error.digest}` : 'An unexpected error occurred while loading this page.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm text-text-main transition-colors hover:border-primary/30 hover:bg-white/[0.08]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-transparent px-5 py-2.5 text-sm text-primary transition-colors hover:text-primary/80"
        >
          Home
        </Link>
      </div>
    </div>
  )
}
