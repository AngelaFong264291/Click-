// 排序題：疊紙條 + 編號圓章。設計稿畫咗拖拉手指，但實際遊戲係撳個次序再用上/下掣調整
// （同 src/screens/questions/RankingQuestion.jsx 一致），所以呢度用上/下掣，唔用拖拉手指。
export default function RankingList({ items, activeIndex, onMoveUp, onMoveDown, t }) {
  return (
    <div className="ds-ranking">
      {items.map((label, index) => (
        <div key={label} className="ds-ranking__row">
          <span className="ds-ranking__badge">{index + 1}</span>
          <div className={`ds-ranking__strip${index === activeIndex ? ' ds-ranking__strip--active' : ''}`}>
            <span className="ds-ranking__label">{label}</span>
            <button
              type="button"
              className="ds-ranking__move"
              disabled={index === 0}
              aria-label={t ? t('game.moveUp') : 'Move up'}
              onClick={() => onMoveUp?.(index)}
            >
              <ArrowIcon direction="up" />
            </button>
            <button
              type="button"
              className="ds-ranking__move"
              disabled={index === items.length - 1}
              aria-label={t ? t('game.moveDown') : 'Move down'}
              onClick={() => onMoveDown?.(index)}
            >
              <ArrowIcon direction="down" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ArrowIcon({ direction }) {
  const d = direction === 'up' ? 'M12 5 L12 19 M6 11 L12 5 L18 11' : 'M12 19 L12 5 M6 13 L12 19 L18 13'
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
      <path d={d} fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
