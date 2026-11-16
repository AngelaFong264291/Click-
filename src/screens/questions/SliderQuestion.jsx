export default function SliderQuestion({ value, disabled, t, onChange, onSubmit }) {
  const selected = value ?? 5

  return (
    <div className="stack">
      <label className="field">
        <span>{t('game.sliderLabel')}</span>
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={selected}
          disabled={disabled}
          onPointerDown={() => onChange(selected)}
          onKeyDown={() => onChange(selected)}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
      <output>{t('game.sliderValue', { value: selected })}</output>
      <button type="button" className="primary" disabled={disabled} onClick={() => onSubmit(selected)}>
        {t('game.confirm')}
      </button>
      <span className="sr-only">{t('game.sliderRange')}</span>
    </div>
  )
}