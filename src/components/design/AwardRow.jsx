// 結果頁嘅獎項列：彩色標籤 + 得獎者 + 數字／文字 caption。
export default function AwardRow({ label, labelColor, winner, stat, statIsCaption, rotate = 0 }) {
  return (
    <div className="ds-award-row" style={{ transform: `rotate(${rotate}deg)` }}>
      <span className="ds-award-row__label" style={{ background: labelColor }}>
        {label}
      </span>
      <span className="ds-award-row__winner">{winner}</span>
      <span className={statIsCaption ? 'ds-award-row__stat--caption' : 'ds-award-row__stat'}>{stat}</span>
    </div>
  )
}
