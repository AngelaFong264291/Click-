import { useEffect, useRef, useState } from 'react'
import { MAX_PLAYERS, MIN_PLAYERS, canStart, sortedPlayers } from '../game/room.js'
import { startGame } from '../firebase/rooms.js'
import { useLanguage } from '../i18n/useLanguage.js'
import { errorMessage } from './errorMessage.js'

function shareLinkFor(code) {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/room/${code}`
}

export default function LobbyScreen({ code, room, uid, onLeave }) {
  const { t } = useLanguage()
  const players = sortedPlayers(room.players)
  const isHost = room.host === uid
  const link = shareLinkFor(code)
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(false)

  async function handleStart() {
    setStarting(true)
    setError(null)
    try {
      await startGame(code)
    } catch {
      setError('generic')
      setStarting(false)
    }
  }

  return (
    <main className="screen">
      <p className="room-code">
        {t('room.code')} <strong>{code}</strong>
      </p>

      <ShareLink link={link} />

      <h2>{t('room.players', { count: players.length, max: MAX_PLAYERS })}</h2>
      <ul className="player-list">
        {players.map((p) => (
          <li key={p.uid} className={p.online ? undefined : 'offline'}>
            <span>{p.name}</span>
            {p.uid === room.host && <span className="tag">{t('room.host')}</span>}
            {p.uid === uid && <span className="tag">{t('room.you')}</span>}
            {!p.online && <span className="tag muted">{t('room.offline')}</span>}
          </li>
        ))}
      </ul>

      {isHost ? (
        <>
          <button
            type="button"
            className="primary"
            onClick={handleStart}
            disabled={!canStart(room, uid) || starting}
          >
            {t('room.start')}
          </button>
          {players.length < MIN_PLAYERS && <p className="hint">{t('room.needMore', { min: MIN_PLAYERS })}</p>}
        </>
      ) : (
        <p className="hint">{t('room.waitingHost')}</p>
      )}

      {error && (
        <p className="error" role="alert">
          {errorMessage(t, error)}
        </p>
      )}

      <button type="button" onClick={onLeave}>
        {t('room.leave')}
      </button>
    </main>
  )
}

function ShareLink({ link }) {
  const { t } = useLanguage()
  const inputRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      // 冇 clipboard 權限（例如非 https）：揀晒段字俾玩家自己複製
      inputRef.current?.select()
    }
  }

  return (
    <div className="share-row">
      <label className="field">
        <span>{t('room.shareLink')}</span>
        <input ref={inputRef} type="text" value={link} readOnly onFocus={(e) => e.target.select()} />
      </label>
      <button type="button" onClick={handleCopy}>
        {copied ? t('room.copied') : t('room.copy')}
      </button>
    </div>
  )
}
