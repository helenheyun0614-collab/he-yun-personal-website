'use client'

import { useLanguage } from '@/contexts/language-context'

export function Contact() {
  const { language, t } = useLanguage()

  return (
    <section id="contact" className="section-padding bg-background border-t border-white/5">
      <div className="container-max">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-4xl mx-auto">
          
          {/* 左侧：联系方式 */}
          <div className="glass-card p-8">
            <p className="mono-text text-xs text-tertiary mb-6">CONTACT</p>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-tertiary mb-2">{language === 'en' ? 'Email' : '邮箱'}</p>
                <a 
                  href="mailto:yun.he@aminer.cn" 
                  className="text-lg text-text-main hover:text-primary transition-colors"
                >
                  yun.he@aminer.cn
                </a>
              </div>
              
              <div>
                <p className="text-sm text-tertiary mb-2">{language === 'en' ? 'Location' : '位置'}</p>
                <p className="text-secondary">
                  {language === 'en' ? 'Beijing, China' : '北京，中国'}
                </p>
              </div>
            </div>
          </div>

          {/* 右侧：开放思考 */}
          <div className="glass-card p-8">
            <p className="mono-text text-xs text-tertiary mb-6">
              {language === 'en' ? 'OPEN THREADS' : '开放中的思考'}
            </p>
            
            <div className="space-y-4 text-secondary">
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

            <p className="mono-text text-xs text-tertiary mt-8">
              {language === 'en' ? 'Open to thoughtful conversations.' : '欢迎有深度的对话。'}
            </p>
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
