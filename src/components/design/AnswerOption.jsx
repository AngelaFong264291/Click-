// 選項題／猜朋友題嘅答案卡紙條。state：default / selected / consensus / notChosen / disabled / timedOut。
const CHECK = (
  <svg aria-hidden="true" width="28" height="24" viewBox="0 0 34 30">
    <path
      d="M3 16 L12 26 L31 3"
      fill="none"
      stroke="var(--color-player-red)"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function AnswerOption({ letter, label, state = 'default', disabled, onClick }) {
  const classes = [
    'ds-option',
    state === 'selected' && 'ds-option--selected',
    state === 'consensus' && 'ds-option--consensus',
    state === 'notChosen' && 'ds-option--not-chosen',
    state === 'timedOut' && 'ds-option--timedout',
  ]
    .filter(Boolean)
    .join(' ')
  const badgeFilled = state === 'selected' || state === 'consensus'
  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || state === 'disabled'}
      aria-pressed={badgeFilled}
      onClick={onClick}
    >
      <span className={`ds-option__badge ${badgeFilled ? 'ds-option__badge--filled' : 'ds-option__badge--outline'}`}>
        {letter}
      </span>
      <span className="ds-option__label">{label}</span>
      {badgeFilled && <span className="ds-option__check">{CHECK}</span>}
    </button>
  )
}
