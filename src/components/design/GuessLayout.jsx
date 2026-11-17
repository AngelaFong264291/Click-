// 猜朋友題：通緝令（估緊邊個）+ 2x2 答案格。
export default function GuessLayout({ targetName, targetInitial, targetColor, options, selectedIndex, hintLabel, onSelect }) {
  return (
    <div className="ds-guess">
      <div className="ds-guess__poster">
        <div className="ds-guess__pin" />
        <div style={{ fontFamily: 'var(--font-black)', fontSize: 'var(--text-label)', letterSpacing: '6px', marginTop: 'var(--space-2)' }}>通緝</div>
        <div className="ds-guess__mugshot" style={{ background: targetColor, color: 'var(--color-paper-white)' }}>
          {targetInitial}
        </div>
        <div style={{ fontSize: 'var(--text-label)', fontWeight: 700, marginTop: 'var(--space-1)' }}>{targetName}</div>
      </div>
      <div className="ds-guess__options">
        {options.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`ds-guess__option${index === selectedIndex ? ' ds-guess__option--selected' : ''}`}
            aria-pressed={index === selectedIndex}
            onClick={() => onSelect?.(index)}
          >
            {label}
            {index === selectedIndex && hintLabel && <span className="ds-guess__option-hint">{hintLabel}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
