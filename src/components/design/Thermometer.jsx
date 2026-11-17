// 默契溫度計：作答中嘅細條版，同埋揭曉用嘅暗色大盒版（連温度計圖同兩個數字牌）。
export function ThermometerBar({ value, count, t }) {
  return (
    <div className="ds-thermo-bar">
      <span className="ds-thermo-bar__tag">{t ? t('game.thermometerTag') : '溫度計'}</span>
      <span>
        {t ? t('game.thermometerLabel', { count }) : `已計分 ${count} 題的平均`}{' '}
        <b className="ds-thermo-bar__value">{value ?? '—'}</b>
      </span>
    </div>
  )
}

export function ThermometerBox({ value, count, t }) {
  const digits = String(value ?? 0).padStart(2, '0').split('')
  return (
    <div className="ds-thermo-box">
      <svg aria-hidden="true" width="22" height="64" viewBox="0 0 22 64">
        <rect x="7" y="3" width="8" height="44" rx="4" fill="none" stroke="#f3f1e8" strokeWidth="2" />
        <rect x="9" y="16" width="4" height="32" fill="var(--color-player-red)" />
        <circle cx="11" cy="53" r="8" fill="var(--color-player-red)" stroke="#f3f1e8" strokeWidth="2" />
      </svg>
      <div className="ds-thermo-box__label">
        <div className="ds-thermo-box__title">默契溫度計</div>
        <div className="ds-thermo-box__caption">{t ? t('game.thermometerLabel', { count }) : `已計分 ${count} 題的平均`}</div>
      </div>
      <div className="ds-thermo-box__digits">
        {digits.map((d, i) => (
          <div key={i} className="ds-thermo-box__digit">
            {d}
          </div>
        ))}
      </div>
    </div>
  )
}
