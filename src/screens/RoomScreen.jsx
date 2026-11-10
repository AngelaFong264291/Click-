import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import NameField from '../components/NameField.jsx'
import { isMember, isValidRoomCode, joinError, nameError, normalizeName } from '../game/room.js'
import { RoomError, joinRoom, leaveRoom } from '../firebase/rooms.js'
import { useAuth } from '../firebase/useAuth.js'
import { useRoom } from '../firebase/useRoom.js'
import { useLanguage } from '../i18n/useLanguage.js'
import { errorMessage } from './errorMessage.js'
import LobbyScreen from './LobbyScreen.jsx'
import PlayingPlaceholder from './PlayingPlaceholder.jsx'
import { loadSavedName, saveName } from './savedName.js'

export default function RoomScreen() {
  const { code } = useParams()
  if (!isValidRoomCode(code)) return <RoomErrorScreen code="notFound" />
  return <Room key={code} code={code} />
}

function Room({ code }) {
  const { t } = useLanguage()
  const { uid } = useAuth()
  const navigate = useNavigate()
  const { room, receivedAt, loading, error } = useRoom(code, uid)
  const [leaving, setLeaving] = useState(false)

  if (loading || leaving) return <p className="screen">{t('common.loading')}</p>
  if (error) return <RoomErrorScreen code="generic" />

  if (!isMember(room, uid)) {
    const err = joinError(room, uid, receivedAt)
    if (err) return <RoomErrorScreen code={err} />
    return <JoinForm code={code} uid={uid} />
  }

  async function handleLeave() {
    setLeaving(true)
    try {
      await leaveRoom(code, uid, room)
    } finally {
      navigate('/')
    }
  }

  if (room.status === 'playing') return <PlayingPlaceholder />
  return <LobbyScreen code={code} room={room} uid={uid} onLeave={handleLeave} />
}

/** 經分享連結入嚟、未喺房入面：先問名。 */
function JoinForm({ code, uid }) {
  const { t } = useLanguage()
  const [name, setName] = useState(loadSavedName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const err = nameError(name)
    if (err) {
      setError(err)
      return
    }
    const cleanName = normalizeName(name)
    setBusy(true)
    setError(null)
    try {
      await joinRoom(code, uid, cleanName)
      saveName(cleanName)
      // 成功之後 useRoom 會見到自己喺房入面，自動轉去大堂
    } catch (e) {
      setError(e instanceof RoomError ? e.code : 'generic')
      setBusy(false)
    }
  }

  return (
    <main className="screen">
      <h1>{t('room.joinTitle', { code })}</h1>
      <form className="stack" onSubmit={handleSubmit}>
        <NameField value={name} onChange={setName} autoFocus />
        <button type="submit" className="primary" disabled={busy}>
          {busy ? t('home.joining') : t('home.join')}
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {errorMessage(t, error)}
        </p>
      )}
    </main>
  )
}

function RoomErrorScreen({ code }) {
  const { t } = useLanguage()
  return (
    <main className="screen">
      <p className="error" role="alert">
        {errorMessage(t, code)}
      </p>
      <Link to="/">{t('common.backHome')}</Link>
    </main>
  )
}
