'use client'

import { useLanguage } from '@/contexts/language-context'

export function Contact() {
  const { language, t } = useLanguage()

  return (
    <section 
      id="contact" 
      className="section-padding relative"
      style={{ 
        background: 'linear-gradient(to bottom, transparent, var(--background-secondary))'
      }}
    >
      <div className="container-max">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* 左侧：联系方式 */}
          <div className="glass-card p-8">
            <p 
              className="mono-text text-xs mb-6"
              style={{ color: 'var(--brand)' }}
            >
              CONTACT
            </p>
            
            <div className="space-y-5">
              <div>
                <p 
                  className="text-sm mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {language === 'en' ? 'Email' : '邮箱'}
                </p>
                <a 
                  href="mailto:yun.he@aminer.cn" 
                  className="text-lg transition-colors duration-300"
                  style={{ color: 'var(--text-main)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--brand)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-main)'
                  }}
                >
                  yun.he@aminer.cn
                </a>
              </div>
              
              <div>
                <p 
                  className="text-sm mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {language === 'en' ? 'Location' : '位置'}
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {language === 'en' ? 'Beijing, China' : '北京，中国'}
                </p>
              </div>
            </div>
          </div>

          {/* 右侧：开放思考 */}
          <div className="glass-card p-8">
            <p 
              className="mono-text text-xs mb-6"
              style={{ color: 'var(--brand)' }}
            >
              {language === 'en' ? 'OPEN THREADS' : '开放中的思考'}
            </p>
            
            <div 
              className="space-y-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              {language === 'en' ? (
                <>
                  <p>Most systems fail slowly.</p>
                  <p>Communities are harder to scale than models.</p>
                  <p>The next bottleneck may not be intelligence.</p>
                  <p>Still connecting the dots between research, systems, and people.</p>
                </>
              ) : (
                <>
                  <p>很多系统的失败是缓慢的。</p>
                  <p>社区比模型更难扩展。</p>
                  <p>下一个瓶颈可能不是智能。</p>
                  <p>还在连接研究、系统和人之间的点。</p>
                </>
              )}
            </div>

            <p 
              className="mono-text text-xs mt-8"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {language === 'en' ? 'Open to thoughtful conversations.' : '欢迎有深度的对话。'}
            </p>
          </div>

        </div>

        {/* 页脚 */}
        <div 
          className="mt-16 pt-8 text-center"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <p 
            className="mono-text text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            © 2024 Helen Heyun — {language === 'en' ? 'Building AI-native ecosystems' : '构建 AI 原生生态系统'}
          </p>
        </div>
      </div>
    </section>
  )
}
