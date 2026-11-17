// 分享圖 / 大堂用嘅大頭貼小卡。
export default function PlayerPolaroid({ initial, name, color, textColor, rotate = 0 }) {
  return (
    <div className="ds-polaroid" style={{ transform: `rotate(${rotate}deg)` }}>
      <div className="ds-polaroid__photo" style={{ background: color, color: textColor }}>
        {initial}
      </div>
      <div className="ds-polaroid__name">{name}</div>
    </div>
  )
}
