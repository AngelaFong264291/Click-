import LanguageToggle from './components/LanguageToggle.jsx'
import { useLanguage } from './i18n/useLanguage.js'

function App() {
  const { t } = useLanguage()

  return (
    <>
      <header className="top-bar">
        <LanguageToggle />
      </header>
      <main className="home">
        <h1>{t('app.title')}</h1>
      </main>
    </>
  )
}

export default App
