// 配對題：左邊物件、右邊形容詞，中間用 marker 連線。connections 入面 auto:true 嘅線畫虛線
// （第三條線自動連埋嗰種），其餘實色，顏色跟 lineColors 輪流。
const LINE_COLORS = ['var(--color-player-blue)', 'var(--color-player-red)', 'var(--color-ink-muted)']

export default function MatchingLines({ items, adjectives, connections, selectedItemIndex, disabled, itemsLabel, adjectivesLabel, onPick }) {
  const rowY = (index, count) => ((index + 0.5) / count) * 100

  return (
    <div style={{ position: 'relative' }}>
      <div className="ds-matching">
        <div className="ds-matching__column" role="group" aria-label={itemsLabel}>
          {items.map((item, index) => {
            const connected = connections.some((c) => c.itemIndex === index)
            return (
              <button
                key={item}
                type="button"
                disabled={disabled}
                aria-pressed={index === selectedItemIndex || connected}
                className={`ds-matching__item${index === selectedItemIndex ? ' ds-matching__item--selected' : ''}`}
                onClick={() => onPick?.('item', index)}
              >
                {item}
              </button>
            )
          })}
        </div>
        <div className="ds-matching__column" role="group" aria-label={adjectivesLabel}>
          {adjectives.map((adjective, index) => {
            const connection = connections.find((c) => c.adjectiveIndex === index)
            return (
              <button
                key={adjective}
                type="button"
                disabled={disabled}
                aria-pressed={Boolean(connection)}
                className={`ds-matching__item ds-matching__item--adjective${connection?.auto ? ' ds-matching__item--auto' : ''}`}
                onClick={() => onPick?.('adjective', index)}
              >
                {adjective}
              </button>
            )
          })}
        </div>
      </div>
      <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {connections.map((c, i) => {
          const y1 = rowY(c.itemIndex, items.length)
          const y2 = rowY(c.adjectiveIndex, adjectives.length)
          return (
            <path
              key={i}
              d={`M 32 ${y1} C 50 ${y1} 50 ${y2} 68 ${y2}`}
              fill="none"
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={c.auto ? 1 : 1.6}
              strokeDasharray={c.auto ? '2 2' : undefined}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
    </div>
  )
}
