import { describe, expect, it } from 'vitest'
import { groupTitle, overallScore, scoreRangeFor } from './overall.js'

describe('overallScore', () => {
  it('十題平均，跳過 null', () => {
    expect(overallScore([75, 68, 100, 0, 50, 93, 67, 33, 75, 50])).toBe(61) // 611 ÷ 10
    expect(overallScore([80, null, 90])).toBe(85)
  })

  it('全部 null → null', () => {
    expect(overallScore([null, null])).toBe(null)
    expect(overallScore([])).toBe(null)
  })
})

describe('groupTitle', () => {
  it('3 人或以上：90 / 70 / 40 門檻', () => {
    expect(groupTitle(100, 4)).toBe('soulmates')
    expect(groupTitle(90, 4)).toBe('soulmates')
    expect(groupTitle(89, 4)).toBe('oldFriends')
    expect(groupTitle(70, 4)).toBe('oldFriends')
    expect(groupTitle(69, 4)).toBe('justFriends')
    expect(groupTitle(40, 4)).toBe('justFriends')
    expect(groupTitle(39, 4)).toBe('parallelUniverses')
    expect(groupTitle(0, 6)).toBe('parallelUniverses')
  })

  it('兩人局：95 / 75 / 45 門檻', () => {
    expect(groupTitle(95, 2)).toBe('soulmates')
    expect(groupTitle(94, 2)).toBe('oldFriends')
    expect(groupTitle(90, 2)).toBe('oldFriends')
    expect(groupTitle(75, 2)).toBe('oldFriends')
    expect(groupTitle(74, 2)).toBe('justFriends')
    expect(groupTitle(45, 2)).toBe('justFriends')
    expect(groupTitle(44, 2)).toBe('parallelUniverses')
    expect(groupTitle(40, 2)).toBe('parallelUniverses')
  })

  it('分數係 null → null', () => {
    expect(groupTitle(null, 4)).toBe(null)
  })
})

describe('scoreRangeFor', () => {
  it('3 人或以上嘅每個稱號範圍，同 groupTitle 嘅門檻一致', () => {
    expect(scoreRangeFor(4, 'soulmates')).toEqual({ min: 90, max: 100 })
    expect(scoreRangeFor(4, 'oldFriends')).toEqual({ min: 70, max: 89 })
    expect(scoreRangeFor(4, 'justFriends')).toEqual({ min: 40, max: 69 })
    expect(scoreRangeFor(4, 'parallelUniverses')).toEqual({ min: 0, max: 39 })
  })

  it('兩人局用 95/75/45 門檻', () => {
    expect(scoreRangeFor(2, 'soulmates')).toEqual({ min: 95, max: 100 })
    expect(scoreRangeFor(2, 'oldFriends')).toEqual({ min: 75, max: 94 })
    expect(scoreRangeFor(2, 'justFriends')).toEqual({ min: 45, max: 74 })
    expect(scoreRangeFor(2, 'parallelUniverses')).toEqual({ min: 0, max: 44 })
  })

  it('範圍邊界同 groupTitle 嘅實際輸出對得上', () => {
    for (const score of [100, 90, 89, 70, 69, 40, 39, 0]) {
      const title = groupTitle(score, 4)
      const range = scoreRangeFor(4, title)
      expect(score).toBeGreaterThanOrEqual(range.min)
      expect(score).toBeLessThanOrEqual(range.max)
    }
  })

  it('唔識嘅 title 或者 null → null', () => {
    expect(scoreRangeFor(4, null)).toBe(null)
    expect(scoreRangeFor(4, 'notATitle')).toBe(null)
  })
})
