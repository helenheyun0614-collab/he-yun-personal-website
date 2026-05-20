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
      "Tencent",
      "DiDi",
      "OPPO",
      "......"
    ],
    companiesZh: [
      "智谱",
      "字节跳动",
      "阿里达摩院",
      "腾讯",
      "滴滴",
      "OPPO",
      "......"
    ],
    community: [
      "Dartmouth College",
      "MIT",
      "CMU",
      "Ohio State University",
      "Duke University",
      "The University of Hong Kong"
    ],
    communityZh: [
      "达特茅斯学院",
      "麻省理工学院",
      "卡内基梅隆大学",
      "俄亥俄州立大学",
      "杜克大学",
      "香港大学"
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
    <section 
      id="ecosystem" 
      className="section-padding relative"
      style={{ background: 'transparent' }}
    >
      <div className="container-max">
        <div className="mb-12">
          <p 
            className="mono-text text-xs mb-4"
            style={{ color: 'var(--brand)' }}
          >
            ECOSYSTEM
          </p>
          <h2 
            className="editorial-heading text-4xl md:text-5xl"
            style={{ color: 'var(--text-hero)' }}
          >
            {t('ecosystem.title')}
          </h2>
          <p 
            className="text-xl mt-4 max-w-3xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('ecosystem.subtitle')}
          </p>
        </div>

        {/* 影响数据 */}
        <div className="grid grid-cols-5 gap-3 mb-10">
          {[
            { value: ecosystemData.impact.students, label: t('ecosystem.students') },
            { value: ecosystemData.impact.researchers, label: t('ecosystem.researchers') },
            { value: ecosystemData.impact.universities, label: t('ecosystem.universities') },
            { value: ecosystemData.impact.companies, label: t('ecosystem.companies') },
            { value: ecosystemData.impact.events, label: t('ecosystem.events') }
          ].map((item, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--brand)' }}
              >
                {item.value}
              </div>
              <div 
                className="mono-text text-[10px]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* 生态网络 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 当前关注 */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: 'var(--brand)' }}
              />
              <h3 
                className="text-lg font-medium"
                style={{ color: 'var(--text-main)' }}
              >
                {t('ecosystem.focus')}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {focus.map((item, i) => (
                <span
                  key={i}
                  className="px-4 py-2 rounded-full text-sm transition-all duration-300 cursor-default"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--border-radius)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)'
                    e.currentTarget.style.color = 'var(--brand)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* 学术界 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400/70" />
              <h3 
                className="text-lg font-medium"
                style={{ color: 'var(--text-main)' }}
              >
                {t('ecosystem.academic')}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {universities.map((uni, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-sm transition-all duration-300"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {uni}
                </span>
              ))}
            </div>
          </div>

          {/* 研究者 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400/70" />
              <h3 
                className="text-lg font-medium"
                style={{ color: 'var(--text-main)' }}
              >
                {t('ecosystem.people')}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {researchers.map((researcher, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-sm transition-all duration-300"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {researcher}
                </span>
              ))}
            </div>
          </div>

          {/* 产业界 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
              <h3 
                className="text-lg font-medium"
                style={{ color: 'var(--text-main)' }}
              >
                {t('ecosystem.industry')}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {companies.map((company, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-sm transition-all duration-300"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {company}
                </span>
              ))}
            </div>
          </div>

          {/* 海外网络 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
              <h3 
                className="text-lg font-medium"
                style={{ color: 'var(--text-main)' }}
              >
                {t('ecosystem.community')}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {community.map((comm, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-sm transition-all duration-300"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
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
