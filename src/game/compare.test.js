import { describe, expect, it } from 'vitest'
import {
  idsOf,
  normalizeAnswer,
  permutations,
  rankingAgreements,
  roundedAverage,
  sameLines,
  tierScore,
  timeDistance,
} from './compare.js'

describe('基本比較', () => {
  it('tierScore：0 / 1 / 2 / 3+ → 100 / 70 / 40 / 0', () => {
    expect([0, 1, 2, 3, 10].map(tierScore)).toEqual([100, 70, 40, 0, 0])
  })

  it('timeDistance 係圓形', () => {
    expect(timeDistance(23, 0)).toBe(1)
    expect(timeDistance(0, 23)).toBe(1)
    expect(timeDistance(20, 2)).toBe(6)
    expect(timeDistance(0, 12)).toBe(12)
    expect(timeDistance(5, 5)).toBe(0)
  })

  it('rankingAgreements 數 6 組先後', () => {
    const base = ['p', 'q', 'r', 's']
    expect(rankingAgreements(base, base)).toBe(6)
    expect(rankingAgreements(base, ['q', 'p', 'r', 's'])).toBe(5)
    expect(rankingAgreements(base, ['s', 'r', 'q', 'p'])).toBe(0)
  })

  it('sameLines 只數兩邊都有連而又一樣嘅線', () => {
    expect(sameLines({ x: '1', y: '2', z: '3' }, { x: '1', y: '3' })).toBe(1)
    expect(sameLines({ x: '1' }, {})).toBe(0)
  })

  it('idsOf 接受 id 字串或者 { id } 物件', () => {
    expect(idsOf(['a', { id: 'b', zh: '乙', en: 'B' }])).toEqual(['a', 'b'])
    expect(idsOf(undefined)).toEqual([])
  })

  it('permutations 按原本次序列出所有排列', () => {
    expect(permutations(['a', 'b', 'c'])).toEqual([
      ['a', 'b', 'c'],
      ['a', 'c', 'b'],
      ['b', 'a', 'c'],
      ['b', 'c', 'a'],
      ['c', 'a', 'b'],
      ['c', 'b', 'a'],
    ])
  })

  it('roundedAverage 跳過 null，冇數返回 null', () => {
    expect(roundedAverage([1, 2, null])).toBe(2) // 1.5 → 2
    expect(roundedAverage([null])).toBe(null)
  })
})

describe('normalizeAnswer', () => {
  const choice = { type: 'choice', options: [{ id: 'A' }, { id: 'B' }] }
  const matching = { type: 'matching', options: ['x', 'y', 'z'], adjectives: ['1', '2', '3'] }
  const ranking = { type: 'ranking', options: ['p', 'q', 'r', 's'] }

  it('選項題只接受 options 入面嘅 id', () => {
    expect(normalizeAnswer(choice, 'A')).toBe('A')
    expect(normalizeAnswer(choice, 'C')).toBe(undefined)
    expect(normalizeAnswer(choice, null)).toBe(undefined)
  })

  it('拉桿題 0–10 整數、時間題 0–23 整數', () => {
    expect(normalizeAnswer({ type: 'slider' }, 0)).toBe(0)
    expect(normalizeAnswer({ type: 'slider' }, 10)).toBe(10)
    expect(normalizeAnswer({ type: 'slider' }, 11)).toBe(undefined)
    expect(normalizeAnswer({ type: 'slider' }, '5')).toBe(undefined)
    expect(normalizeAnswer({ type: 'time' }, 23)).toBe(23)
    expect(normalizeAnswer({ type: 'time' }, 24)).toBe(undefined)
  })

  it('配對題剔走 id 唔啱嘅線', () => {
    expect(normalizeAnswer(matching, { x: '1', y: '9', w: '2' })).toEqual({ x: '1' })
    expect(normalizeAnswer(matching, ['x'])).toBe(undefined)
  })

  it('排序題要係 options 嘅一個排列', () => {
    expect(normalizeAnswer(ranking, ['s', 'r', 'q', 'p'])).toEqual(['s', 'r', 'q', 'p'])
    expect(normalizeAnswer(ranking, ['p', 'q', 'r'])).toBe(undefined)
    expect(normalizeAnswer(ranking, ['p', 'q', 'r', 'r'])).toBe(undefined)
    expect(normalizeAnswer(ranking, ['p', 'q', 'r', 'x'])).toBe(undefined)
  })

  it('唔識嘅題型 → undefined', () => {
    expect(normalizeAnswer({ type: 'nope' }, 'A')).toBe(undefined)
  })
})
