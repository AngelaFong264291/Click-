import { NAME_MAX_LENGTH } from '../game/room.js'
import { useLanguage } from '../i18n/useLanguage.js'

/** 名字輸入欄（首頁同分享連結入房共用）。 */
export default function NameField({ value, onChange, autoFocus = false }) {
  const { t } = useLanguage()
  return (
    <label className="field">
      <span>{t('home.nameLabel')}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={NAME_MAX_LENGTH}
        placeholder={t('home.namePlaceholder', { max: NAME_MAX_LENGTH })}
        autoComplete="nickname"
        autoFocus={autoFocus}
      />
    </label>
  )
}
