// 時間題：hours 係要揀嘅鐘頭，順住俾嘅次序顯示（唔一定係 0–23，可以跨午夜）。
// 24 粒（即係成個鐘）先用返設計稿嗰個雙圈鐘面；少過 24 粒就沿弧形排，次序照跟，唔跟真實鐘面角度。
const FULL_DAY = Array.from({ length: 24 }, (_, i) => i)
const isFullClock = (hours) => hours.length === 24 && hours.every((h, i) => h === i)

export default function HourPicker({ hours = FULL_DAY, selected, onSelect }) {
  return isFullClock(hours) ? (
    <ClockFace hours={hours} selected={selected} onSelect={onSelect} />
  ) : (
    <HourArc hours={hours} selected={selected} onSelect={onSelect} />
  )
}

function ClockFace({ hours, selected, onSelect }) {
  const CX = 50
  const CY = 50
  const R_INNER = 27
  const R_OUTER = 43
  const selectedAngle = angleFor(selected)
  const selectedRadius = selected < 12 ? R_INNER : R_OUTER
  const handX = CX + selectedRadius * Math.cos(selectedAngle) * 0.72
  const handY = CY + selectedRadius * Math.sin(selectedAngle) * 0.72

  return (
    <div className="ds-clock">
      <svg aria-hidden="true" className="ds-clock__face" viewBox="0 0 100 100">
        <circle cx={CX} cy={CY} r="49.5" fill="var(--color-whiteboard)" stroke="var(--color-ink)" strokeWidth="1" />
        <circle
          cx={CX}
          cy={CY}
          r={R_INNER + 7}
          fill="none"
          stroke="var(--color-whiteboard-frame)"
          strokeWidth="0.6"
          strokeDasharray="1.2 1.8"
        />
        {Number.isFinite(selected) && (
          <>
            <line x1={CX} y1={CY} x2={handX} y2={handY} stroke="var(--color-grading-red)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx={CX} cy={CY} r="2.7" fill="var(--color-ink)" />
          </>
        )}
      </svg>
      {hours.map((h) => {
        const angle = angleFor(h)
        const r = h < 12 ? R_INNER : R_OUTER
        const x = CX + r * Math.cos(angle)
        const y = CY + r * Math.sin(angle)
        return (
          <button
            key={h}
            type="button"
            aria-pressed={selected === h}
            aria-label={`${h}:00`}
            className={`ds-clock__btn${h >= 12 ? ' ds-clock__btn--outer' : ''}${selected === h ? ' ds-clock__btn--selected' : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onSelect?.(h)}
          >
            {h}
          </button>
        )
      })}
      {Number.isFinite(selected) && (
        <div className="ds-clock__readout">
          <div className="ds-clock__readout-value">{String(selected).padStart(2, '0')}:00</div>
        </div>
      )}
    </div>
  )
}

function angleFor(h) {
  const h12 = h % 12
  return ((-90 + (h12 / 12) * 360) * Math.PI) / 180
}

function HourArc({ hours, selected, onSelect }) {
  const n = hours.length
  const arcHeight = 46
  return (
    <div className="ds-hour-arc">
      {hours.map((h, index) => {
        const t = n === 1 ? 0 : (index / (n - 1)) * 2 - 1
        const xPercent = ((index + 0.5) / n) * 100
        const yOffset = (1 - t * t) * arcHeight
        return (
          <button
            key={h}
            type="button"
            aria-pressed={selected === h}
            aria-label={`${h}:00`}
            className={`ds-hour-arc__btn${selected === h ? ' ds-hour-arc__btn--selected' : ''}`}
            style={{ left: `${xPercent}%`, top: `${arcHeight - yOffset}px` }}
            onClick={() => onSelect?.(h)}
          >
            {h}
          </button>
        )
      })}
    </div>
  )
}
