import { useState } from 'react'
import Button from '../../components/design/Button.jsx'
import MatchingLines from '../../components/design/MatchingLines.jsx'

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

  const itemIds = question.options.map((item) => item.id)
  const adjectiveIds = question.adjectives.map((adjective) => adjective.id)
  const connections = Object.entries(value).map(([itemId, adjectiveId]) => ({
    itemIndex: itemIds.indexOf(itemId),
    adjectiveIndex: adjectiveIds.indexOf(adjectiveId),
  }))
  const selectedItemIndex = selectedItem ? itemIds.indexOf(selectedItem) : undefined

  function handlePick(kind, index) {
    if (kind === 'item') chooseItem(itemIds[index])
    else chooseAdjective(adjectiveIds[index])
  }

  return (
    <div className="stack">
      <MatchingLines
        items={question.options.map((item) => item[language])}
        adjectives={question.adjectives.map((adjective) => adjective[language])}
        connections={connections}
        selectedItemIndex={selectedItemIndex}
        disabled={disabled}
        itemsLabel={t('game.items')}
        adjectivesLabel={t('game.adjectives')}
        onPick={handlePick}
      />
      <Button variant="primary" disabled={disabled || Object.keys(value).length === 0} onClick={() => onSubmit(value)}>
        {t('game.confirm')}
      </Button>
    </div>
  )
}
