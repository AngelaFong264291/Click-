// 每題分數、兩人對分。規則見 docs/proposal-v3.pdf「題型與計分」。
import {
  answersEqual,
  idsOf,
  normalizeAnswer,
  pointScale,
  roundedAverage,
  similarity,
  similarityPoints,
  validAnswers,
} from './compare.js'

function dedupeByEquality(question, values) {
  const unique = []
  for (const value of values) {
    if (!unique.some((existing) => answersEqual(question, existing, value))) unique.push(value)
  }
  return unique
}

/**
 * 共識答案嘅候選：一定係玩家實際提交過嘅答案之一，次序固定（打和時揀第一個）。
 * - choice：按選項定義次序
 * - slider / time：由細到大
 * - matching / ranking：按玩家提交次序
 */
export function consensusCandidates(question, submittedValues = []) {
  switch (question.type) {
    case 'choice': {
      const submitted = new Set(submittedValues)
      return idsOf(question.options).filter((id) => submitted.has(id))
    }
    case 'slider':
    case 'time':
      return [...new Set(submittedValues)].sort((a, b) => a - b)
    case 'matching':
    case 'ranking':
      return dedupeByEquality(question, submittedValues)
    default:
      return []
  }
}

function emptyResult(extra) {
  return { score: null, consensus: null, consensuses: [], playerScores: {}, ...extra }
}

/**
 * 一題嘅分數。
 * 返回 { score, consensus, consensuses, playerScores }，猜朋友題另加 targetAnswer。
 * - score：0–100 整數；作答少過 2 人（或猜朋友題冇目標答案、冇人猜）係 null
 * - consensus：令全組得分最高嘅答案；打和時用候選次序第一個，所有並列嘅放 consensuses
 * - 最多一個人有分 → 0 分，consensus 係 null，playerScores 全部 0
 * - playerScores：{ uid: 0–100 }，對比 consensus（配對題可能有小數）
 */
export function scoreQuestion(question, answers) {
  if (question.type === 'guess') return scoreGuess(question, answers)

  const valid = validAnswers(question, answers)
  if (valid.length < 2) return emptyResult()

  let bestTotal = -1
  let best = []
  for (const candidate of consensusCandidates(question, valid.map(([, value]) => value))) {
    const total = valid.reduce((sum, [, value]) => sum + similarityPoints(question, candidate, value), 0)
    if (total > bestTotal) {
      bestTotal = total
      best = [candidate]
    } else if (total === bestTotal) {
      best.push(candidate)
    }
  }

  const consensus = best[0]
  const playerScores = Object.fromEntries(
    valid.map(([uid, value]) => [uid, similarity(question, consensus, value)]),
  )
  const scoringPlayers = Object.values(playerScores).filter((s) => s > 0).length

  if (scoringPlayers <= 1) {
    return {
      score: 0,
      consensus: null,
      consensuses: [],
      playerScores: Object.fromEntries(valid.map(([uid]) => [uid, 0])),
    }
  }

  return {
    score: Math.round(bestTotal / (pointScale(question) * valid.length)),
    consensus,
    consensuses: best,
    playerScores,
  }
}

/** 猜朋友題：猜中人數 ÷ 其他作答人數 × 100。目標冇作答或者冇人猜 → null。 */
function scoreGuess(question, answers) {
  const valid = validAnswers(question, answers)
  const target = question.targetUid
  const targetEntry = valid.find(([uid]) => uid === target)
  if (!targetEntry) return emptyResult({ targetAnswer: null })

  const targetAnswer = targetEntry[1]
  const guessers = valid.filter(([uid]) => uid !== target)
  if (guessers.length === 0) return emptyResult({ targetAnswer })

  const playerScores = Object.fromEntries(
    guessers.map(([uid, value]) => [uid, value === targetAnswer ? 100 : 0]),
  )
  const correct = guessers.filter(([, value]) => value === targetAnswer).length

  return {
    score: Math.round((correct / guessers.length) * 100),
    consensus: null,
    consensuses: [],
    playerScores,
    targetAnswer,
  }
}

/**
 * 兩個玩家喺一題嘅直接對分（0–100，配對題可能有小數）。
 * 任何一方冇作答（或格式唔啱）→ null。
 */
export function scorePair(question, answerA, answerB) {
  const a = normalizeAnswer(question, answerA)
  const b = normalizeAnswer(question, answerB)
  if (a === undefined || b === undefined) return null
  return similarity(question, a, b)
}

/**
 * 兩個玩家喺所有題目嘅平均對分（Math.round），跳過其中一方冇作答嘅題目。
 * answersByQuestion[i] 係第 i 題嘅 { uid: value }。一題都冇得比 → null。
 */
export function averagePairScore(questions, answersByQuestion, uidA, uidB) {
  return roundedAverage(
    questions.map((q, i) => scorePair(q, answersByQuestion[i]?.[uidA], answersByQuestion[i]?.[uidB])),
  )
}
