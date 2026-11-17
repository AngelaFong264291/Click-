// 按鈕：primary（黃、有邊、有陰影）、secondary（黑底）、outline（淨邊框，暗色畫面用）。
// pressed／disabled 係狀態，疊喺 variant 上面。
export default function Button({
  variant = 'primary',
  pressed = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const classes = [
    'ds-btn',
    `ds-btn--${variant}`,
    pressed && 'ds-btn--pressed',
    disabled && 'ds-btn--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type="button" className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
