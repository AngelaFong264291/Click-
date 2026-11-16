import { useState } from 'react'

export default function MatchingQuestion({ question, value, language, disabled, t, onChange, onSubmit }) {
  const [selectedItem, setSelectedItem] = useState(null)

  function chooseItem(itemId) {
    if (value[itemId]) {
      const next = { ...value }
      delete next[itemId]
      onChange(next)
      setSelectedItem(null)
      return
    }
    setSelectedItem(itemId)
  }

  function chooseAdjective(adjectiveId) {
    if (!selectedItem) {
      const pairedItem = Object.keys(value).find((itemId) => value[itemId] === adjectiveId)
      if (pairedItem) {
        const next = { ...value }
        delete next[pairedItem]
        onChange(next)
      }
      return
    }

    const next = { ...value }
    for (const [itemId, pairedAdjective] of Object.entries(next)) {
      if (itemId === selectedItem || pairedAdjective === adjectiveId) delete next[itemId]
    }
    next[selectedItem] = adjectiveId
    onChange(next)
    setSelectedItem(null)
  }

  return (
    <div className="stack">
      <div className="matching-columns">
        <div className="stack" role="group" aria-label={t('game.items')}>
          {question.options.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selectedItem === item.id}
              disabled={disabled}
              onClick={() => chooseItem(item.id)}
            >
              {item[language]}
              {value[item.id] && <span> → {question.adjectives.find((adj) => adj.id === value[item.id])?.[language]}</span>}
            </button>
          ))}
        </div>
        <div className="stack" role="group" aria-label={t('game.adjectives')}>
          {question.adjectives.map((adjective) => (
            <button
              key={adjective.id}
              type="button"
              aria-pressed={Object.values(value).includes(adjective.id)}
              disabled={disabled}
              onClick={() => chooseAdjective(adjective.id)}
            >
              {adjective[language]}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="primary" disabled={disabled} onClick={() => onSubmit(value)}>
        {t('game.confirm')}
      </button>
    </div>
  )
}