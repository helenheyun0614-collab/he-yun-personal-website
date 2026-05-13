'use client'

/**
 * Renders when the root layout fails. Must define html + body (replaces root layout).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#050505',
          color: '#e2e8f0',
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 300 }}>Something went wrong</h1>
        {error.digest ? <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Ref: {error.digest}</p> : null}
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
