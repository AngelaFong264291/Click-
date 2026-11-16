export default function RankingQuestion({ question, value, language, disabled, t, onChange, onSubmit }) {
  function toggleItem(itemId) {
    onChange(value.includes(itemId) ? value.filter((id) => id !== itemId) : [...value, itemId])
  }

  function moveItem(index, offset) {
    const nextIndex = index + offset
    if (nextIndex < 0 || nextIndex >= value.length) return
    const next = [...value]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    onChange(next)
  }

  const itemName = (id) => question.options.find((item) => item.id === id)?.[language] ?? id

  return (
    <div className="stack">
      <h3>{t('game.rankingSelect')}</h3>
      <div className="question-options">
        {question.options.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={value.includes(item.id)}
            disabled={disabled}
            onClick={() => toggleItem(item.id)}
          >
            {value.includes(item.id) ? `${value.indexOf(item.id) + 1}. ` : ''}{item[language]}
          </button>
        ))}
      </div>
      {value.length > 0 && (
        <ol className="ranking-list">
          {value.map((id, index) => (
            <li key={id}>
              <span>{itemName(id)}</span>
              <button type="button" aria-label={t('game.moveUp')} disabled={disabled || index === 0} onClick={() => moveItem(index, -1)}>
                {t('game.moveUp')}
              </button>
              <button type="button" aria-label={t('game.moveDown')} disabled={disabled || index === value.length - 1} onClick={() => moveItem(index, 1)}>
                {t('game.moveDown')}
              </button>
            </li>
          ))}
        </ol>
      )}
      <button type="button" className="primary" disabled={disabled || value.length !== question.options.length} onClick={() => onSubmit(value)}>
        {t('game.confirm')}
      </button>
    </div>
  )
}