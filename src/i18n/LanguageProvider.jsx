import { useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEY, createT, detectLanguage, otherLanguage } from './index.js'
import { LanguageContext } from './languageContext.js'

function readStoredLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function initialLanguage() {
  const browserLang = typeof navigator === 'undefined' ? undefined : navigator.language
  return detectLanguage(readStoredLanguage(), browserLang)
}

// 語言只記喺自己裝置，唔寫入房間狀態。
export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLanguage)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // 私密模式等情況寫唔到，照用但唔記低
    }
  }, [])

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(otherLanguage(lang)),
      t: createT(lang),
    }),
    [lang, setLang],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
