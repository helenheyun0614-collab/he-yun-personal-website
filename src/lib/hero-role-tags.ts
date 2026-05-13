/** Hero 身份标签 — 独立文件，避免翻译表热更新未生效时仍显示旧文案 */
export type SiteLanguage = 'en' | 'zh'

export const HERO_ROLE_TAGS: Record<SiteLanguage, readonly [string, string, string]> = {
  zh: ['生态构建', '社区连接者', 'AI传播者'],
  en: ['ECOSYSTEM BUILDING', 'COMMUNITY CONNECTOR', 'AI COMMUNICATOR'],
}
