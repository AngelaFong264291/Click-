import Button from './Button.jsx'

/** 大堂用嘅「點名紙」：房號 + 分享連結 + 複製掣。 */
export function RoomCodeCard({ code, link, round, copied, onCopy, t }) {
  return (
    <div className="ds-roomcode-card">
      <div className="ds-roomcode-card__heading">
        <span style={{ fontFamily: 'var(--font-black)', fontSize: 'var(--text-heading-sm)' }}>
          {t ? t('room.code') : '點名紙'}
        </span>
        {round !== undefined && (
          <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-ink-muted)' }}>第 {round} 局</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 'var(--space-3)' }}>
        <span className="ds-roomcode-card__value">{code}</span>
      </div>
      <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-ink-muted)', marginTop: 'var(--space-3)' }}>
        {t ? t('room.shareLink') : '分享連結'}
      </div>
      <div className="ds-roomcode-card__link-row">
        <div className="ds-roomcode-card__link">{link}</div>
        <Button variant="secondary" style={{ height: 46, padding: '0 14px', fontSize: 'var(--text-body-lg)' }} onClick={onCopy}>
          {copied ? (t ? t('room.copied') : '複製咗！') : t ? t('room.copy') : '複製 link'}
        </Button>
      </div>
    </div>
  )
}

/** 首頁入房用嘅 4 格房號輸入，每格歪少少。 */
export function CodeDigitInputs({ value = ['4', '8', '', ''], t }) {
  const radii = ['8px 3px 9px 4px / 4px 9px 3px 8px', '4px 9px 3px 8px / 8px 3px 9px 4px', '9px 4px 8px 3px / 3px 8px 4px 9px', '3px 8px 4px 9px / 9px 4px 8px 3px']
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      {value.map((digit, i) => (
        <input
          key={i}
          className="ds-code-input"
          style={{ borderRadius: radii[i] }}
          maxLength={1}
          defaultValue={digit}
          aria-label={t ? t('home.codeLabel') + ' ' + (i + 1) : `房號第 ${i + 1} 位`}
        />
      ))}
    </div>
  )
}
