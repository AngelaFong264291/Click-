import Button from './Button.jsx'
import { PlayerCard } from './PlayerTag.jsx'

/** 心靈相通：揭曉畫面入面嘅細便利貼，唔使全屏。 */
export function MindMeldNote({ a, b, streak, rotate = 4, t }) {
  return (
    <div className="ds-sticky-note" style={{ transform: `rotate(${rotate}deg)` }}>
      <div className="ds-sticky-note__title">{t ? t('game.mindMeld', { a, b }) : `${a} 同 ${b} 心靈相通！`}</div>
      <div style={{ fontSize: 'var(--text-body)', marginTop: 'var(--space-1)' }}>
        {a} × {b}
        <br />
        連續 {streak} 題一樣
      </div>
    </div>
  )
}

/** 雙向奔赴：全屏黃色彩紙爆炸。 */
export function MutualPopup({ nameA, colorA, textColorA, nameB, colorB, textColorB, score, t, onContinue, reducedMotion }) {
  return (
    <div className="ds-popup ds-popup--mutual">
      {!reducedMotion && <Confetti />}
      <div style={{ position: 'relative' }}>
        <div className="ds-popup__eyebrow">你哋互相排咗對方第一</div>
        <div className="ds-popup__title--mutual">{t ? t('results.mutualFirst') : '雙向奔赴！'}</div>
        <div className="ds-popup__pair">
          <PlayerCard name={nameA} color={colorA} textColor={textColorA} rotate={-6} t={t} />
          <ArrowsIcon />
          <PlayerCard name={nameB} color={colorB} textColor={textColorB} rotate={5} t={t} />
        </div>
        <div className="ds-popup__score-card">
          <span className="ds-popup__score-value">{score}</span>
          <span style={{ fontSize: 'var(--text-body-lg)', lineHeight: 1.3 }}>
            分
            <br />
            對分平均
          </span>
        </div>
        <Button variant="secondary" style={{ width: '100%', marginTop: 'var(--space-6)' }} onClick={onContinue}>
          好嘢！繼續
        </Button>
      </div>
    </div>
  )
}

/** 單戀：全屏暗色落雨。 */
export function OneSidedPopup({ myName, theirName, theirColor, theirTextColor, t, onContinue, reducedMotion }) {
  return (
    <div className="ds-popup ds-popup--onesided">
      {!reducedMotion && <Rain />}
      <div style={{ position: 'relative' }}>
        <div className="ds-popup__eyebrow">你排佢第一……</div>
        <div className="ds-popup__title--onesided">{t ? t('results.oneSided') : '單戀'}</div>
        <div className="ds-popup__eyebrow">佢排你最尾</div>
        <div className="ds-popup__pair" style={{ marginTop: 'var(--space-6)' }}>
          <PlayerCard name={myName} color="var(--color-player-green)" textColor="var(--color-paper-white)" rotate={-4} t={t} />
          <ArrowsIcon dim />
          <PlayerCard name={theirName} color={theirColor} textColor={theirTextColor} rotate={6} t={t} />
        </div>
        <Button variant="secondary" style={{ width: '100%', marginTop: 'var(--space-6)' }} onClick={onContinue}>
          抹乾眼淚，繼續
        </Button>
      </div>
    </div>
  )
}

function ArrowsIcon({ dim }) {
  return (
    <svg aria-hidden="true" width="56" height="42" viewBox="0 0 66 50" style={{ flex: 'none' }}>
      <path
        d="M6 16 H58 M46 6 L58 16 L46 26"
        fill="none"
        stroke={dim ? 'var(--color-night-text)' : 'var(--color-ink)'}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M60 36 H8 M20 26 L8 36 L20 46"
        fill="none"
        stroke={dim ? 'var(--color-onesided-rain)' : 'var(--color-player-red)'}
        strokeWidth="4"
        strokeDasharray={dim ? '6 6' : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37 + 5) % 95}%`,
  top: `${(i * 53 + 8) % 90}%`,
  rotate: ((i * 29) % 120) - 60,
  color: ['var(--color-player-red)', 'var(--color-player-green)', 'var(--color-player-blue)', 'var(--color-player-pink)', 'var(--color-player-orange)'][i % 5],
}))

function Confetti() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: c.left,
            top: c.top,
            width: 10,
            height: 24,
            background: c.color,
            border: '2px solid var(--color-ink)',
            transform: `rotate(${c.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

const RAIN = Array.from({ length: 24 }, (_, i) => ({ left: `${(i * 41 + 3) % 97}%`, top: `${(i * 23 + 2) % 90}%` }))

function Rain() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {RAIN.map((r, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: r.left,
            top: r.top,
            width: 2,
            height: 20,
            background: 'var(--color-onesided-rain)',
            borderRadius: 2,
            transform: 'rotate(20deg)',
          }}
        />
      ))}
    </div>
  )
}
