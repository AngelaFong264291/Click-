import { describe, expect, it } from 'vitest'
import { averagePairScore, consensusCandidates, scorePair, scoreQuestion } from './scoring.js'

const choice = { type: 'choice', options: ['A', 'B', 'C', 'D'] }
const slider = { type: 'slider' }
const time = { type: 'time' }
const matching = {
  type: 'matching',
  options: [{ id: 'bun', zh: '菠蘿包', en: 'pineapple bun' }, { id: 'mtr' }, { id: 'typhoon' }],
  adjectives: [{ id: 'romantic' }, { id: 'dangerous' }, { id: 'healing' }],
}
const ranking = { type: 'ranking', options: ['p', 'q', 'r', 's'] }
const guess = { type: 'guess', options: ['A', 'B', 'C', 'D'], targetUid: 't' }

/** ['A', 'A', 'B'] → { u0: 'A', u1: 'A', u2: 'B' } */
function byPlayer(values) {
  return Object.fromEntries(values.map((v, i) => [`u${i}`, v]))
}

const SAME = { bun: 'romantic', mtr: 'dangerous', typhoon: 'healing' }
const ALL_DIFFERENT = { bun: 'dangerous', mtr: 'healing', typhoon: 'romantic' }

describe('提案例子', () => {
  it('選項題：4 人、3 人揀同一個 → 75', () => {
    const r = scoreQuestion(choice, byPlayer(['A', 'A', 'A', 'B']))
    expect(r.score).toBe(75)
    expect(r.consensus).toBe('A')
  })

  it('選項題：6 人局，2–6 人揀同一個 → 33、50、67、83、100', () => {
    expect(scoreQuestion(choice, byPlayer(['A', 'A', 'B', 'B', 'C', 'D'])).score).toBe(33)
    expect(scoreQuestion(choice, byPlayer(['A', 'A', 'A', 'B', 'C', 'D'])).score).toBe(50)
    expect(scoreQuestion(choice, byPlayer(['A', 'A', 'A', 'A', 'B', 'C'])).score).toBe(67)
    expect(scoreQuestion(choice, byPlayer(['A', 'A', 'A', 'A', 'A', 'B'])).score).toBe(83)
    expect(scoreQuestion(choice, byPlayer(['A', 'A', 'A', 'A', 'A', 'A'])).score).toBe(100)
  })

  it('選項題：4 人「2 比 2」同「2 比 1 比 1」都係 50', () => {
    expect(scoreQuestion(choice, byPlayer(['A', 'A', 'B', 'B'])).score).toBe(50)
    expect(scoreQuestion(choice, byPlayer(['A', 'A', 'B', 'C'])).score).toBe(50)
  })

  it('拉桿題：7、7、8、4 → 共識 7，68 分', () => {
    const r = scoreQuestion(slider, byPlayer([7, 7, 8, 4]))
    expect(r.consensus).toBe(7)
    expect(r.score).toBe(68)
    expect(r.playerScores).toEqual({ u0: 100, u1: 100, u2: 70, u3: 0 })
  })

  it('時間題：19、19、20、23 點 → 共識 19，68 分', () => {
    const r = scoreQuestion(time, byPlayer([19, 19, 20, 23]))
    expect(r.consensus).toBe(19)
    expect(r.score).toBe(68)
  })

  it('時間題：23 點同 0 點相差 1', () => {
    expect(scorePair(time, 23, 0)).toBe(70)
    expect(scorePair(time, 22, 0)).toBe(40)
    const r = scoreQuestion(time, byPlayer([23, 23, 0]))
    expect(r.consensus).toBe(23)
    expect(r.score).toBe(90) // (100 + 100 + 70) ÷ 3
  })

  it('配對題：3 人配法一樣、1 人全部不同 → 75', () => {
    const r = scoreQuestion(matching, byPlayer([SAME, SAME, SAME, ALL_DIFFERENT]))
    expect(r.score).toBe(75)
    expect(r.consensus).toEqual(SAME)
  })

  it('排序題：3 人一樣、1 人調轉相鄰兩樣 → 93', () => {
    const order = ['p', 'q', 'r', 's']
    const r = scoreQuestion(ranking, byPlayer([order, order, order, ['p', 'r', 'q', 's']]))
    expect(r.score).toBe(93)
    expect(r.consensus).toEqual(order)
    expect(r.playerScores.u3).toBe(70)
  })

  it('猜朋友題：3 人中 2 人猜中 → 67', () => {
    const r = scoreQuestion(guess, { t: 'A', g1: 'A', g2: 'A', g3: 'B' })
    expect(r.score).toBe(67)
    expect(r.targetAnswer).toBe('A')
    expect(r.playerScores).toEqual({ g1: 100, g2: 100, g3: 0 })
    expect(r.consensus).toBe(null)
  })
})

describe('無人吻合 → 0 分', () => {
  it('選項題全部唔同 → 0，冇共識，每人 0 分', () => {
    const r = scoreQuestion(choice, byPlayer(['A', 'B', 'C', 'D']))
    expect(r).toEqual({
      score: 0,
      consensus: null,
      consensuses: [],
      playerScores: { u0: 0, u1: 0, u2: 0, u3: 0 },
    })
  })

  it('拉桿題相距太遠 → 0', () => {
    expect(scoreQuestion(slider, byPlayer([2, 6])).score).toBe(0)
    expect(scoreQuestion(slider, byPlayer([0, 5, 10])).score).toBe(0)
  })

  it('相近都算吻合：拉桿 7 同 8 → 85', () => {
    expect(scoreQuestion(slider, byPlayer([7, 8])).score).toBe(85)
  })

  it('配對題兩人完全唔同 → 0', () => {
    expect(scoreQuestion(matching, byPlayer([SAME, ALL_DIFFERENT])).score).toBe(0)
  })

  it('排序題兩人完全倒轉 → 0', () => {
    expect(scoreQuestion(ranking, byPlayer([['p', 'q', 'r', 's'], ['s', 'r', 'q', 'p']])).score).toBe(0)
  })
})

describe('兩人局', () => {
  it('選項唔同 → 0；一樣 → 100', () => {
    expect(scoreQuestion(choice, byPlayer(['A', 'B'])).score).toBe(0)
    expect(scoreQuestion(choice, byPlayer(['A', 'A'])).score).toBe(100)
  })
})

describe('未作答', () => {
  it('冇 entry 嘅玩家唔計，唔當 0 分', () => {
    // 只有 3 人作答：A、A、B → 67（唔係 4 人嘅 50）
    expect(scoreQuestion(choice, { u0: 'A', u1: 'A', u2: 'B' }).score).toBe(67)
  })

  it('格式唔啱嘅答案當冇作答', () => {
    expect(scoreQuestion(choice, { u0: 'A', u1: 'A', u2: 'Z' }).score).toBe(100)
    expect(scoreQuestion(slider, { u0: 5, u1: 5, u2: 11, u3: 2.5 }).score).toBe(100)
    expect(scoreQuestion(time, { u0: 3, u1: 3, u2: 24, u3: -1 }).score).toBe(100)
    expect(scoreQuestion(ranking, { u0: ['p', 'q', 'r', 's'], u1: ['p', 'q', 'r', 's'], u2: ['p', 'p', 'r', 's'] }).score).toBe(100)
  })

  it('作答少過 2 人 → score null', () => {
    const empty = { score: null, consensus: null, consensuses: [], playerScores: {} }
    expect(scoreQuestion(choice, { u0: 'A' })).toEqual(empty)
    expect(scoreQuestion(choice, {})).toEqual(empty)
    expect(scoreQuestion(slider, undefined)).toEqual(empty)
  })

  it('配對題：未連完嘅線唔計分', () => {
    const partial = { bun: 'romantic', mtr: 'dangerous' } // 兩條線，都同共識一樣
    const r = scoreQuestion(matching, { u0: SAME, u1: partial })
    expect(r.consensus).toEqual(SAME)
    expect(r.playerScores.u1).toBeCloseTo(200 / 3)
    expect(r.score).toBe(83) // (100 + 66.67) ÷ 2
  })

  it('配對題：id 唔啱嘅線會被剔走', () => {
    const r = scoreQuestion(matching, { u0: SAME, u1: { ...SAME, typhoon: 'nope' } })
    expect(r.playerScores.u1).toBeCloseTo(200 / 3)
  })
})

describe('猜朋友題特殊情況', () => {
  it('目標冇作答 → null', () => {
    const r = scoreQuestion(guess, { g1: 'A', g2: 'A' })
    expect(r.score).toBe(null)
    expect(r.targetAnswer).toBe(null)
  })

  it('只有目標作答、冇人猜 → null', () => {
    const r = scoreQuestion(guess, { t: 'A' })
    expect(r.score).toBe(null)
    expect(r.targetAnswer).toBe('A')
  })

  it('唔用「最多一個人有分 → 0」：3 人得 1 人猜中仍然係 33', () => {
    expect(scoreQuestion(guess, { t: 'A', g1: 'A', g2: 'B', g3: 'C' }).score).toBe(33)
  })

  it('未作答嘅猜嘅人唔計', () => {
    expect(scoreQuestion(guess, { t: 'A', g1: 'A', g2: 'B' }).score).toBe(50)
  })
})

describe('共識打和', () => {
  it('2 比 2：consensus 用選項次序第一個，consensuses 列晒並列', () => {
    const r = scoreQuestion(choice, byPlayer(['B', 'B', 'A', 'A']))
    expect(r.consensus).toBe('A')
    expect(r.consensuses).toEqual(['A', 'B'])
    expect(r.playerScores).toEqual({ u0: 0, u1: 0, u2: 100, u3: 100 })
  })

  it('拉桿題打和：用最細嗰個數', () => {
    const r = scoreQuestion(slider, byPlayer([2, 2, 7, 7]))
    expect(r.consensus).toBe(2)
    expect(r.consensuses).toEqual([2, 7])
    expect(r.score).toBe(50)
  })

  it('中間值可以贏過兩邊：3、3、6、6 → 共識 4（220 分高過 200）', () => {
    const r = scoreQuestion(slider, byPlayer([3, 3, 6, 6]))
    expect(r.consensuses).toEqual([4, 5])
    expect(r.consensus).toBe(4)
    expect(r.score).toBe(55)
  })

  it('冇打和時 consensuses 得一個', () => {
    expect(scoreQuestion(choice, byPlayer(['A', 'A', 'B'])).consensuses).toEqual(['A'])
  })
})

describe('consensusCandidates', () => {
  it('配對題 6 種配法、排序題 24 種次序', () => {
    expect(consensusCandidates(matching)).toHaveLength(6)
    expect(consensusCandidates(ranking)).toHaveLength(24)
    expect(consensusCandidates(slider)).toHaveLength(11)
    expect(consensusCandidates(time)).toHaveLength(24)
  })
})

describe('scorePair', () => {
  it('選項題、猜朋友題：一樣 100，唔同 0', () => {
    expect(scorePair(choice, 'A', 'A')).toBe(100)
    expect(scorePair(choice, 'A', 'B')).toBe(0)
    expect(scorePair(guess, 'C', 'C')).toBe(100)
    expect(scorePair(guess, 'C', 'D')).toBe(0)
  })

  it('拉桿題：100 / 70 / 40 / 0', () => {
    expect(scorePair(slider, 5, 5)).toBe(100)
    expect(scorePair(slider, 5, 6)).toBe(70)
    expect(scorePair(slider, 5, 3)).toBe(40)
    expect(scorePair(slider, 5, 8)).toBe(0)
  })

  it('時間題：圓形距離', () => {
    expect(scorePair(time, 12, 12)).toBe(100)
    expect(scorePair(time, 1, 23)).toBe(40)
    expect(scorePair(time, 0, 12)).toBe(0)
  })

  it('排序題：6 組先後中 6 / 5 / 4 / 3 組', () => {
    const base = ['p', 'q', 'r', 's']
    expect(scorePair(ranking, base, base)).toBe(100)
    expect(scorePair(ranking, base, ['q', 'p', 'r', 's'])).toBe(70)
    expect(scorePair(ranking, base, ['q', 'p', 's', 'r'])).toBe(40)
    expect(scorePair(ranking, base, ['s', 'p', 'q', 'r'])).toBe(0) // 中 3 組
  })

  it('配對題：相同嘅線 ÷ 3', () => {
    expect(scorePair(matching, SAME, SAME)).toBe(100)
    expect(scorePair(matching, SAME, { bun: 'romantic', mtr: 'healing', typhoon: 'dangerous' })).toBeCloseTo(100 / 3)
    expect(scorePair(matching, SAME, ALL_DIFFERENT)).toBe(0)
    expect(scorePair(matching, SAME, { bun: 'romantic' })).toBeCloseTo(100 / 3)
  })

  it('任何一方冇作答 → null', () => {
    expect(scorePair(choice, 'A', undefined)).toBe(null)
    expect(scorePair(slider, undefined, 5)).toBe(null)
    expect(scorePair(time, null, 5)).toBe(null)
    expect(scorePair(ranking, ['p', 'q', 'r', 's'], undefined)).toBe(null)
    expect(scorePair(matching, undefined, SAME)).toBe(null)
    expect(scorePair(guess, 'A', undefined)).toBe(null)
  })
})

describe('averagePairScore', () => {
  it('所有題目平均，跳過其中一方冇作答嘅題目', () => {
    const questions = [choice, slider, time, choice]
    const answers = [
      { a: 'A', b: 'A' }, // 100
      { a: 5, b: 6 }, // 70
      { a: 3 }, // b 冇作答，跳過
      { a: 'A', b: 'B' }, // 0
    ]
    expect(averagePairScore(questions, answers, 'a', 'b')).toBe(57) // 170 ÷ 3
  })

  it('一題都冇得比 → null', () => {
    expect(averagePairScore([choice], [{ a: 'A' }], 'a', 'b')).toBe(null)
    expect(averagePairScore([], [], 'a', 'b')).toBe(null)
  })
})
