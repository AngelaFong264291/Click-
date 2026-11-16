import { describe, expect, it } from 'vitest'
import {
  ANSWER_GRACE_MS,
  autoSubmitValue,
  hasEveryoneAnswered,
  nextQuestionState,
  onlinePlayerUids,
  questionDeadline,
  questionDurationMs,
  shouldRevealQuestion,
} from './flow.js'

const players = {
  host: { online: true },
  player: { online: true },
  offline: { online: false },
  left: { online: true, left: true },
}

describe('question timing and participation', () => {
  it('uses 15 seconds for matching and 10 seconds for other questions', () => {
    expect(questionDurationMs('matching')).toBe(15_000)
    expect(questionDurationMs('slider')).toBe(10_000)
    expect(questionDeadline(1_000, 'matching')).toBe(16_000)
    expect(questionDeadline(1_000, 'choice')).toBe(11_000)
    expect(() => questionDeadline(Number.NaN, 'choice')).toThrow('finite number')
  })

  it('only considers online players who have not left', () => {
    expect(onlinePlayerUids(players)).toEqual(['host', 'player'])
    expect(hasEveryoneAnswered(players, { host: { value: 0 }, player: { value: 'x' } })).toBe(true)
    expect(hasEveryoneAnswered(players, { host: { value: 0 }, offline: { value: 'x' } })).toBe(false)
    expect(hasEveryoneAnswered({ offline: { online: false } }, {})).toBe(false)
  })

  it('reveals when everyone online answers or the deadline grace expires', () => {
    const room = { status: 'playing', phase: 'answering', deadline: 20_000 }
    expect(shouldRevealQuestion(room, players, { host: { value: 1 }, player: { value: 2 } }, 1)).toBe(true)
    expect(shouldRevealQuestion(room, players, { host: { value: 1 } }, 20_000 + ANSWER_GRACE_MS - 1)).toBe(false)
    expect(shouldRevealQuestion(room, players, { host: { value: 1 } }, 20_000 + ANSWER_GRACE_MS)).toBe(true)
    expect(shouldRevealQuestion({ ...room, phase: 'reveal' }, players, {}, 30_000)).toBe(false)
  })
})

describe('deadline auto-submit', () => {
  it('auto-submits interacted slider and time values only', () => {
    expect(autoSubmitValue({ type: 'slider' }, 0, true)).toBe(0)
    expect(autoSubmitValue({ type: 'time' }, 23, true)).toBe(23)
    expect(autoSubmitValue({ type: 'slider' }, 5, false)).toBeUndefined()
    expect(autoSubmitValue({ type: 'choice', options: ['a'] }, 'a', true)).toBeUndefined()
  })

  it('keeps partial matching lines but does not submit empty lines', () => {
    const question = {
      type: 'matching',
      options: ['a', 'b', 'c'],
      adjectives: ['x', 'y', 'z'],
    }
    expect(autoSubmitValue(question, { a: 'x' }, true)).toEqual({ a: 'x' })
    expect(autoSubmitValue(question, {}, true)).toBeUndefined()
  })

  it('does not auto-submit incomplete or invalid rankings', () => {
    const question = { type: 'ranking', options: ['a', 'b', 'c', 'd'] }
    expect(autoSubmitValue(question, ['a', 'b'], true)).toBeUndefined()
    expect(autoSubmitValue(question, ['a', 'b', 'c', 'a'], true)).toBeUndefined()
    expect(autoSubmitValue(question, ['d', 'c', 'b', 'a'], true)).toEqual(['d', 'c', 'b', 'a'])
  })
})

describe('next question', () => {
  it('advances until the tenth question, then finishes', () => {
    expect(nextQuestionState(0)).toEqual({ status: 'playing', current: 1, phase: 'answering' })
    expect(nextQuestionState(8)).toEqual({ status: 'playing', current: 9, phase: 'answering' })
    expect(nextQuestionState(9)).toEqual({ status: 'finished' })
    expect(() => nextQuestionState(-1)).toThrow('integer from 0 to 9')
    expect(() => nextQuestionState(10)).toThrow('integer from 0 to 9')
  })
})