import { describe, expect, it } from 'vitest'
import adjectives from './adjectives.json'
import activities from './activities.json'
import groups from './groups.json'
import templates from './templates.json'
import { validateContent } from './validate.js'

const content = { groups, adjectives, activities, templates }

describe('sample question content', () => {
  it('has unique ids, bilingual fields, fillable templates, and valid adjective group links', () => {
    expect(validateContent(content)).toEqual([])
  })

  it('reports the exact path for duplicate ids and missing translations', () => {
    const broken = structuredClone(content)
    broken.groups[0].items[1].id = broken.groups[0].items[0].id
    delete broken.groups[0].items[0].en

    expect(validateContent(broken)).toContain('groups[0].items[1].id duplicates item "pineapple-bun-butter"')
    expect(validateContent(broken)).toContain('groups[0].items[0] must have non-empty zh and en strings')
  })

  it('reports unfillable placeholders and invalid adjective/template references', () => {
    const broken = structuredClone(content)
    broken.templates[0].text.en = 'Which {missing} would you choose?'
    broken.adjectives[0].groups = ['unknown-group']
    broken.templates[6].suited = ['unknown-category']

    expect(validateContent(broken)).toContain(
      'templates[0].text must use the same placeholders in zh and en',
    )
    expect(validateContent(broken)).toContain(
      'templates[0].text placeholder {missing} cannot be filled for type "choice"',
    )
    expect(validateContent(broken)).toContain(
      'adjectives[0].groups references unknown group id "unknown-group"',
    )
    expect(validateContent(broken)).toContain(
      'templates[6].suited references unknown category "unknown-category"',
    )
  })

  it('reports malformed structures and placeholder syntax without crashing', () => {
    const broken = structuredClone(content)
    delete broken.groups[0].items
    delete broken.adjectives[0].groups
    broken.templates[0].text.zh = '邊款{item最似你？'

    expect(validateContent(broken)).toContain('groups[0].items must be an array')
    expect(validateContent(broken)).toContain(
      'adjectives[0].groups must be "all" or a non-empty array of group id',
    )
    expect(validateContent(broken)).toContain('templates[0].text.zh has malformed placeholder syntax')
  })

  it('reports an unknown item/adjective/template/activity tag', () => {
    const broken = structuredClone(content)
    broken.groups[0].items[0].tags = ['not-a-real-tag']

    expect(validateContent(broken)).toContain('groups[0].items[0].tags has unknown tag "not-a-real-tag"')
  })

  it('reports an invalid theme category, missing direction, and bad hour range', () => {
    const broken = structuredClone(content)
    broken.groups[0].category = 'not-a-category'
    delete broken.groups[0].direction
    broken.activities[0].hourRange = { start: 25, end: 2 }

    expect(validateContent(broken)).toContain('groups[0].category must be one of food, object, animal, place, activity, habit')
    expect(validateContent(broken)).toContain('groups[0].direction must be a non-empty string')
    expect(validateContent(broken)).toContain('activities[0].hourRange.start and .end must be integers from 0 to 23')
  })

  it('requires a standalone slider to have labels and no placeholders', () => {
    const broken = structuredClone(content)
    const standalone = broken.templates.find((template) => template.type === 'slider' && template.standalone)
    standalone.text.zh = '{item}有幾正？'
    standalone.text.en = '{item} is how nice?'
    delete standalone.sliderLabels

    const errors = validateContent(broken)
    expect(errors.some((e) => e.includes('must have no placeholders (standalone slider)'))).toBe(true)
    expect(errors.some((e) => e.includes('sliderLabels is required for a slider question'))).toBe(true)
  })
})