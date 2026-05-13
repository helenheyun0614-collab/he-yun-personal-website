export function Footer() {
  return (
    <footer className="py-8 bg-background border-t border-white/5">
      <div className="container-max">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/50" />
            <span className="mono-text text-xs text-tertiary">
              © 2024 Helen Heyun — AI Ecosystem Builder
            </span>
          </div>

          <div className="flex gap-6">
            <a href="#" className="mono-text text-xs text-tertiary hover:text-primary transition-colors">
              TWITTER
            </a>
            <a href="#" className="mono-text text-xs text-tertiary hover:text-primary transition-colors">
              LINKEDIN
            </a>
            <a href="mailto:yun.he@miner.cn" className="mono-text text-xs text-tertiary hover:text-primary transition-colors">
              EMAIL
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}