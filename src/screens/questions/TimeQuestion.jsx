export default function TimeQuestion({ question, value, disabled, t, onChange, onSubmit }) {
  const hours = question.hours
  return (
    <div className="stack">
      <div className="time-grid" role="group" aria-label={t('game.timeLabel')}>
        {hours.map((hour) => (
          <button
            key={hour}
            type="button"
            aria-pressed={value === hour}
            disabled={disabled}
            onClick={() => onChange(hour)}
          >
            {String(hour).padStart(2, '0')}
          </button>
        ))}
      </div>
      <button type="button" className="primary" disabled={disabled || value === undefined} onClick={() => onSubmit(value)}>
        {t('game.confirm')}
      </button>
      <span className="sr-only">
        {t('game.timeRange', { start: hours[0], end: hours[hours.length - 1] })}
      </span>
    </div>
  )
}
