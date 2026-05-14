'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const LANG_STORAGE_KEY = 'heyun-lang'

type Language = 'en' | 'zh'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = {
  en: {
    'nav.ecosystem': 'Ecosystem',
    'nav.journey': 'Journey',
    'nav.interact': 'Interact',
    'nav.contact': 'Contact',
    'hero.name': 'Helen Heyun',
    'hero.title': 'Building AGI-native talent ecosystems.',
    'hero.subtitle': 'Connecting research, industry, and next generation.',
    'scrollToExplore': 'SCROLL TO EXPLORE',
    'research.statusWord': 'STATUS',
    'research.statusSep': '｜',
    'research.statusState': 'Building',
    'research.thesisLabel': 'Current Thesis',
    'research.thesisQuote':
      'The next generation of AGI will emerge from ecosystems, not isolated labs.',
    'research.coordsLabel': 'Research Coordinates',
    'research.coord.1': 'Autonomous Agent Systems',
    'research.coord.2': 'Human-AI Collaboration',
    'research.coord.3': 'AI-native Talent Networks',
    'research.coord.4': 'Research Ecosystem Design',
    'research.coord.5': 'Frontier Research Communities',
    'research.coord.6': 'Long-horizon Evaluation',
    'ecosystem.title': 'The Network',
    'ecosystem.subtitle': 'Building the connections that matter: research, industry, talent, and community.',
    'ecosystem.students': 'STUDENTS',
    'ecosystem.researchers': 'RESEARCHERS',
    'ecosystem.universities': 'UNIVERSITIES',
    'ecosystem.companies': 'COMPANIES',
    'ecosystem.events': 'EVENTS',
    'ecosystem.focus': 'CURRENT FOCUS',
    'ecosystem.academic': 'Academic Network',
    'ecosystem.people': 'Initiators',
    'ecosystem.industry': 'Industry Partners',
    'ecosystem.community': 'Overseas Network',
    'journey.title': 'Journey Through the AI Era',
    'journey.subtitle': 'In the AGI era, we are all participants and shapers.',
    'chat.title': 'Ask Helen',
    'chat.placeholder': 'What would you like to chat about?',
    'chat.send': 'Send',
    'chat.suggested': 'Try asking',
    'chat.typing': 'Helen Heyun is typing...',
    'chat.greeting': 'Hello! I\'m Helen Heyun, nice to meet you. We can chat about AI TIME, technology, life, or anything you\'re interested in.',
    'chat.error': 'Sorry, I can\'t reply right now. Please try again later, or check your network connection.',
    'contact.title': 'Get in Touch',
    'contact.subtitle': 'Whether you\'re working on AGI research, building AI-native products, or exploring collaboration opportunities—I\'d love to hear from you.',
    'contact.email': 'Email',
    'contact.subscribe': 'Subscribe for updates',
    'contact.subscribeText': 'Subscribe to stay updated on the latest developments in AGI research, AI-native education, and ecosystem building.',
    'contact.send': 'Send Message',
    'contact.success': 'Message sent successfully!',
    'contact.error': 'Please fill in all fields.',
  },
  zh: {
    'nav.ecosystem': '生态网络',
    'nav.journey': '历程',
    'nav.interact': '交互',
    'nav.contact': '联系',
    'hero.name': 'Helen Heyun',
    'hero.title': '构建 AGI 原生人才生态系统。',
    'hero.subtitle': '连接研究、产业与下一代创新者。',
    'scrollToExplore': '向下探索',
    'research.statusWord': 'STATUS',
    'research.statusSep': '｜',
    'research.statusState': '构建中',
    'research.thesisLabel': '当前命题',
    'research.thesisQuote': '下一代 AGI 将从生态中浮现，而非孤立实验室。',
    'research.coordsLabel': '研究坐标',
    'research.coord.1': '自主智能体系统',
    'research.coord.2': '人机协同',
    'research.coord.3': 'AI 原生人才网络',
    'research.coord.4': '研究生态设计',
    'research.coord.5': '前沿研究社群',
    'research.coord.6': '长程评估',
    'ecosystem.title': '生态网络',
    'ecosystem.subtitle': '构建重要的连接：研究、产业、人才与社区。',
    'ecosystem.students': '学生',
    'ecosystem.researchers': '研究者',
    'ecosystem.universities': '高校',
    'ecosystem.companies': '企业',
    'ecosystem.events': '活动',
    'ecosystem.focus': '当前关注',
    'ecosystem.academic': '学术网络',
    'ecosystem.people': '发起人',
    'ecosystem.industry': '产业伙伴',
    'ecosystem.community': '海外网络',
    'journey.title': '穿越 AI 时代的历程',
    'journey.subtitle': '在 AGI 时代，我们都是参与者和塑造者。',
    'chat.title': '问 Helen',
    'chat.placeholder': '想聊什么都可以...',
    'chat.send': '发送',
    'chat.suggested': '试试问',
    'chat.typing': 'Helen Heyun 正在输入...',
    'chat.greeting': '你好！我是 Helen Heyun，很高兴和你交流。我们可以聊聊 AI TIME、科技、生活，或者你感兴趣的任何话题。',
    'chat.error': '抱歉，我现在无法回复。请稍后再试，或者检查网络连接。',
    'contact.title': '联系我',
    'contact.subtitle': '无论你在从事 AGI 研究、构建 AI 原生产品，还是探索合作机会——我很乐意听到你的声音。',
    'contact.email': '邮箱',
    'contact.subscribe': '订阅更新',
    'contact.subscribeText': '订阅以获取 AGI 研究、AI 原生教育和生态构建的最新发展动态。',
    'contact.send': '发送消息',
    'contact.success': '消息发送成功！',
    'contact.error': '请填写所有字段。',
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh')

  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY)
    if (saved === 'en' || saved === 'zh') setLanguageState(saved)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANG_STORAGE_KEY, lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
