import Button from '../../components/design/Button.jsx'
import HourPicker from '../../components/design/HourPicker.jsx'

export default function TimeQuestion({ question, value, disabled, t, onChange, onSubmit }) {
  const hours = question.hours
  return (
    <div className="stack">
      <div role="group" aria-label={t('game.timeLabel')}>
        <HourPicker hours={hours} selected={value} disabled={disabled} onSelect={onChange} />
      </div>
      <Button variant="primary" disabled={disabled || value === undefined} onClick={() => onSubmit(value)}>
        {t('game.confirm')}
      </Button>
      <span className="sr-only">
        {t('game.timeRange', { start: hours[0], end: hours[hours.length - 1] })}
      </span>
    </div>
  )
}
