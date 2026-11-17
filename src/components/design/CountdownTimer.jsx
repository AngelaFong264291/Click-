// 倒數：圓形 SVG 進度環 + marker 數字 + 哨子小圖。
export default function CountdownTimer({ seconds, total, label }) {
  const circumference = 157 // 2π·25，同設計稿一致
  const progress = total > 0 ? Math.max(0, Math.min(1, seconds / total)) : 0
  const dash = `${Math.round(circumference * progress)} ${circumference}`
  return (
    <div className="ds-countdown" aria-label={label}>
      <svg aria-hidden="true" width="40" height="30" viewBox="0 0 44 34">
        <path
          d="M4 12 H24 A12 12 0 1 1 12 24 V20 H4 Z"
          fill="var(--color-player-red)"
          stroke="var(--color-ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="25" cy="22" r="4" fill="var(--color-paper-white)" stroke="var(--color-ink)" strokeWidth="2" />
        <path d="M30 6 L34 2 M36 10 L42 8 M33 14 L40 15" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="ds-countdown__ring">
        <svg aria-hidden="true" width="58" height="58" viewBox="0 0 58 58" style={{ position: 'absolute', left: 0, top: 0 }}>
          <circle cx="29" cy="29" r="25" fill="var(--color-paper-white)" stroke="#d9cfba" strokeWidth="5" />
          <circle
            cx="29"
            cy="29"
            r="25"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="5"
            strokeDasharray={dash}
            transform="rotate(-90 29 29)"
            strokeLinecap="round"
          />
        </svg>
        <div className="ds-countdown__value">{seconds}</div>
      </div>
    </div>
  )
}
