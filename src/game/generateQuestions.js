import adjectives from '../data/adjectives.json'
import activities from '../data/activities.json'
import groups from '../data/groups.json'
import templates from '../data/templates.json'
import { validateContent } from '../data/validate.js'

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

function randomIndex(length, random) {
  const value = random()
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error('random must return a finite number in the range [0, 1)')
  }
  return Math.floor(value * length)
}

function pickOne(items, random, description) {
  if (items.length === 0) throw new Error(`Cannot generate a full game: no ${description} available.`)
  return items[randomIndex(items.length, random)]
}

function sample(items, count, random) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = randomIndex(index + 1, random)
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled.slice(0, count)
}

function eligibleGroups(minItems, minAdjectives = 0) {
  return groups.filter((group) => {
    const compatibleCount = adjectives.filter((adjective) => adjective.groups.includes(group.id)).length
    return group.items.length >= minItems && compatibleCount >= minAdjectives
  })
}

function compatibleAdjectives(group) {
  return adjectives.filter((adjective) => adjective.groups.includes(group.id))
}

function renderText(template, values) {
  return Object.fromEntries(
    ['zh', 'en'].map((language) => [
      language,
      template.text[language].replace(/\{(item|adj)\}/g, (_, field) => values[field][language]),
    ]),
  )
}

function makeQuestion(type, template, values, fields = {}) {
  return {
    type,
    templateId: template.id,
    text: renderText(template, values),
    ...fields,
  }
}

function validatePlayers(playerUids) {
  if (!Array.isArray(playerUids) || playerUids.length < 2 || playerUids.length > 6) {
    throw new Error('generateQuestions needs between 2 and 6 player UIDs.')
  }
  if (playerUids.some((uid) => typeof uid !== 'string' || uid.length === 0)) {
    throw new Error('generateQuestions requires every player UID to be a non-empty string.')
  }
  if (new Set(playerUids).size !== playerUids.length) {
    throw new Error('generateQuestions requires unique player UIDs.')
  }
}

/** Generate one full game from local content. random can be seeded by the caller. */
export function generateQuestions(playerUids, random = Math.random) {
  validatePlayers(playerUids)
  if (typeof random !== 'function') throw new Error('random must be a function.')

  const contentErrors = validateContent({ groups, adjectives, activities, templates })
  if (contentErrors.length > 0) {
    throw new Error(`Cannot generate a full game: question content is invalid. ${contentErrors.join('; ')}`)
  }

  const choiceTemplates = sample(templates.filter((template) => template.type === 'choice'), 5, random)
  const templateByType = Object.fromEntries(
    ['slider', 'matching', 'time', 'ranking', 'guess'].map((type) => [
      type,
      pickOne(templates.filter((template) => template.type === type), random, `${type} template`),
    ]),
  )
  let choiceIndex = 0

  return QUESTION_ORDER.map((type) => {
    if (type === 'choice') {
      const template = choiceTemplates[choiceIndex++]
      const group = pickOne(eligibleGroups(4), random, 'group with at least 4 items for choice questions')
      return makeQuestion(
        type,
        template,
        { item: group.name },
        { options: sample(group.items, 4, random) },
      )
    }

    const template = templateByType[type]
    if (type === 'slider') {
      const group = pickOne(eligibleGroups(1, 1), random, 'group with an item and compatible adjective for slider')
      const item = pickOne(group.items, random, 'slider item')
      const adjective = pickOne(compatibleAdjectives(group), random, 'compatible slider adjective')
      return makeQuestion(type, template, { item, adj: adjective })
    }
    if (type === 'matching') {
      const group = pickOne(eligibleGroups(3, 3), random, 'group with 3 items and 3 compatible adjectives for matching')
      return makeQuestion(
        type,
        template,
        { item: group.name },
        {
          options: sample(group.items, 3, random),
          adjectives: sample(compatibleAdjectives(group), 3, random),
        },
      )
    }
    if (type === 'time') {
      const activity = pickOne(activities, random, 'activity for the time question')
      return makeQuestion(type, template, { item: activity })
    }
    if (type === 'ranking') {
      const group = pickOne(eligibleGroups(4, 1), random, 'group with 4 items and compatible adjective for ranking')
      const adjective = pickOne(compatibleAdjectives(group), random, 'compatible ranking adjective')
      return makeQuestion(
        type,
        template,
        { item: group.name, adj: adjective },
        { options: sample(group.items, 4, random) },
      )
    }

    const group = pickOne(eligibleGroups(4), random, 'group with at least 4 items for guess questions')
    const targetUid = pickOne(playerUids, random, 'guess target')
    return makeQuestion(
      type,
      template,
      { item: group.name },
      { options: sample(group.items, 4, random), targetUid },
    )
  })
}