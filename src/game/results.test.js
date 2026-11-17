import { describe, expect, it } from 'vitest'
import {
  allPairScores,
  bestAndWorstPairs,
  buildResults,
  pairKey,
  personalRanking,
  rankingPopup,
  soleOutlierAward,
  theirExtremes,
  voiceOfPeopleAward,
} from './results.js'
import { scoreQuestion } from './scoring.js'

const choice = { type: 'choice', options: ['A', 'B', 'C', 'D'] }
const guess = { type: 'guess', options: ['A', 'B'], targetUid: 'a' }

describe('pairKey', () => {
  it('次序唔緊要，結果一樣', () => {
    expect(pairKey('a', 'b')).toBe(pairKey('b', 'a'))
    expect(pairKey('a', 'b')).toBe('a_b')
  })
})

describe('allPairScores', () => {
  it('計晒所有兩兩配對', () => {
    const questions = [choice]
    const answers = [{ a: 'A', b: 'A', c: 'B' }]
    const scores = allPairScores(questions, answers, ['a', 'b', 'c'])
    expect(scores).toEqual({
      a_b: 100,
      a_c: 0,
      b_c: 0,
    })
  })
})

describe('bestAndWorstPairs', () => {
  it('最高、最低對分，並列全部列出', () => {
    const pairScores = { a_b: 100, a_c: 50, b_c: 50 }
    expect(bestAndWorstPairs(['a', 'b', 'c'], pairScores, 3)).toEqual({
      best: [{ a: 'a', b: 'b', score: 100 }],
      worst: [
        { a: 'a', b: 'c', score: 50 },
        { a: 'b', b: 'c', score: 50 },
      ],
    })
  })

  it('兩人局唔頒', () => {
    expect(bestAndWorstPairs(['a', 'b'], { a_b: 100 }, 2)).toEqual({ best: null, worst: null })
  })

  it('冇任何一對有得比 → null', () => {
    expect(bestAndWorstPairs(['a', 'b'], { a_b: null }, 3)).toEqual({ best: null, worst: null })
  })
})

describe('soleOutlierAward', () => {
  it('成為唯一異類次數最多嘅玩家，並列全部列出', () => {
    const questions = [choice, choice, choice]
    const answers = [
      { a: 'A', b: 'A', c: 'B' }, // c 異類
      { a: 'A', b: 'B', c: 'B' }, // a 異類
      { a: 'A', b: 'A', c: 'A' }, // 冇異類
    ]
    expect(soleOutlierAward(questions, answers, ['a', 'b', 'c'])).toEqual({
      uids: ['a', 'c'],
      count: 1,
    })
  })

  it('一次都冇試過 → null', () => {
    const questions = [choice]
    const answers = [{ a: 'A', b: 'A', c: 'A' }]
    expect(soleOutlierAward(questions, answers, ['a', 'b', 'c'])).toBe(null)
  })
})

describe('voiceOfPeopleAward', () => {
  it('答案同共識一樣嘅題數最多，猜朋友題唔計', () => {
    const questions = [choice, guess]
    const answers = [
      { a: 'A', b: 'A', c: 'B' }, // 共識 A：a 中，b 中，c 唔中
      { a: 'A', b: 'B', c: 'B' }, // 猜朋友題唔計
    ]
    const scores = [scoreQuestion(questions[0], answers[0]), scoreQuestion(questions[1], answers[1])]
    expect(voiceOfPeopleAward(questions, answers, scores, ['a', 'b', 'c'])).toEqual({
      uids: ['a', 'b'],
      count: 1,
    })
  })

  it('共識打和：答中任何一個並列答案都計', () => {
    const questions = [choice]
    const answers = [{ a: 'A', b: 'A', c: 'B', d: 'B' }] // A、B 並列共識
    const scores = [scoreQuestion(questions[0], answers[0])]
    expect(voiceOfPeopleAward(questions, answers, scores, ['a', 'b', 'c', 'd'])).toEqual({
      uids: ['a', 'b', 'c', 'd'],
      count: 1,
    })
  })

  it('冇任何人答中過共識 → null', () => {
    const emptyScore = { score: null, consensus: null, consensuses: [], playerScores: {} }
    expect(voiceOfPeopleAward([choice], [{}], [emptyScore], ['a', 'b'])).toBe(null)
  })
})

describe('personalRanking', () => {
  it('由最夾到最唔夾，分數一樣共享排名', () => {
    const pairScores = { a_b: 100, a_c: 50, a_d: 50 }
    expect(personalRanking('a', pairScores, ['b', 'c', 'd'])).toEqual({
      ranked: [
        { uid: 'b', score: 100, rank: 1 },
        { uid: 'c', score: 50, rank: 2 },
        { uid: 'd', score: 50, rank: 2 },
      ],
      noData: [],
    })
  })

  it('冇得比嘅玩家放喺 noData，唔排名', () => {
    const pairScores = { a_b: 100, a_c: null }
    expect(personalRanking('a', pairScores, ['b', 'c'])).toEqual({
      ranked: [{ uid: 'b', score: 100, rank: 1 }],
      noData: ['c'],
    })
  })
})

describe('theirExtremes', () => {
  it('並列嘅排第一、排尾都全部列出', () => {
    const pairScores = { a_b: 100, a_c: 100, a_d: 20 }
    expect(theirExtremes('a', pairScores, ['a', 'b', 'c', 'd'])).toEqual({
      firsts: ['b', 'c'],
      lasts: ['d'],
    })
  })

  it('冇得比 → 都係空陣列', () => {
    expect(theirExtremes('a', {}, ['a', 'b'])).toEqual({ firsts: [], lasts: [] })
  })
})

describe('rankingPopup', () => {
  it('雙向奔赴：大家都排對方第一', () => {
    const pairScores = { a_b: 100, a_c: 10, b_c: 10 }
    expect(rankingPopup('a', 'b', pairScores, ['a', 'b', 'c'])).toBe('mutual')
  })

  it('單戀：我排佢第一，佢排我尾', () => {
    const pairScores = { a_b: 50, a_c: 10, b_c: 90 }
    expect(rankingPopup('a', 'b', pairScores, ['a', 'b', 'c'])).toBe('oneSided')
  })

  it('我冇排佢第一 → null', () => {
    const pairScores = { a_b: 10, a_c: 100, b_c: 10 }
    expect(rankingPopup('a', 'b', pairScores, ['a', 'b', 'c'])).toBe(null)
  })

  it('並列第一都計：三人都係 100 分', () => {
    const pairScores = { a_b: 100, a_c: 100, b_c: 100 }
    expect(rankingPopup('a', 'b', pairScores, ['a', 'b', 'c'])).toBe('mutual')
  })
})

describe('buildResults', () => {
  it('組合全組默契分、稱號、對分、獎項', () => {
    const questions = [choice, choice]
    const answers = [
      { a: 'A', b: 'A', c: 'B' },
      { a: 'A', b: 'A', c: 'A' },
    ]
    const scores = answers.map((a, i) => scoreQuestion(questions[i], a))
    const result = buildResults({
      questions,
      answersByQuestion: answers,
      scoresByQuestion: scores,
      uids: ['a', 'b', 'c'],
      playerCount: 3,
    })
    expect(result.groupScore).toBe(84) // (67 + 100) ÷ 2
    expect(result.groupTitle).toBe('oldFriends')
    expect(result.pairScores).toEqual({ a_b: 100, a_c: 50, b_c: 50 })
    expect(result.awards.bestMatch).toEqual([{ a: 'a', b: 'b', score: 100 }])
    expect(result.awards.voiceOfPeople).toEqual({ uids: ['a', 'b'], count: 2 })
  })
})
