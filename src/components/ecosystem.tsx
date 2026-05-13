'use client'

import { useLanguage } from '@/contexts/language-context'

export function Ecosystem() {
  const { language, t } = useLanguage()

  const ecosystemData = {
    focus: [
      "Autonomous agent systems",
      "Human-AI collaboration",
      "Long-horizon evaluation",
      "Research ecosystems",
      "AI-native learning",
      "Frontier talent networks"
    ],
    focusZh: [
      "自主智能体系统",
      "人机协作",
      "长程评估",
      "研究生态",
      "AI 原生学习",
      "前沿人才网络"
    ],
    universities: [
      "Tsinghua University",
      "Peking University",
      "Zhejiang University",
      "Fudan University",
      "Nanjing University",
      "Shanghai Jiao Tong University"
    ],
    universitiesZh: [
      "清华大学",
      "北京大学",
      "浙江大学",
      "复旦大学",
      "南京大学",
      "上海交通大学"
    ],
    researchers: [
      "Prof. Zhang Bo",
      "Prof. Jie Tang",
      "Prof. Juanzi Li"
    ],
    researchersZh: [
      "张钹院士",
      "唐杰教授",
      "李涓子教授"
    ],
    companies: [
      "Zhipu AI",
      "ByteDance",
      "Alibaba DAMO Academy",
      "Tencent AI Lab",
      "Huawei Cloud AI",
      "SenseTime"
    ],
    companiesZh: [
      "智谱 AI",
      "字节跳动",
      "阿里达摩院",
      "腾讯 AI Lab",
      "华为云 AI",
      "商汤科技"
    ],
    community: [
      "AI TIME Community",
      "AGI Research Network",
      "Young Scholar Forum",
      "AI Ethics Council",
      "Tech Education Alliance"
    ],
    communityZh: [
      "AI TIME 社区",
      "AGI 研究网络",
      "青年学者论坛",
      "AI 伦理委员会",
      "科技教育联盟"
    ],
    events: [
      "AI TIME Annual Conference",
      "AGI Frontier Forum",
      "Talent Development Summit",
      "Industry-Academia Bridge",
      "Young Researcher Workshop"
    ],
    eventsZh: [
      "AI TIME 年度大会",
      "AGI 前沿论坛",
      "人才发展峰会",
      "产学合作桥梁",
      "青年研究者工作坊"
    ],
    impact: {
      students: "2000+",
      researchers: "150+",
      universities: "50+",
      companies: "30+",
      events: "800+"
    },
    impactZh: {
      students: "2000+",
      researchers: "150+",
      universities: "50+",
      companies: "30+",
      events: "800+"
    }
  }

  const isZh = language === 'zh'
  const universities = isZh ? ecosystemData.universitiesZh : ecosystemData.universities
  const researchers = isZh ? ecosystemData.researchersZh : ecosystemData.researchers
  const companies = isZh ? ecosystemData.companiesZh : ecosystemData.companies
  const community = isZh ? ecosystemData.communityZh : ecosystemData.community
  const events = isZh ? ecosystemData.eventsZh : ecosystemData.events
  const focus = isZh ? ecosystemData.focusZh : ecosystemData.focus

  return (
    <section id="ecosystem" className="section-padding bg-background border-t border-white/5">
      <div className="container-max">
        <div className="mb-12">
          <p className="mono-text text-xs text-tertiary mb-4">ECOSYSTEM</p>
          <h2 className="editorial-heading text-4xl md:text-5xl">
            {t('ecosystem.title')}
          </h2>
          <p className="text-xl text-secondary mt-4 max-w-3xl">
            {t('ecosystem.subtitle')}
          </p>
        </div>

        {/* 影响数据 */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">{ecosystemData.impact.students}</div>
            <div className="mono-text text-[10px] text-tertiary">{t('ecosystem.students')}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">{ecosystemData.impact.researchers}</div>
            <div className="mono-text text-[10px] text-tertiary">{t('ecosystem.researchers')}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">{ecosystemData.impact.universities}</div>
            <div className="mono-text text-[10px] text-tertiary">{t('ecosystem.universities')}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">{ecosystemData.impact.companies}</div>
            <div className="mono-text text-[10px] text-tertiary">{t('ecosystem.companies')}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">{ecosystemData.impact.events}</div>
            <div className="mono-text text-[10px] text-tertiary">{t('ecosystem.events')}</div>
          </div>
        </div>

        {/* 生态网络 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 当前关注 */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-primary/60" />
              <h3 className="text-lg font-medium text-text-main">{t('ecosystem.focus')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {focus.map((item, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-surface border border-white/10 rounded-full text-sm text-text-secondary hover:border-primary/30 hover:text-primary transition-colors"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* 学术界 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500/60" />
              <h3 className="text-lg font-medium text-text-main">{t('ecosystem.academic')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {universities.map((uni, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-surface border border-white/10 rounded-full text-sm text-text-secondary hover:border-primary/30 hover:text-primary transition-colors"
                >
                  {uni}
                </span>
              ))}
            </div>
          </div>

          {/* 研究者 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-purple-500/60" />
              <h3 className="text-lg font-medium text-text-main">{t('ecosystem.people')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {researchers.map((researcher, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-surface border border-white/10 rounded-full text-sm text-text-secondary hover:border-primary/30 hover:text-primary transition-colors"
                >
                  {researcher}
                </span>
              ))}
            </div>
          </div>

          {/* 产业界 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <h3 className="text-lg font-medium text-text-main">{t('ecosystem.industry')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {companies.map((company, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-surface border border-white/10 rounded-full text-sm text-text-secondary hover:border-primary/30 hover:text-primary transition-colors"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>

          {/* 社区 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-orange-500/60" />
              <h3 className="text-lg font-medium text-text-main">{t('ecosystem.community')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {community.map((comm, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-surface border border-white/10 rounded-full text-sm text-text-secondary hover:border-primary/30 hover:text-primary transition-colors"
                >
                  {comm}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
