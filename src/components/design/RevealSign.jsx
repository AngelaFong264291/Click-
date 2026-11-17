// 揭曉答案嘅木牌：答案卡 + 底下嘅玩家名牌（跟玩家組色）。未輪到揭曉就淨係得虛線卡。
import ClownSticker from './ClownSticker.jsx'

export default function RevealSign({ name, color, textColor, answer, revealed, outlierBadge, t }) {
  return (
    <div className="ds-sign">
      <div className="ds-sign__pole" />
      <div className={`ds-sign__card${revealed ? '' : ' ds-sign__card--pending'}`}>
        {revealed ? answer : ''}
      </div>
      <div className="ds-sign__name" style={{ background: color, color: textColor }}>
        <span className="ds-sign__name-text">{name}</span>
        {outlierBadge && <ClownSticker size={16} label={t ? t('game.soleOutlierBadge') : 'Repeat outlier'} />}
      </div>
    </div>
  )
}
