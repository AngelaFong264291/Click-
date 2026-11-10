import { useLanguage } from '../i18n/useLanguage.js'

// 階段 1 只係佔位：遊戲邏輯喺階段 4 先做。
export default function PlayingPlaceholder() {
  const { t } = useLanguage()
  return (
    <main className="screen">
      <h1>{t('game.placeholder')}</h1>
    </main>
  )
}
