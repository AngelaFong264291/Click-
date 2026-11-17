// 拉桿題：木間尺 + marker 筆蓋拉桿 + 熒光筆填色。真正可操作嘅 <input type="range"> 蓋喺度，淨係隱形。
export default function SliderControl({ min = 0, max = 10, value, onChange, lowLabel, highLabel, t }) {
  const range = max - min
  const percent = ((value - min) / range) * 100
  const ticks = Array.from({ length: range + 1 }, (_, i) => min + i)

  return (
    <div className="ds-reset">
      <div className="ds-slider">
        <div className="ds-slider__bar" />
        <div className="ds-slider__ticks">
          {ticks.map((tick) => {
            const isMajor = tick === min || tick === max || tick === min + Math.round(range / 2)
            const isActive = tick === value
            return (
              <div
                key={tick}
                className={`ds-slider__tick${isMajor ? ' ds-slider__tick--major' : ''}${isActive ? ' ds-slider__tick--active' : ''}`}
              >
                <div className="ds-slider__tick-mark" />
                <span className="ds-slider__tick-label">{tick}</span>
              </div>
            )
          })}
        </div>
        <div className="ds-slider__fill" style={{ width: `calc(22px + (100% - 44px) * ${percent / 100} - 22px)` }} />
        <div className="ds-slider__thumb" style={{ left: `calc(22px + (100% - 44px) * ${percent / 100} - 22px)` }}>
          <div className="ds-slider__thumb-cap" />
          <div className="ds-slider__thumb-nib" />
        </div>
        <input
          type="range"
          className="ds-slider__input"
          min={min}
          max={max}
          step={1}
          value={value}
          aria-label={t ? t('game.sliderLabel') : undefined}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      {(lowLabel || highLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body-sm)', color: 'var(--color-ink-muted)', marginTop: 'var(--space-2)' }}>
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  )
}
