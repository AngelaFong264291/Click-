const TEMPLATE_FIELDS = {
  choice: ['item'],
  slider: ['adj', 'item'],
  time: ['item'],
  matching: ['item'],
  ranking: ['adj', 'item'],
  guess: ['item', 'name'],
}

const REQUIRED_TEMPLATE_COUNTS = {
  choice: 5,
  slider: 1,
  time: 1,
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

function placeholderNames(text) {
  return [...text.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1])
}

function hasMalformedPlaceholder(text) {
  return /[{}]/.test(text.replace(/\{[^{}]*\}/g, ''))
}

function compatibleGroupCount(groups, adjectives, minItems, minAdjectives) {
  return groups.filter((group) => {
    const itemCount = Array.isArray(group?.items) ? group.items.length : 0
    const compatibleCount = adjectives.filter(
      (adjective) => Array.isArray(adjective?.groups) && adjective.groups.includes(group?.id),
    ).length
    return itemCount >= minItems && compatibleCount >= minAdjectives
  }).length
}

/** Returns actionable errors for the local sample/content files. */
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
  const itemIds = new Set()
  for (const [groupIndex, group] of validGroups.entries()) {
    const groupPath = `groups[${groupIndex}]`
    if (!hasBilingualText(group?.name)) errors.push(`${groupPath}.name must have non-empty zh and en strings`)
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
    }
  }

  for (const [index, adjective] of validAdjectives.entries()) {
    if (!hasBilingualText(adjective)) errors.push(`adjectives[${index}] must have non-empty zh and en strings`)
    if (!Array.isArray(adjective?.groups) || adjective.groups.length === 0) {
      errors.push(`adjectives[${index}].groups must contain at least one group id`)
      continue
    }
    for (const groupId of adjective.groups) {
      if (!groupIds.has(groupId)) errors.push(`adjectives[${index}].groups references unknown group "${groupId}"`)
    }
  }

  for (const [index, activity] of validActivities.entries()) {
    if (!hasBilingualText(activity)) errors.push(`activities[${index}] must have non-empty zh and en strings`)
  }

  const templatesByType = new Map()
  for (const [index, template] of validTemplates.entries()) {
    const templatePath = `templates[${index}]`
    if (!hasBilingualText(template?.text)) errors.push(`${templatePath}.text must have non-empty zh and en strings`)
    const expectedFields = TEMPLATE_FIELDS[template?.type]
    if (!expectedFields) {
      errors.push(`${templatePath}.type is not a supported question type`)
      continue
    }
    templatesByType.set(template.type, (templatesByType.get(template.type) ?? 0) + 1)
    if (!hasBilingualText(template.text)) continue

    for (const language of ['zh', 'en']) {
      if (hasMalformedPlaceholder(template.text[language])) {
        errors.push(`${templatePath}.text.${language} has malformed placeholder syntax`)
      }
    }
    const zhFields = placeholderNames(template.text.zh)
    const enFields = placeholderNames(template.text.en)
    const uniqueZhFields = [...new Set(zhFields)].sort()
    const uniqueEnFields = [...new Set(enFields)].sort()
    if (JSON.stringify(uniqueZhFields) !== JSON.stringify(uniqueEnFields)) {
      errors.push(`${templatePath}.text must use the same placeholders in zh and en`)
    }
    for (const field of new Set([...uniqueZhFields, ...uniqueEnFields])) {
      if (!expectedFields.includes(field)) {
        errors.push(`${templatePath}.text placeholder {${field}} cannot be filled for type "${template.type}"`)
      }
    }
    for (const field of expectedFields) {
      if (!uniqueZhFields.includes(field)) {
        errors.push(`${templatePath}.text is missing required placeholder {${field}}`)
      }
    }
  }

  for (const [type, minCount] of Object.entries(REQUIRED_TEMPLATE_COUNTS)) {
    const count = templatesByType.get(type) ?? 0
    if (count < minCount) errors.push(`templates need ${minCount} "${type}" template(s), found ${count}`)
  }
  if (compatibleGroupCount(validGroups, validAdjectives, 4, 1) === 0) {
    errors.push('groups need at least one group with 4 items and a compatible adjective for choice, guess, and ranking')
  }
  if (compatibleGroupCount(validGroups, validAdjectives, 1, 1) === 0) {
    errors.push('groups need at least one group with an item and a compatible adjective for slider')
  }
  if (compatibleGroupCount(validGroups, validAdjectives, 3, 3) === 0) {
    errors.push('groups need at least one group with 3 items and 3 compatible adjectives for matching')
  }
  if (validActivities.length === 0) errors.push('activities need at least one item for time')

  return errors
}