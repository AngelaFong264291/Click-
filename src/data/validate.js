import { HOURS, hoursInRange } from '../game/compare.js'

export const CATEGORIES = ['food', 'object', 'animal', 'place', 'activity', 'habit']
export const ALLOWED_TAGS = ['hk', 'spicy']

// {name} 淨係 guess 題先至必填；其餘 placeholder 可用可唔用（內容未必點都要提個主題名）。
const OPTIONAL_TEMPLATE_FIELDS = {
  choice: ['item'],
  slider: ['adj', 'item'],
  matching: ['item'],
  ranking: ['adj', 'item'],
  guess: ['item', 'name'],
}
const REQUIRED_TEMPLATE_FIELDS = {
  guess: ['name'],
}

const REQUIRED_TEMPLATE_COUNTS = {
  choice: 5,
  slider: 1,
  matching: 1,
  ranking: 1,
  guess: 1,
}

function hasBilingualText(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.zh === 'string' &&
    value.zh.trim().length > 0 &&
    typeof value.en === 'string' &&
    value.en.trim().length > 0
  )
}

function uniqueIds(entries, path, errors) {
  const seen = new Set()
  for (const [index, entry] of (Array.isArray(entries) ? entries : []).entries()) {
    if (typeof entry?.id !== 'string' || entry.id.length === 0) {
      errors.push(`${path}[${index}].id must be a non-empty string`)
    } else if (seen.has(entry.id)) {
      errors.push(`${path}[${index}].id duplicates "${entry.id}"`)
    } else {
      seen.add(entry.id)
    }
  }
}

function checkTags(tags, path, errors) {
  if (tags === undefined) return
  if (!Array.isArray(tags)) {
    errors.push(`${path}.tags must be an array`)
    return
  }
  for (const tag of tags) {
    if (!ALLOWED_TAGS.includes(tag)) errors.push(`${path}.tags has unknown tag "${tag}"`)
  }
}

function placeholderNames(text) {
  return [...text.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1])
}

function hasMalformedPlaceholder(text) {
  return /[{}]/.test(text.replace(/\{[^{}]*\}/g, ''))
}

/** suited / groups 可以係 'all'，或者一個非空陣列（分別裝分類 slug / 主題 id）。 */
function checkSuitedLike(value, path, errors, { validValues, label }) {
  if (value === 'all') return
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be "all" or a non-empty array of ${label}`)
    return
  }
  for (const entry of value) {
    if (!validValues.has(entry)) errors.push(`${path} references unknown ${label} "${entry}"`)
  }
}

function compatibleAdjectiveCount(group, adjectives) {
  return adjectives.filter((adjective) => adjective?.groups === 'all' || (Array.isArray(adjective?.groups) && adjective.groups.includes(group?.id))).length
}

function eligibleGroupCount(groups, adjectives, minItems, minAdjectives) {
  return groups.filter((group) => {
    const itemCount = Array.isArray(group?.items) ? group.items.length : 0
    return itemCount >= minItems && compatibleAdjectiveCount(group, adjectives) >= minAdjectives
  }).length
}

/** Returns actionable errors for the local content files. */
export function validateContent({ groups, adjectives, activities, templates }) {
  const errors = []
  const validGroups = Array.isArray(groups) ? groups : []
  const validAdjectives = Array.isArray(adjectives) ? adjectives : []
  const validActivities = Array.isArray(activities) ? activities : []
  const validTemplates = Array.isArray(templates) ? templates : []

  for (const [name, value] of Object.entries({ groups, adjectives, activities, templates })) {
    if (!Array.isArray(value)) errors.push(`${name} must be an array`)
  }

  uniqueIds(validGroups, 'groups', errors)
  uniqueIds(validAdjectives, 'adjectives', errors)
  uniqueIds(validActivities, 'activities', errors)
  uniqueIds(validTemplates, 'templates', errors)

  const groupIds = new Set(validGroups.map((group) => group?.id).filter(Boolean))
  const categorySet = new Set(CATEGORIES)
  const itemIds = new Set()
  for (const [groupIndex, group] of validGroups.entries()) {
    const groupPath = `groups[${groupIndex}]`
    if (!hasBilingualText(group?.name)) errors.push(`${groupPath}.name must have non-empty zh and en strings`)
    if (!categorySet.has(group?.category)) {
      errors.push(`${groupPath}.category must be one of ${CATEGORIES.join(', ')}`)
    }
    if (typeof group?.direction !== 'string' || group.direction.trim().length === 0) {
      errors.push(`${groupPath}.direction must be a non-empty string`)
    }
    if (!Array.isArray(group?.items)) {
      errors.push(`${groupPath}.items must be an array`)
      continue
    }
    for (const [itemIndex, item] of group.items.entries()) {
      const itemPath = `${groupPath}.items[${itemIndex}]`
      if (typeof item?.id !== 'string' || item.id.length === 0) {
        errors.push(`${itemPath}.id must be a non-empty string`)
      } else if (itemIds.has(item.id)) {
        errors.push(`${itemPath}.id duplicates item "${item.id}"`)
      } else {
        itemIds.add(item.id)
      }
      if (!hasBilingualText(item)) errors.push(`${itemPath} must have non-empty zh and en strings`)
      checkTags(item?.tags, itemPath, errors)
    }
  }

  for (const [index, adjective] of validAdjectives.entries()) {
    const path = `adjectives[${index}]`
    if (!hasBilingualText(adjective)) errors.push(`${path} must have non-empty zh and en strings`)
    checkSuitedLike(adjective?.groups, `${path}.groups`, errors, { validValues: groupIds, label: 'group id' })
    checkTags(adjective?.tags, path, errors)
  }

  for (const [index, activity] of validActivities.entries()) {
    const path = `activities[${index}]`
    if (!hasBilingualText(activity?.text)) errors.push(`${path}.text must have non-empty zh and en strings`)
    const start = activity?.hourRange?.start
    const end = activity?.hourRange?.end
    const validHour = (h) => Number.isInteger(h) && h >= 0 && h < HOURS
    if (!validHour(start) || !validHour(end)) {
      errors.push(`${path}.hourRange.start and .end must be integers from 0 to 23`)
    } else if (hoursInRange(start, end).length < 2) {
      errors.push(`${path}.hourRange must cover at least 2 hours`)
    }
    checkTags(activity?.tags, path, errors)
  }

  const templatesByType = new Map()
  for (const [index, template] of validTemplates.entries()) {
    const templatePath = `templates[${index}]`
    checkTags(template?.tags, templatePath, errors)
    if (!hasBilingualText(template?.text)) {
      errors.push(`${templatePath}.text must have non-empty zh and en strings`)
      continue
    }
    const type = template.type
    const isStandaloneSlider = type === 'slider' && template.standalone === true
    const optionalFields = OPTIONAL_TEMPLATE_FIELDS[type]
    if (!optionalFields && type !== 'slider') {
      errors.push(`${templatePath}.type is not a supported question type`)
      continue
    }
    templatesByType.set(type, (templatesByType.get(type) ?? 0) + 1)

    for (const language of ['zh', 'en']) {
      if (hasMalformedPlaceholder(template.text[language])) {
        errors.push(`${templatePath}.text.${language} has malformed placeholder syntax`)
      }
    }
    const uniqueZhFields = [...new Set(placeholderNames(template.text.zh))].sort()
    const uniqueEnFields = [...new Set(placeholderNames(template.text.en))].sort()
    if (JSON.stringify(uniqueZhFields) !== JSON.stringify(uniqueEnFields)) {
      errors.push(`${templatePath}.text must use the same placeholders in zh and en`)
    }

    if (isStandaloneSlider) {
      if (uniqueZhFields.length > 0) errors.push(`${templatePath}.text must have no placeholders (standalone slider)`)
      if (!template.sliderLabels) errors.push(`${templatePath}.sliderLabels is required for a slider question`)
      else checkSliderLabels(template.sliderLabels, templatePath, errors)
      continue
    }

    const allowedFields = type === 'slider' ? OPTIONAL_TEMPLATE_FIELDS.slider : optionalFields
    const requiredFields = REQUIRED_TEMPLATE_FIELDS[type] ?? []
    for (const field of new Set([...uniqueZhFields, ...uniqueEnFields])) {
      if (!allowedFields.includes(field)) {
        errors.push(`${templatePath}.text placeholder {${field}} cannot be filled for type "${type}"`)
      }
    }
    for (const field of requiredFields) {
      if (!uniqueZhFields.includes(field)) {
        errors.push(`${templatePath}.text is missing required placeholder {${field}}`)
      }
    }

    if (type === 'slider') {
      if (!template.sliderLabels) errors.push(`${templatePath}.sliderLabels is required for a slider question`)
      else checkSliderLabels(template.sliderLabels, templatePath, errors)
      checkSuitedLike(template.suited, `${templatePath}.suited`, errors, { validValues: categorySet, label: 'category' })
    } else {
      checkSuitedLike(template.suited, `${templatePath}.suited`, errors, { validValues: categorySet, label: 'category' })
    }
  }

  for (const [type, minCount] of Object.entries(REQUIRED_TEMPLATE_COUNTS)) {
    const count = templatesByType.get(type) ?? 0
    if (count < minCount) errors.push(`templates need ${minCount} "${type}" template(s), found ${count}`)
  }
  if (eligibleGroupCount(validGroups, validAdjectives, 4, 0) === 0) {
    errors.push('groups need at least one group with 4 items for choice, guess, and ranking')
  }
  if (eligibleGroupCount(validGroups, validAdjectives, 1, 1) === 0) {
    errors.push('groups need at least one group with an item and a compatible adjective for slider')
  }
  if (eligibleGroupCount(validGroups, validAdjectives, 3, 3) === 0) {
    errors.push('groups need at least one group with 3 items and 3 compatible adjectives for matching')
  }
  if (validActivities.length === 0) errors.push('activities need at least one item for time')

  return errors
}

function checkSliderLabels(labels, path, errors) {
  if (!hasBilingualText(labels?.min)) errors.push(`${path}.sliderLabels.min must have non-empty zh and en strings`)
  if (!hasBilingualText(labels?.max)) errors.push(`${path}.sliderLabels.max must have non-empty zh and en strings`)
}
