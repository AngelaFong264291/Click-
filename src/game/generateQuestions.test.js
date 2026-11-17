import { describe, expect, it } from 'vitest'
import activities from '../data/activities.json'
import groups from '../data/groups.json'
import templates from '../data/templates.json'
import { hoursInRange } from './compare.js'
import { scoreQuestion } from './scoring.js'
import { generateQuestions } from './generateQuestions.js'

const groupByName = new Map(groups.map((group) => [JSON.stringify(group.name), group]))
const templateById = new Map(templates.map((template) => [template.id, template]))
const activityById = new Map(activities.map((activity) => [activity.id, activity]))

const QUESTION_ORDER = [
  'choice',
  'slider',
  'choice',
  'matching',
  'choice',
  'time',
  'choice',
  'ranking',
  'guess',
  'choice',
]

function seededRandom(seed) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function answerFor(question) {
  if (question.type === 'slider') return 5
  if (question.type === 'time') return 12
  if (question.type === 'matching') {
    return Object.fromEntries(question.options.map((item, index) => [item.id, question.adjectives[index].id]))
  }
  if (question.type === 'ranking') return question.options.map((item) => item.id)
  return question.options[0].id
}

function expectScorable(questions, playerUids) {
  for (const question of questions) {
    const answers = Object.fromEntries(playerUids.map((uid) => [uid, answerFor(question)]))
    expect(() => scoreQuestion(question, answers)).not.toThrow()
  }
}

/** choice / slider / matching / ranking / guess 揀嘅主題一定要啱模板嘅「適用」分類。 */
function expectThemeMatchesTemplate(question) {
  if (!question.theme) return
  const group = groupByName.get(JSON.stringify(question.theme))
  expect(group).toBeDefined()
  const template = templateById.get(question.templateId)
  expect(template).toBeDefined()
  expect(template.suited === 'all' || template.suited.includes(group.category)).toBe(true)
}

/** 時間題嘅 hours 一定要同該活動嘅 hourRange 一致，順序排好。 */
function expectTimeHoursMatchActivity(question) {
  if (question.type !== 'time') return
  const activity = activityById.get(question.templateId)
  expect(activity).toBeDefined()
  expect(question.hours).toEqual(hoursInRange(activity.hourRange.start, activity.hourRange.end))
}

describe('generateQuestions', () => {
  it('generates the fixed 10-question order with no repeated templates', () => {
    const questions = generateQuestions(['p1', 'p2'], seededRandom(42))

    expect(questions).toHaveLength(10)
    expect(questions.map((question) => question.type)).toEqual(QUESTION_ORDER)
    expect(new Set(questions.map((question) => question.templateId)).size).toBe(10)
    expect(questions.every((question) => question.text.zh && question.text.en)).toBe(true)
  })

  it.each([2, 6])('generates scorer-compatible output for %i players', (playerCount) => {
    const playerUids = Array.from({ length: playerCount }, (_, index) => `player-${index}`)
    const questions = generateQuestions(playerUids, seededRandom(playerCount))

    expectScorable(questions, playerUids)
    expect(questions[8].targetUid).toEqual(expect.stringMatching(/^player-/))
    expect(questions[8].text.zh).toContain('{name}')
    expect(questions[8].text.en).toContain('{name}')
    expect(questions[8]).not.toHaveProperty('targetName')
  })

  it('returns the same game for the same seed', () => {
    const players = ['a', 'b', 'c']
    expect(generateQuestions(players, seededRandom(1234))).toEqual(
      generateQuestions(players, seededRandom(1234)),
    )
  })

  it('keeps hundreds of seeded games complete, scorable, and theme/time consistent', () => {
    for (let seed = 0; seed < 300; seed++) {
      const playerUids = seed % 2 === 0 ? ['a', 'b'] : ['a', 'b', 'c', 'd', 'e', 'f']
      const questions = generateQuestions(playerUids, seededRandom(seed))

      expect(questions.map((question) => question.type)).toEqual(QUESTION_ORDER)
      expect(new Set(questions.map((question) => question.templateId)).size).toBe(10)
      expectScorable(questions, playerUids)
      questions.forEach(expectThemeMatchesTemplate)
      questions.forEach(expectTimeHoursMatchActivity)
    }
  })

  it('stores the theme name on every theme-based question, and nowhere else', () => {
    const questions = generateQuestions(['a', 'b', 'c'], seededRandom(7))
    const themeTypes = ['choice', 'matching', 'ranking', 'guess']

    questions.forEach((question) => {
      if (themeTypes.includes(question.type)) {
        expect(question.theme).toEqual(expect.objectContaining({ zh: expect.any(String), en: expect.any(String) }))
      } else if (question.type === 'time') {
        expect(question).not.toHaveProperty('theme')
      }
      // slider 可能係 standalone（冇 theme）或者 generic（有 theme），兩種都合法。
    })
  })

  it('explains invalid player lists and random sources', () => {
    expect(() => generateQuestions(['only-one'])).toThrow('between 2 and 6 player UIDs')
    expect(() => generateQuestions(['a', 'a'])).toThrow('unique player UIDs')
    expect(() => generateQuestions(['a', 'b'], () => 1)).toThrow('range [0, 1)')
  })
})