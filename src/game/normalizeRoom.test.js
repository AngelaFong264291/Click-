import { describe, expect, it } from 'vitest'
import { normalizeRoom } from './normalizeRoom.js'

describe('normalizeRoom', () => {
  it('room 唔存在就原樣返回', () => {
    expect(normalizeRoom(null)).toBe(null)
    expect(normalizeRoom(undefined)).toBe(undefined)
  })

  it('大堂房（未開局）：scores／results 唔存在，唔會無端生出嚟', () => {
    const room = { host: 'a', status: 'lobby', players: { a: { name: 'A', joinedAt: 1, online: true } } }
    const normalized = normalizeRoom(room)
    expect(normalized.scores).toBeUndefined()
    expect(normalized.results).toBeUndefined()
    expect(normalized.host).toBe('a')
    expect(normalized.players).toEqual(room.players)
  })

  describe('scores', () => {
    it('答案少過 2 人（Firebase 淨低 events）：補返 score/consensus/consensuses/playerScores', () => {
      const room = { scores: { 0: { events: { fireworks: false } } } }
      const normalized = normalizeRoom(room)
      expect(normalized.scores[0]).toEqual({
        score: null,
        consensus: null,
        consensuses: [],
        playerScores: {},
        targetAnswer: null,
        events: { mindMeld: [], outliers: [], fireworks: false },
      })
    })

    it('猜朋友題：consensus/consensuses 一定俾刪走（guess 本身就係 null/[]），targetAnswer 冇人估都俾刪走', () => {
      const room = {
        scores: {
          8: { score: 50, playerScores: { g1: 100, g2: 0 }, events: { fireworks: false } },
        },
      }
      const normalized = normalizeRoom(room)
      expect(normalized.scores[8]).toEqual({
        score: 50,
        consensus: null,
        consensuses: [],
        playerScores: { g1: 100, g2: 0 },
        targetAnswer: null,
        events: { mindMeld: [], outliers: [], fireworks: false },
      })
    })

    it('mindMeld／outliers 冇觸發就俾刪走，補返空陣列', () => {
      const room = { scores: { 0: { score: 100, consensus: 'A', playerScores: { a: 100 }, events: { fireworks: true } } } }
      const normalized = normalizeRoom(room)
      expect(normalized.scores[0].events).toEqual({ mindMeld: [], outliers: [], fireworks: true })
    })

    it('一個完整、冇被刪走任何嘢嘅 score：原封不動（normalize 唔會整壞真數據）', () => {
      const full = {
        score: 68,
        consensus: 7,
        consensuses: [7],
        playerScores: { a: 100, b: 100, c: 70, d: 0 },
        targetAnswer: null,
        events: { mindMeld: [{ a: 'a', b: 'b', streak: 3 }], outliers: [], fireworks: false },
      }
      const room = { scores: { 1: full } }
      expect(normalizeRoom(room).scores[1]).toEqual(full)
    })

    it('多題：淨係補返有 entry 嘅題目，其他題目索引唔存在', () => {
      const room = { scores: { 0: { events: { fireworks: false } }, 2: { score: 100, events: { fireworks: true } } } }
      const normalized = normalizeRoom(room)
      expect(Object.keys(normalized.scores)).toEqual(['0', '2'])
      expect(normalized.scores[0].score).toBe(null)
      expect(normalized.scores[2].score).toBe(100)
    })
  })

  describe('results', () => {
    it('結果未完全空（有部分欄位），淨係補返俾刪走嘅', () => {
      const room = {
        results: {
          groupScore: 78,
          pairScores: { a_b: 82 },
          awards: { bestMatch: { a: 'a', b: 'b', score: 82 } },
        },
      }
      const normalized = normalizeRoom(room)
      expect(normalized.results).toEqual({
        groupScore: 78,
        groupTitle: null,
        pairScores: { a_b: 82 },
        awards: { bestMatch: { a: 'a', b: 'b', score: 82 }, parallelLines: null, soleOutlier: null, voiceOfPeople: null },
      })
    })

    it('pairScores 全部係 null（成對人冇夾過）：成個 object 俾刪走，補返 {}', () => {
      const room = { results: { groupScore: null, groupTitle: null } }
      const normalized = normalizeRoom(room)
      expect(normalized.results.pairScores).toEqual({})
    })

    it('awards 全部係 null（成局冇觸發任何獎項）：成個 awards object 俾刪走，補返全 null', () => {
      const room = { results: { groupScore: 50, groupTitle: 'justFriends', pairScores: { a_b: 50 } } }
      const normalized = normalizeRoom(room)
      expect(normalized.results.awards).toEqual({
        bestMatch: null,
        parallelLines: null,
        soleOutlier: null,
        voiceOfPeople: null,
      })
    })

    it('完整結果：原封不動', () => {
      const full = {
        groupScore: 85,
        groupTitle: 'oldFriends',
        pairScores: { a_b: 85, a_c: 70, b_c: 90 },
        awards: {
          bestMatch: [{ a: 'b', b: 'c', score: 90 }],
          parallelLines: [{ a: 'a', b: 'c', score: 70 }],
          soleOutlier: { uids: ['a'], count: 2 },
          voiceOfPeople: { uids: ['b'], count: 5 },
        },
      }
      const room = { results: full }
      expect(normalizeRoom(room).results).toEqual(full)
    })
  })
})
