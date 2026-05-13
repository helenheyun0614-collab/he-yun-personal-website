'use client'

import { useLanguage } from '@/contexts/language-context'

export function Contact() {
  const { language, t } = useLanguage()

  return (
    <section id="contact" className="section-padding bg-background border-t border-white/5">
      <div className="container-max">
        <div className="text-center mb-12">
          <p className="mono-text text-xs text-tertiary mb-4">CONNECT</p>
          <h2 className="editorial-heading text-4xl md:text-5xl mb-6">
            {language === 'en' ? "Let's build the future together" : '让我们一起构建未来'}
          </h2>
          <p className="editorial-subheading max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="glass-card p-8">
            <h3 className="text-xl font-medium mb-6 text-text-main">{t('contact.title')}</h3>

            <div className="space-y-4">
              <a
                href="mailto:yun.he@miner.cn"
                className="flex items-center gap-4 p-4 bg-surface hover:bg-surfaceHover border border-white/5 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.83.82V6.83A2 2 0 002.83 2.83h12.34a2 2 0 002.83-2.83v7.06a2 2 0 00-2.83 2.82l-7.89-5.26A2 2 0 00-.83-.82V6.83A2 2 0 00-.83 2.83H3.17A2 2 0 00-.83-2.83v7.06a2 2 0 00.83 2.82l7.89-5.26A2 2 0 001.17.18z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-tertiary mb-1">{t('contact.email')}</p>
                  <p className="text-text-main group-hover:text-primary transition-colors">yun.he@miner.cn</p>
                </div>
              </a>

              <a
                href="#"
                className="flex items-center gap-4 p-4 bg-surface hover:bg-surfaceHover border border-white/5 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-tertiary mb-1">Location</p>
                  <p className="text-text-main group-hover:text-primary transition-colors">{language === 'en' ? 'Beijing, China' : '中国，北京'}</p>
                </div>
              </a>
            </div>
          </div>

          <div className="glass-card p-8">
            <h3 className="text-xl font-medium mb-6 text-text-main">{t('contact.subscribe')}</h3>
            <p className="text-secondary mb-6 leading-relaxed">
              {t('contact.subscribeText')}
            </p>

            <form className="space-y-4">
              <input
                type="email"
                placeholder={language === 'en' ? 'Your email' : '请输入邮箱'}
                className="w-full px-4 py-3 bg-background border border-white/10 rounded-lg text-sm text-text-main placeholder-tertiary focus:outline-none focus:border-primary/30 transition-colors"
              />
              <button
                type="submit"
                className="w-full px-6 py-3 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20"
              >
                {t('contact.send')}
              </button>
            </form>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="mono-text text-xs text-tertiary">
            © 2024 Helen Heyun — {language === 'en' ? 'Building AI-native ecosystems' : '构建 AI 原生生态系统'}
          </p>
        </div>
      </div>
    </section>
  )
}
