import { useLanguage } from '../i18n/useLanguage.js'

// 階段 1 只係佔位：遊戲邏輯喺階段 4 先做。
export default function PlayingPlaceholder({ room }) {
  const { lang, t } = useLanguage()
  const questions = room.questions ?? []

  return (
    <main className="screen">
      <h1>{t('game.placeholder')}</h1>
      <ol>
        {questions.map((question, index) => {
          const targetName = room.players?.[question.targetUid]?.name ?? ''
          const text = question.text[lang].replace(/\{name\}/g, targetName)

          return (
            <li key={`${question.templateId}-${index}`}>
              <p>{text}</p>
              {question.options && (
                <div>
                  <span>{t('game.options')}: </span>
                  {question.options.map((option) => option[lang]).join(', ')}
                </div>
              )}
              {question.adjectives && (
                <div>
                  <span>{t('game.adjectives')}: </span>
                  {question.adjectives.map((adjective) => adjective[lang]).join(', ')}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </main>
  )
}
