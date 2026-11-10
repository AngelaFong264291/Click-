import { describe, expect, it } from 'vitest'
import { createT, detectLanguage, otherLanguage, translate } from './index.js'

describe('translate / t()', () => {
  it('中文攞到中文字串', () => {
    expect(translate('zh-HK', 'app.title')).toBe('夾唔夾')
  })

  it('英文攞到英文字串', () => {
    expect(translate('en', 'app.title')).toBe('Do We Click?')
  })

  it('搵唔到嘅 key 返回 key 本身', () => {
    expect(translate('en', 'no.such.key')).toBe('no.such.key')
    expect(translate('zh-HK', 'app')).toBe('app') // 指去物件而唔係字串
  })

  it('唔識嘅語言退返 zh-HK', () => {
    expect(translate('fr', 'app.title')).toBe('夾唔夾')
  })

  it('字串冇佔位符時，傳入 vars 唔影響結果', () => {
    expect(translate('en', 'app.title', { x: 1 })).toBe('Do We Click?')
  })
})

describe('切換語言', () => {
  it('otherLanguage 喺兩種語言之間切換', () => {
    expect(otherLanguage('zh-HK')).toBe('en')
    expect(otherLanguage('en')).toBe('zh-HK')
  })

  it('切換後 t() 返回新語言嘅字串', () => {
    let lang = 'zh-HK'
    expect(createT(lang)('app.title')).toBe('夾唔夾')
    lang = otherLanguage(lang)
    expect(createT(lang)('app.title')).toBe('Do We Click?')
    lang = otherLanguage(lang)
    expect(createT(lang)('app.title')).toBe('夾唔夾')
  })
})

describe('detectLanguage', () => {
  it('有記低嘅選擇就用記低嗰個', () => {
    expect(detectLanguage('en', 'zh-HK')).toBe('en')
    expect(detectLanguage('zh-HK', 'en-US')).toBe('zh-HK')
  })

  it('冇記低就跟瀏覽器：zh* 用繁中，其他用英文', () => {
    expect(detectLanguage(null, 'zh-HK')).toBe('zh-HK')
    expect(detectLanguage(null, 'zh-CN')).toBe('zh-HK')
    expect(detectLanguage(null, 'zh-TW')).toBe('zh-HK')
    expect(detectLanguage(null, 'en-GB')).toBe('en')
    expect(detectLanguage(null, 'ja')).toBe('en')
    expect(detectLanguage(null, undefined)).toBe('en')
  })

  it('記低咗無效值就當冇記低', () => {
    expect(detectLanguage('fr', 'zh-HK')).toBe('zh-HK')
  })
})
