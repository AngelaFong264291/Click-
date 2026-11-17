import { hoursInRange } from './compare.js'
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

function isCompatibleAdjective(adjective, group) {
  return adjective.groups === 'all' || adjective.groups.includes(group.id)
}

function compatibleAdjectives(group) {
  return adjectives.filter((adjective) => isCompatibleAdjective(adjective, group))
}

function eligibleGroups(minItems, minAdjectives = 0) {
  return groups.filter((group) => group.items.length >= minItems && compatibleAdjectives(group).length >= minAdjectives)
}

function isSuited(template, group) {
  return template.suited === 'all' || template.suited.includes(group.category)
}

/**
 * 喺 candidateTemplates × 適用嘅主題入面揀一對。方向盡量唔重複（唔夠先放寬，唔會因為方向唔夠而失敗）；
 * 類別唔啱嘅主題一定唔會揀（呢個係硬性規則，冇得放寬）。
 */
function pickTemplateGroupPair(candidateTemplates, minItems, minAdjectives, usedDirections, random, description) {
  const eligible = eligibleGroups(minItems, minAdjectives)
  const pairs = []
  for (const template of candidateTemplates) {
    for (const group of eligible) {
      if (isSuited(template, group)) pairs.push({ template, group })
    }
  }
  if (pairs.length === 0) throw new Error(`Cannot generate a full game: no template/theme pair available for ${description}.`)
  const fresh = pairs.filter((pair) => !usedDirections.has(pair.group.direction))
  const chosen = pickOne(fresh.length > 0 ? fresh : pairs, random, description)
  usedDirections.add(chosen.group.direction)
  return chosen
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

  const usedDirections = new Set()
  let remainingChoiceTemplates = templates.filter((template) => template.type === 'choice')
  const rankingTemplates = templates.filter((template) => template.type === 'ranking')
  const guessTemplates = templates.filter((template) => template.type === 'guess')
  const matchingTemplate = pickOne(
    templates.filter((template) => template.type === 'matching'),
    random,
    'matching template',
  )
  const sliderTemplate = pickOne(
    templates.filter((template) => template.type === 'slider'),
    random,
    'slider template',
  )

  return QUESTION_ORDER.map((type) => {
    if (type === 'choice') {
      const { template, group } = pickTemplateGroupPair(remainingChoiceTemplates, 4, 0, usedDirections, random, 'choice question')
      remainingChoiceTemplates = remainingChoiceTemplates.filter((candidate) => candidate.id !== template.id)
      return makeQuestion(
        type,
        template,
        { item: group.name },
        { theme: group.name, options: sample(group.items, 4, random) },
      )
    }

    if (type === 'slider') {
      if (sliderTemplate.standalone) {
        return makeQuestion(type, sliderTemplate, {}, { sliderLabels: sliderTemplate.sliderLabels })
      }
      const { group } = pickTemplateGroupPair([sliderTemplate], 1, 1, usedDirections, random, 'slider question')
      const item = pickOne(group.items, random, 'slider item')
      const adjective = pickOne(compatibleAdjectives(group), random, 'compatible slider adjective')
      return makeQuestion(type, sliderTemplate, { item, adj: adjective }, { theme: group.name, sliderLabels: sliderTemplate.sliderLabels })
    }

    if (type === 'matching') {
      const { group } = pickTemplateGroupPair([matchingTemplate], 3, 3, usedDirections, random, 'matching question')
      return makeQuestion(
        type,
        matchingTemplate,
        { item: group.name },
        {
          theme: group.name,
          options: sample(group.items, 3, random),
          adjectives: sample(compatibleAdjectives(group), 3, random),
        },
      )
    }

    if (type === 'time') {
      const activity = pickOne(activities, random, 'activity for the time question')
      return {
        type,
        templateId: activity.id,
        text: activity.text,
        hours: hoursInRange(activity.hourRange.start, activity.hourRange.end),
      }
    }

    if (type === 'ranking') {
      const { template, group } = pickTemplateGroupPair(rankingTemplates, 4, 0, usedDirections, random, 'ranking question')
      const adjective = pickOne(compatibleAdjectives(group), random, 'compatible ranking adjective')
      return makeQuestion(
        type,
        template,
        { item: group.name, adj: adjective },
        { theme: group.name, options: sample(group.items, 4, random) },
      )
    }

    const { template, group } = pickTemplateGroupPair(guessTemplates, 4, 0, usedDirections, random, 'guess question')
    const targetUid = pickOne(playerUids, random, 'guess target')
    return makeQuestion(
      type,
      template,
      { item: group.name },
      { theme: group.name, options: sample(group.items, 4, random), targetUid },
    )
  })
}
