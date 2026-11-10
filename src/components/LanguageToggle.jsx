import { useLanguage } from '../i18n/useLanguage.js'

export default function LanguageToggle() {
  const { t, toggle } = useLanguage()
  return (
    <button type="button" className="lang-toggle" onClick={toggle} aria-label={t('lang.toggleAria')}>
      {t('lang.toggle')}
    </button>
  )
}
