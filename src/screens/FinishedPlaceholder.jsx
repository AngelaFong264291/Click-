import { useLanguage } from '../i18n/useLanguage.js'

export default function FinishedPlaceholder({ onLeave }) {
  const { t } = useLanguage()

  return (
    <main className="screen">
      <h1>{t('game.finished')}</h1>
      <button type="button" onClick={onLeave}>{t('room.leave')}</button>
    </main>
  )
}