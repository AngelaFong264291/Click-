import AnswerOption from '../../components/design/AnswerOption.jsx'
import Button from '../../components/design/Button.jsx'
import RankingList from '../../components/design/RankingList.jsx'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

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
      <p className="hint">{t('game.rankingSelect')}</p>
      <div className="stack">
        {question.options.map((item, index) => {
          const pickOrder = value.indexOf(item.id)
          return (
            <AnswerOption
              key={item.id}
              letter={pickOrder >= 0 ? String(pickOrder + 1) : LETTERS[index]}
              label={item[language]}
              state={pickOrder >= 0 ? 'selected' : 'default'}
              disabled={disabled}
              onClick={() => toggleItem(item.id)}
            />
          )
        })}
      </div>
      {value.length > 0 && (
        <RankingList
          items={value.map(itemName)}
          disabled={disabled}
          onMoveUp={(index) => moveItem(index, -1)}
          onMoveDown={(index) => moveItem(index, 1)}
          t={t}
        />
      )}
      <Button variant="primary" disabled={disabled || value.length !== question.options.length} onClick={() => onSubmit(value)}>
        {t('game.confirm')}
      </Button>
    </div>
  )
}
