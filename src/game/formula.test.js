import { describe, expect, it } from 'vitest'
import { createT } from '../i18n/index.js'
import { scoreFormula } from './formula.js'
import { scoreQuestion } from './scoring.js'

const t = { zh: createT('zh-HK'), en: createT('en') }

const choice = {
  type: 'choice',
  options: [
    { id: 'bun', zh: '菠蘿包', en: 'pineapple bun' },
    { id: 'tart', zh: '蛋撻', en: 'egg tart' },
    { id: 'c', zh: 'C', en: 'C' },
    { id: 'd', zh: 'D', en: 'D' },
  ],
}
const slider = { type: 'slider' }
const time = { type: 'time' }
const matching = {
  type: 'matching',
  options: [{ id: 'bun' }, { id: 'mtr' }, { id: 'typhoon' }],
  adjectives: [{ id: 'romantic' }, { id: 'dangerous' }, { id: 'healing' }],
}
const ranking = {
  type: 'ranking',
  options: [
    { id: 'p', zh: '阿珊', en: 'Sam' },
    { id: 'q', zh: '阿明', en: 'Ming' },
    { id: 'r', zh: '阿May', en: 'May' },
    { id: 's', zh: '阿John', en: 'John' },
  ],
}
const guess = { type: 'guess', options: ['A', 'B', 'C', 'D'], targetUid: 'target' }

function byPlayer(values) {
  return Object.fromEntries(values.map((v, i) => [`u${i}`, v]))
}

const SAME = { bun: 'romantic', mtr: 'dangerous', typhoon: 'healing' }
const ALL_DIFFERENT = { bun: 'dangerous', mtr: 'healing', typhoon: 'romantic' }

describe('scoreFormula · choice', () => {
  it('4 個人入面 3 個揀同一個', () => {
    const answers = byPlayer(['bun', 'bun', 'bun', 'tart'])
    const result = scoreQuestion(choice, answers)
    expect(scoreFormula(choice, answers, result, t.zh, 'zh')).toBe(
      '4 個人入面，3 個揀咗菠蘿包 → 3 ÷ 4 = 75',
    )
    expect(scoreFormula(choice, answers, result, t.en, 'en')).toBe(
      '4 people answered, 3 picked pineapple bun → 3 ÷ 4 = 75',
    )
  })
})

describe('scoreFormula · slider / time', () => {
  it('拉桿題：共識、各人分數、平均', () => {
    const answers = byPlayer([7, 7, 8, 4])
    const result = scoreQuestion(slider, answers)
    expect(scoreFormula(slider, answers, result, t.zh, 'zh')).toBe(
      '共識 7：100 + 100 + 70 + 0 → ÷ 4 = 68',
    )
    expect(scoreFormula(slider, answers, result, t.en, 'en')).toBe(
      'Consensus 7: 100 + 100 + 70 + 0 → ÷ 4 = 68',
    )
  })

  it('時間題：共識帶時間單位', () => {
    const answers = byPlayer([19, 19, 20, 23])
    const result = scoreQuestion(time, answers)
    expect(scoreFormula(time, answers, result, t.zh, 'zh')).toBe(
      '共識 19 點：100 + 100 + 70 + 0 → ÷ 4 = 68',
    )
    expect(scoreFormula(time, answers, result, t.en, 'en')).toBe(
      'Consensus 19:00: 100 + 100 + 70 + 0 → ÷ 4 = 68',
    )
  })
})

describe('scoreFormula · ranking', () => {
  it('共識用排序後嘅名顯示', () => {
    const order = ['p', 'q', 'r', 's']
    const answers = byPlayer([order, order, order, ['p', 'r', 'q', 's']])
    const result = scoreQuestion(ranking, answers)
    expect(scoreFormula(ranking, answers, result, t.zh, 'zh')).toBe(
      '共識 阿珊 → 阿明 → 阿May → 阿John：100 + 100 + 100 + 70 → ÷ 4 = 93',
    )
    expect(scoreFormula(ranking, answers, result, t.en, 'en')).toBe(
      'Consensus Sam → Ming → May → John: 100 + 100 + 100 + 70 → ÷ 4 = 93',
    )
  })
})

describe('scoreFormula · matching', () => {
  it('顯示每人連中線數同平均', () => {
    const answers = byPlayer([SAME, SAME, SAME, ALL_DIFFERENT])
    const result = scoreQuestion(matching, answers)
    expect(scoreFormula(matching, answers, result, t.zh, 'zh')).toBe(
      '共識配法：3、3、3、0 線 → 平均 2 線 ≈ 75',
    )
    expect(scoreFormula(matching, answers, result, t.en, 'en')).toBe(
      'Consensus match: 3, 3, 3, 0 lines → average 2 lines ≈ 75',
    )
  })
})

describe('scoreFormula · guess', () => {
  it('3 個人入面 2 個猜中', () => {
    const answers = { target: 'A', g1: 'A', g2: 'A', g3: 'B' }
    const result = scoreQuestion(guess, answers)
    expect(scoreFormula(guess, answers, result, t.zh, 'zh')).toBe('3 個人入面，2 個猜中 → 2 ÷ 3 = 67')
    expect(scoreFormula(guess, answers, result, t.en, 'en')).toBe(
      '3 people guessed, 2 got it right → 2 ÷ 3 = 67',
    )
  })

  it('目標冇作答 → 呢題唔計分', () => {
    const answers = { g1: 'A', g2: 'B' }
    const result = scoreQuestion(guess, answers)
    expect(scoreFormula(guess, answers, result, t.zh, 'zh')).toBe('呢題答嘅人唔夠，唔計分')
    expect(scoreFormula(guess, answers, result, t.en, 'en')).toBe(
      "Not enough people answered, so this question doesn't count.",
    )
  })

  it('冇人猜 → 呢題唔計分', () => {
    const answers = { target: 'A' }
    const result = scoreQuestion(guess, answers)
    expect(scoreFormula(guess, answers, result, t.zh, 'zh')).toBe('呢題答嘅人唔夠，唔計分')
  })
})

describe('scoreFormula · 無人吻合 / 答得唔夠', () => {
  it('選項題全部唔同 → 0 分解釋', () => {
    const answers = byPlayer(['bun', 'tart', 'c', 'd'])
    const result = scoreQuestion(choice, answers)
    expect(scoreFormula(choice, answers, result, t.zh, 'zh')).toBe('作答嘅人入面冇兩個夾到，所以呢題 0 分')
    expect(scoreFormula(choice, answers, result, t.en, 'en')).toBe(
      'No two people who answered matched, so this question scores 0.',
    )
  })

  it('少於 2 人作答 → 唔計分', () => {
    const answers = byPlayer(['bun'])
    const result = scoreQuestion(choice, answers)
    expect(scoreFormula(choice, answers, result, t.zh, 'zh')).toBe('呢題答嘅人唔夠，唔計分')
    expect(scoreFormula(choice, answers, result, t.en, 'en')).toBe(
      "Not enough people answered, so this question doesn't count.",
    )
  })
})
