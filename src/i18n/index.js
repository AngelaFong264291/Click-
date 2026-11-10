// 細小嘅 i18n：t() 函數 + JSON 字串檔。唔依賴 React，方便測試。
import zhHK from './zh-HK.json'
import en from './en.json'

export const LANGUAGES = ['zh-HK', 'en']
export const DEFAULT_LANGUAGE = 'zh-HK'
export const STORAGE_KEY = 'click.lang'

const dictionaries = { 'zh-HK': zhHK, en }

function lookup(dict, key) {
  return key
    .split('.')
    .reduce((node, part) => (node == null ? undefined : node[part]), dict)
}

/**
 * 按語言攞字串。key 用點分隔，例如 'app.title'。
 * vars 會代入 {name} 呢類佔位符。
 * 搵唔到時先退返 zh-HK，再搵唔到就返回 key 本身。
 */
export function translate(lang, key, vars) {
  let text = lookup(dictionaries[lang], key)
  if (typeof text !== 'string') text = lookup(dictionaries[DEFAULT_LANGUAGE], key)
  if (typeof text !== 'string') return key
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match,
  )
}

/** 綁定語言，返回 t(key, vars)。 */
export function createT(lang) {
  return (key, vars) => translate(lang, key, vars)
}

/** 瀏覽器語言：zh* 一律用繁中，其他用英文。 */
export function languageFromBrowser(browserLang) {
  return typeof browserLang === 'string' && browserLang.toLowerCase().startsWith('zh')
    ? 'zh-HK'
    : 'en'
}

/** 先睇裝置上記低嘅選擇，冇就跟瀏覽器語言。 */
export function detectLanguage(storedLang, browserLang) {
  if (LANGUAGES.includes(storedLang)) return storedLang
  return languageFromBrowser(browserLang)
}

export function otherLanguage(lang) {
  return lang === 'zh-HK' ? 'en' : 'zh-HK'
}
