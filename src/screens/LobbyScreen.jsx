import { useEffect, useRef, useState } from 'react'
import Button from '../components/design/Button.jsx'
import { PlayerCard } from '../components/design/PlayerTag.jsx'
import { RoomCodeCard } from '../components/design/RoomCodeBlock.jsx'
import { onlinePlayerUids } from '../game/flow.js'
import { MAX_PLAYERS, MIN_PLAYERS, canStart, sortedPlayers } from '../game/room.js'
import { startGame } from '../firebase/rooms.js'
import { useLanguage } from '../i18n/useLanguage.js'
import { errorMessage } from './errorMessage.js'
import { playerColorTextVar, playerColorVar } from './playerColor.js'

const CARD_ROTATIONS = [-2, 1.5, -1.5, 2.5, -1, 1]

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
  const [copied, setCopied] = useState(false)
  const copyResetRef = useRef(null)

  const onlineUids = onlinePlayerUids(room.players)

  async function handleStart() {
    setStarting(true)
    setError(null)
    try {
      await startGame(code, onlineUids)
    } catch (error) {
      console.error('[LobbyScreen] Start failed', {
        code: error?.code ?? error?.name,
        error,
      })
      setError('generic')
      setStarting(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      clearTimeout(copyResetRef.current)
      copyResetRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // 冇 clipboard 權限（例如非 https）：冇得自動複製，就唔做反應
    }
  }

  useEffect(() => () => clearTimeout(copyResetRef.current), [])

  return (
    <main className="screen">
      <RoomCodeCard code={code} link={link} copied={copied} onCopy={handleCopy} t={t} />

      <h2 className="lobby-player-count">{t('room.players', { count: players.length, max: MAX_PLAYERS })}</h2>
      <div className="lobby-player-grid">
        {players.map((p, index) => (
          <PlayerCard
            key={p.uid}
            name={p.name}
            color={playerColorVar(room.players, p.uid)}
            textColor={playerColorTextVar(room.players, p.uid)}
            isHost={p.uid === room.host}
            isYou={p.uid === uid}
            offline={!p.online}
            rotate={CARD_ROTATIONS[index % CARD_ROTATIONS.length]}
            t={t}
          />
        ))}
      </div>

      {isHost ? (
        <>
          <Button variant="primary" className="lobby-start" onClick={handleStart} disabled={!canStart(room, uid) || starting}>
            {t('room.start')}
          </Button>
          {onlineUids.length < MIN_PLAYERS && <p className="hint">{t('room.needMore', { min: MIN_PLAYERS })}</p>}
        </>
      ) : (
        <p className="hint">{t('room.waitingHost')}</p>
      )}

      {error && (
        <p className="error" role="alert">
          {errorMessage(t, error)}
        </p>
      )}

      <Button variant="secondary" onClick={onLeave}>
        {t('room.leave')}
      </Button>
    </main>
  )
}
