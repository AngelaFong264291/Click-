// 結果頁嘅獎狀：紅色雙邊框 + 分數 + 稱號（熒光筆底）+ 營委會印章。
export default function AwardCertificate({ names, score, scoreRange, titleText, roomCode, date, t }) {
  const tt = (key, vars) => (t ? t(key, vars) : key)
  return (
    <div className="ds-certificate">
      <div className="ds-certificate__inner">
        <div className="ds-certificate__title">{tt('design.certificate.title')}</div>
        <div className="ds-certificate__names">
          {tt('design.certificate.names', { names: names.join('、') })}
          <br />
          {tt('design.certificate.subtitle')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <span className="ds-certificate__score">{score}</span>
          <span style={{ fontSize: 'var(--text-label)', textAlign: 'left', lineHeight: 1.2 }}>
            {tt('design.certificate.pointsLabel')}
            <br />
            {scoreRange && <span style={{ color: 'var(--color-ink-muted)', fontSize: 'var(--text-caption)' }}>{scoreRange}</span>}
          </span>
        </div>
        <div style={{ fontSize: 'var(--text-body)', marginTop: 'var(--space-1)' }}>{tt('design.certificate.awardedTitle')}</div>
        <div className="ds-certificate__group-title">{titleText}</div>
        <div className="ds-certificate__seal">
          <span style={{ fontFamily: 'var(--font-black)', fontSize: 'var(--text-body)' }}>{tt('design.certificate.seal')}</span>
          <span>{tt('design.certificate.sealSub')}</span>
        </div>
        <div style={{ position: 'absolute', left: 12, bottom: 12, fontSize: 'var(--text-caption)', color: 'var(--color-ink-muted)' }}>
          {date} · {tt('room.code')} {roomCode}
        </div>
      </div>
    </div>
  )
}
