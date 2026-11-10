import { describe, expect, it } from 'vitest'
import { findSoleOutlier, isMatch, isUnanimous, thermometer } from './midgame.js'

const choice = { type: 'choice', options: ['A', 'B', 'C', 'D'] }
const slider = { type: 'slider' }
const time = { type: 'time' }
const matching = { type: 'matching', options: ['x', 'y', 'z'], adjectives: ['1', '2', '3'] }
const ranking = { type: 'ranking', options: ['p', 'q', 'r', 's'] }
const guess = { type: 'guess', options: ['A', 'B'], targetUid: 't' }

describe('isMatch', () => {
  it('選項題、猜朋友題要完全一樣', () => {
    expect(isMatch(choice, 'A', 'A')).toBe(true)
    expect(isMatch(choice, 'A', 'B')).toBe(false)
    expect(isMatch(guess, 'B', 'B')).toBe(true)
  })

  it('拉桿題差 1 分以內算吻合', () => {
    expect(isMatch(slider, 3, 3)).toBe(true)
    expect(isMatch(slider, 3, 4)).toBe(true)
    expect(isMatch(slider, 3, 5)).toBe(false)
  })

  it('時間題差 1 個鐘以內算吻合，23 同 0 相鄰', () => {
    expect(isMatch(time, 23, 0)).toBe(true)
    expect(isMatch(time, 0, 1)).toBe(true)
    expect(isMatch(time, 22, 0)).toBe(false)
  })

  it('配對題要每條線都一樣（key 次序唔緊要）', () => {
    expect(isMatch(matching, { x: '1', y: '2', z: '3' }, { z: '3', x: '1', y: '2' })).toBe(true)
    expect(isMatch(matching, { x: '1', y: '2', z: '3' }, { x: '1', y: '3', z: '2' })).toBe(false)
    expect(isMatch(matching, { x: '1', y: '2', z: '3' }, { x: '1', y: '2' })).toBe(false)
  })

  it('排序題要次序完全一樣', () => {
    expect(isMatch(ranking, ['p', 'q', 'r', 's'], ['p', 'q', 'r', 's'])).toBe(true)
    expect(isMatch(ranking, ['p', 'q', 'r', 's'], ['q', 'p', 'r', 's'])).toBe(false)
  })

  it('任何一方冇作答 → false', () => {
    expect(isMatch(choice, 'A', undefined)).toBe(false)
    expect(isMatch(slider, undefined, undefined)).toBe(false)
  })
})

describe('findSoleOutlier', () => {
  it('得一個人同邊個都唔吻合 → 佢', () => {
    expect(findSoleOutlier(choice, { a: 'A', b: 'A', c: 'B' })).toBe('c')
    expect(findSoleOutlier(slider, { a: 5, b: 6, c: 9 })).toBe('c')
    expect(findSoleOutlier(time, { a: 23, b: 0, c: 12 })).toBe('c')
  })

  it('其他人入面有人都係孤立 → null', () => {
    expect(findSoleOutlier(choice, { a: 'A', b: 'A', c: 'B', d: 'C' })).toBe(null)
    expect(findSoleOutlier(choice, { a: 'A', b: 'B', c: 'C' })).toBe(null)
  })

  it('冇異類 → null', () => {
    expect(findSoleOutlier(choice, { a: 'A', b: 'A', c: 'B', d: 'B' })).toBe(null)
    expect(findSoleOutlier(choice, { a: 'A', b: 'A', c: 'A' })).toBe(null)
  })

  it('作答少過 3 人 → null，冇作答嘅唔計', () => {
    expect(findSoleOutlier(choice, { a: 'A', b: 'B' })).toBe(null)
    expect(findSoleOutlier(choice, { a: 'A', b: 'B', c: undefined })).toBe(null)
  })
})

describe('isUnanimous', () => {
  it('全部一樣 → true', () => {
    expect(isUnanimous(choice, { a: 'A', b: 'A', c: 'A' })).toBe(true)
    expect(isUnanimous(ranking, { a: ['p', 'q', 'r', 's'], b: ['p', 'q', 'r', 's'] })).toBe(true)
  })

  it('有一個唔同 → false', () => {
    expect(isUnanimous(choice, { a: 'A', b: 'A', c: 'B' })).toBe(false)
  })

  it('拉桿題差 1 都唔算一致', () => {
    expect(isUnanimous(slider, { a: 5, b: 6 })).toBe(false)
    expect(isUnanimous(slider, { a: 5, b: 5 })).toBe(true)
  })

  it('要最少 2 人作答，冇作答嘅唔計', () => {
    expect(isUnanimous(choice, { a: 'A' })).toBe(false)
    expect(isUnanimous(choice, {})).toBe(false)
    expect(isUnanimous(choice, { a: 'A', b: 'A', c: undefined })).toBe(true)
  })
})

describe('thermometer', () => {
  it('已揭曉題目嘅平均，跳過 null', () => {
    expect(thermometer([75, null, 50])).toBe(63) // 62.5
    expect(thermometer([100])).toBe(100)
  })

  it('未有分數 → null', () => {
    expect(thermometer([])).toBe(null)
    expect(thermometer([null, null])).toBe(null)
  })
})
