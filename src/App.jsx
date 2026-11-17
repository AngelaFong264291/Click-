import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import LanguageToggle from './components/LanguageToggle.jsx'
import { AuthProvider } from './firebase/AuthProvider.jsx'
import { firebaseReady } from './firebase/app.js'
import { missingConfigKeys } from './firebase/config.js'
import { useAuth } from './firebase/useAuth.js'
import { useLanguage } from './i18n/useLanguage.js'
import HomeScreen from './screens/HomeScreen.jsx'
import RoomScreen from './screens/RoomScreen.jsx'

// Style guide 淨係 dev 用（`npm run dev`）：import.meta.env.DEV 喺 production build
// 會變成 false，呢個分支連埋 lazy import 一齊俾 Vite 拎走，live 網站唔會有。
const StyleGuideScreen = import.meta.env.DEV ? lazy(() => import('./screens/StyleGuideScreen.jsx')) : null

function App() {
  return (
    <Routes>
      {import.meta.env.DEV && (
        <Route
          path="/design"
          element={
            <Suspense fallback={null}>
              <StyleGuideScreen />
            </Suspense>
          }
        />
      )}
      <Route path="*" element={<MainApp />} />
    </Routes>
  )
}

function MainApp() {
  return (
    <>
      <header className="top-bar">
        <LanguageToggle />
      </header>
      {firebaseReady ? (
        <AuthProvider>
          <SignedIn />
        </AuthProvider>
      ) : (
        <ConfigError />
      )}
    </>
  )
}

/** 等匿名登入完成先顯示畫面，畫面入面一定有 uid。 */
function SignedIn() {
  const { t } = useLanguage()
  const { ready, error } = useAuth()

  if (error) {
    return (
      <p className="screen error" role="alert">
        {t('errors.auth')}
      </p>
    )
  }
  if (!ready) return <p className="screen">{t('common.loading')}</p>

  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/room/:code" element={<RoomScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ConfigError() {
  const { t } = useLanguage()
  return (
    <main className="screen">
      <h1>{t('errors.configTitle')}</h1>
      <p>{t('errors.configBody')}</p>
      <ul>
        {missingConfigKeys.map((key) => (
          <li key={key}>
            <code>{key}</code>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
