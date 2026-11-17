import Button from './design/Button.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

export default function LanguageToggle() {
  const { t, toggle } = useLanguage()
  return (
    <Button
      variant="secondary"
      style={{ fontSize: 'var(--text-body-sm)', padding: '0 var(--space-3)' }}
      onClick={toggle}
      aria-label={t('lang.toggleAria')}
    >
      {t('lang.toggle')}
    </Button>
  )
}
