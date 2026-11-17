// 手繪小丑貼紙：代替 🤡 emoji（設計稿話 emoji icon 要改用手繪貼紙）。
export default function ClownSticker({ size = 26, label }) {
  return (
    <svg role="img" aria-label={label} width={size} height={size} viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="11" fill="var(--color-paper-white)" stroke="var(--color-ink)" strokeWidth="2" />
      <circle cx="13" cy="14" r="4" fill="var(--color-player-red)" />
      <path d="M7 9 h3 M16 9 h3" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 19 Q13 22 18 19" fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
