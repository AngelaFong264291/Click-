import Button from '../../components/design/Button.jsx'
import SliderControl from '../../components/design/SliderControl.jsx'

export default function SliderQuestion({ question, value, disabled, language, t, onChange, onSubmit }) {
  const selected = value ?? 5
  const labels = question.sliderLabels?.[language]

  // 撳落拉桿（就算冇真係拖動）都當「有互動」，timeout 先可以自動帶走呢個值。
  function markInteracted() {
    onChange(selected)
  }

  return (
    <div className="stack" onPointerDownCapture={markInteracted} onKeyDownCapture={markInteracted}>
      <div className="slider-readout">{t('game.sliderValue', { value: selected })}</div>
      <SliderControl value={selected} disabled={disabled} onChange={onChange} lowLabel={labels?.min?.[language]} highLabel={labels?.max?.[language]} t={t} />
      <Button variant="primary" disabled={disabled} onClick={() => onSubmit(selected)}>
        {t('game.confirm')}
      </Button>
      <span className="sr-only">{t('game.sliderRange')}</span>
    </div>
  )
}
