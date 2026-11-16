export default function TimeQuestion({ value, disabled, t, onChange, onSubmit }) {
  return (
    <div className="stack">
      <div className="time-grid" role="group" aria-label={t('game.timeLabel')}>
        {Array.from({ length: 24 }, (_, hour) => (
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
      <span className="sr-only">{t('game.timeRange')}</span>
    </div>
  )
}