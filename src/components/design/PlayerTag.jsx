import ClownSticker from './ClownSticker.jsx'

/** 大堂用嘅名牌貼紙卡（HELLO 我係 ___）。 */
export function PlayerCard({ name, color, textColor, isHost, isYou, left, outlierBadge, rotate = 0, t }) {
  return (
    <div className="ds-player-card" style={{ transform: `rotate(${rotate}deg)` }}>
      <div className="ds-player-card__header" style={{ background: color, color: textColor }}>
        <div className="ds-player-card__header-top">HELLO</div>
        <div className="ds-player-card__header-sub">我係</div>
      </div>
      <div className="ds-player-card__name" style={{ opacity: left ? 0.5 : 1 }}>
        {name}
        {outlierBadge && <ClownSticker size={22} label={t ? t('game.soleOutlierBadge') : 'Repeat outlier'} />}
      </div>
      {isHost && <HostTag t={t} style={{ position: 'absolute', left: 6, top: 6 }} />}
      {isYou && <span className="ds-player-card__you">（{t ? t('room.you') : 'You'}）</span>}
    </div>
  )
}

/** 揭曉畫面用嘅細 pill 名牌。 */
export function PlayerPill({ name, color, textColor, left, outlierBadge, t }) {
  return (
    <span className="ds-player-tag" style={{ background: color, color: textColor }}>
      <span className={left ? 'ds-player-tag--left' : ''}>{name}</span>
      {outlierBadge && <ClownSticker size={18} label={t ? t('game.soleOutlierBadge') : 'Repeat outlier'} />}
    </span>
  )
}

export function HostTag({ t, style }) {
  return (
    <span className="ds-host-tag" style={style}>
      <svg aria-hidden="true" width="14" height="26" viewBox="0 0 18 34">
        <path d="M5 30 V7 a4 4 0 0 1 8 0 V27 a2.5 2.5 0 0 1 -5 0 V10" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="ds-host-tag__label">{t ? t('room.host') : 'Host'}</span>
    </span>
  )
}

/** 答咗題嘅填色圓形頭像 / 未答嘅虛線outline / 離開嘅淡化。 */
export function Avatar({ initial, color, state = 'answered' }) {
  if (state === 'waiting') {
    return (
      <span className="ds-avatar ds-avatar--waiting" style={{ borderColor: color, color }}>
        {initial}
      </span>
    )
  }
  return (
    <span className="ds-avatar ds-avatar--answered" style={{ background: color, opacity: state === 'left' ? 0.5 : 1 }}>
      {initial}
    </span>
  )
}
