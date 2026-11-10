import { useContext } from 'react'
import { LanguageContext } from './languageContext.js'

/** 返回 { lang, setLang, toggle, t }。必須喺 <LanguageProvider> 入面用。 */
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}
