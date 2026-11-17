// 白板題卡：灰框 + 黑 outline 扮白板，左上角浮動題型標籤，藍字題目。
export default function WhiteboardCard({ tagLabel, tagColor, theme, question, children }) {
  return (
    <div className="ds-whiteboard">
      {tagLabel && (
        <span className="ds-whiteboard__tag" style={{ background: tagColor }}>
          {tagLabel}
        </span>
      )}
      {theme && <div className="ds-whiteboard__theme">{theme}</div>}
      <div className="ds-whiteboard__question">{question}</div>
      {children}
    </div>
  )
}
