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

    expect(validateContent(broken)).toContain('groups[0].items[1].id duplicates item "pineapple-bun"')
    expect(validateContent(broken)).toContain('groups[0].items[0] must have non-empty zh and en strings')
  })

  it('reports unfillable placeholders and invalid adjective group links', () => {
    const broken = structuredClone(content)
    broken.templates[0].text.en = 'Which {missing} would you choose?'
    broken.adjectives[0].groups.push('unknown-group')

    expect(validateContent(broken)).toContain(
      'templates[0].text must use the same placeholders in zh and en',
    )
    expect(validateContent(broken)).toContain(
      'templates[0].text placeholder {missing} cannot be filled for type "choice"',
    )
    expect(validateContent(broken)).toContain(
      'adjectives[0].groups references unknown group "unknown-group"',
    )
  })

  it('reports malformed structures and placeholder syntax without crashing', () => {
    const broken = structuredClone(content)
    delete broken.groups[0].items
    delete broken.adjectives[0].groups
    broken.templates[0].text.zh = '邊款{item最似你？'

    expect(validateContent(broken)).toContain('groups[0].items must be an array')
    expect(validateContent(broken)).toContain('adjectives[0].groups must contain at least one group id')
    expect(validateContent(broken)).toContain('templates[0].text.zh has malformed placeholder syntax')
  })
})