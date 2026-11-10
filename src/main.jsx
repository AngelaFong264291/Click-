import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './i18n/LanguageProvider.jsx'

// HashRouter：網址用 /#/room/1234 呢類格式（原本為 GitHub Pages 揀；轉咗 Firebase Hosting 都照用）。
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </LanguageProvider>
  </StrictMode>,
)
