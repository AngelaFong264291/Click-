// 揭曉頁嘅計分算式文字。純函數：t() 由呼叫者傳入，唔喺度 import i18n。
// 規則見 docs/proposal-v3.pdf「題型與計分」同埋 src/game/README.md。
import { normalizeAnswer, roundedAverage, sameLines } from './compare.js'

function displayName(list, id, language) {
  const item = (list ?? []).find((entry) => (typeof entry === 'string' ? entry : entry.id) === id)
  if (!item) return id
  return typeof item === 'string' ? item : (item[language] ?? id)
}

function countMatching(answers, consensus) {
  return Object.values(answers).filter((value) => value === consensus).length
}

/**
 * 揭曉頁嘅計分算式文字。
 * - question：呢題嘅題目物件
 * - answers：呢題嘅答案，{ uid: value }（未經包裝，冇 ms）
 * - result：scoreQuestion(question, answers) 嘅結果
 * - t：(key, vars) => string
 * - language：'zh' | 'en'，用嚟揀 options / adjectives 嘅顯示文字
 */
export function scoreFormula(question, answers, result, t, language) {
  if (question.type === 'guess') return guessFormula(answers, result, t)
  if (result.score === null) return t('game.formula.notEnoughAnswers')
  if (result.score === 0) return t('game.formula.noMatch')

  if (question.type === 'choice') {
    const total = Object.keys(result.playerScores).length
    const matched = countMatching(answers, result.consensus)
    return t('game.formula.choice', {
      total,
      matched,
      answer: displayName(question.options, result.consensus, language),
      score: result.score,
    })
  }

  if (question.type === 'matching') {
    const uids = Object.keys(result.playerScores)
    const lineCounts = uids.map((uid) => sameLines(result.consensus, normalizeAnswer(question, answers[uid])))
    return t('game.formula.matchingAverage', {
      terms: lineCounts.join(language === 'zh' ? '、' : ', '),
      avgLines: roundedAverage(lineCounts),
      score: result.score,
    })
  }

  const consensus =
    question.type === 'ranking'
      ? result.consensus.map((id) => displayName(question.options, id, language)).join(' → ')
      : question.type === 'time'
        ? t('game.hourValue', { hour: result.consensus })
        : result.consensus
  const terms = Object.values(result.playerScores).join(' + ')
  return t('game.formula.average', {
    consensus,
    terms,
    count: Object.keys(result.playerScores).length,
    score: result.score,
  })
}

function guessFormula(answers, result, t) {
  const guessers = Object.keys(result.playerScores).length
  if (result.score === null || guessers === 0) return t('game.formula.notEnoughAnswers')
  const correct = Object.values(result.playerScores).filter((value) => value === 100).length
  return t('game.formula.guess', { guessers, correct, score: result.score })
}
