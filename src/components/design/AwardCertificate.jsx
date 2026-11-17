// 結果頁嘅獎狀：紅色雙邊框 + 分數 + 稱號（熒光筆底）+ 營委會印章。
export default function AwardCertificate({ names, score, scoreRange, titleText, roomCode, date }) {
  return (
    <div className="ds-certificate">
      <div className="ds-certificate__inner">
        <div className="ds-certificate__title">獎　狀</div>
        <div className="ds-certificate__names">
          茲證明 {names.join('、')}
          <br />
          十條題答完，全組默契分
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <span className="ds-certificate__score">{score}</span>
          <span style={{ fontSize: 'var(--text-label)', textAlign: 'left', lineHeight: 1.2 }}>
            分
            <br />
            <span style={{ color: 'var(--color-ink-muted)', fontSize: 'var(--text-caption)' }}>{scoreRange}</span>
          </span>
        </div>
        <div style={{ fontSize: 'var(--text-body)', marginTop: 'var(--space-1)' }}>特頒此稱號：</div>
        <div className="ds-certificate__group-title">{titleText}</div>
        <div className="ds-certificate__seal">
          <span style={{ fontFamily: 'var(--font-black)', fontSize: 'var(--text-body)' }}>夾唔夾</span>
          <span>營委會</span>
        </div>
        <div style={{ position: 'absolute', left: 12, bottom: 12, fontSize: 'var(--text-caption)', color: 'var(--color-ink-muted)' }}>
          {date} · 房 {roomCode}
        </div>
      </div>
    </div>
  )
}
