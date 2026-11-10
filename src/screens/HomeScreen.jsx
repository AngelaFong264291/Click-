import { useState } from 'react'
import { useNavigate } from 'react-router'
import NameField from '../components/NameField.jsx'
import { ROOM_CODE_LENGTH, isValidRoomCode, nameError, normalizeName } from '../game/room.js'
import { RoomError, createRoom, joinRoom } from '../firebase/rooms.js'
import { useAuth } from '../firebase/useAuth.js'
import { useLanguage } from '../i18n/useLanguage.js'
import { errorMessage } from './errorMessage.js'
import { loadSavedName, saveName } from './savedName.js'

export default function HomeScreen() {
  const { t } = useLanguage()
  const { uid } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(loadSavedName)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(null) // 'create' | 'join' | null
  const [error, setError] = useState(null)

  function checkName() {
    const err = nameError(name)
    if (err) setError(err)
    return err ? null : normalizeName(name)
  }

  async function run(kind, action) {
    setBusy(kind)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(e instanceof RoomError ? e.code : 'generic')
      setBusy(null)
    }
  }

  function handleCreate() {
    const cleanName = checkName()
    if (!cleanName) return
    run('create', async () => {
      const roomCode = await createRoom(uid, cleanName)
      saveName(cleanName)
      navigate(`/room/${roomCode}`)
    })
  }

  function handleJoin(e) {
    e.preventDefault()
    const cleanName = checkName()
    if (!cleanName) return
    if (!isValidRoomCode(code)) {
      setError('codeInvalid')
      return
    }
    run('join', async () => {
      await joinRoom(code, uid, cleanName)
      saveName(cleanName)
      navigate(`/room/${code}`)
    })
  }

  return (
    <main className="screen">
      <h1>{t('app.title')}</h1>

      <NameField value={name} onChange={setName} />

      <button type="button" className="primary" onClick={handleCreate} disabled={busy !== null}>
        {busy === 'create' ? t('home.creating') : t('home.create')}
      </button>

      <p className="divider">{t('home.or')}</p>

      <form className="join-row" onSubmit={handleJoin}>
        <label className="field">
          <span>{t('home.codeLabel')}</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, ROOM_CODE_LENGTH))}
            placeholder={t('home.codePlaceholder')}
            autoComplete="off"
          />
        </label>
        <button type="submit" disabled={busy !== null}>
          {busy === 'join' ? t('home.joining') : t('home.join')}
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
