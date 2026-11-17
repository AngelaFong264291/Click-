// 中途機制：心靈相通、唯一異類（🤡 / 永遠的異類）、全場一致、默契溫度計。
import { answersEqual, normalizeAnswer, roundedAverage, timeDistance, validAnswers } from './compare.js'

/**
 * 兩個答案算唔算吻合（心靈相通連線用）。
 * 完全一樣先算，例外：拉桿題差 1 分以內、時間題差 1 個鐘以內（23 同 0 相鄰）。
 */
export function isMatch(question, answerA, answerB) {
  const a = normalizeAnswer(question, answerA)
  const b = normalizeAnswer(question, answerB)
  if (a === undefined || b === undefined) return false
  if (question.type === 'slider') return Math.abs(a - b) <= 1
  if (question.type === 'time') return timeDistance(a, b) <= 1
  return answersEqual(question, a, b)
}

/**
 * 唯一異類：佢同邊個都唔吻合，而其他每個人都最少同一個人吻合。
 * 返回嗰個玩家嘅 uid；冇、或者作答少過 3 人 → null。
 */
export function findSoleOutlier(question, answers) {
  const valid = validAnswers(question, answers)
  if (valid.length < 3) return null
  const loners = valid.filter(
    ([uid, value]) => !valid.some(([other, otherValue]) => other !== uid && isMatch(question, value, otherValue)),
  )
  return loners.length === 1 ? loners[0][0] : null
}

/** 全場一致：作答嘅人（最少 2 個）答案完全一樣。冇作答嘅唔計。 */
export function isUnanimous(question, answers) {
  const valid = validAnswers(question, answers)
  if (valid.length < 2) return false
  const [, first] = valid[0]
  return valid.every(([, value]) => answersEqual(question, first, value))
}

/** 默契溫度計：已揭曉題目分數嘅平均（跳過 null）。未有分數 → null。 */
export function thermometer(scores) {
  return roundedAverage(scores)
}

/**
 * 一對玩家揭曉到 uptoIndex（含）為止嘅連續吻合題數。
 * 任何一方冇作答（或格式唔啱）嘅題目當冇發生，唔加唔清零；兩人都有作答但唔吻合先清零。
 */
export function matchStreak(questions, answersByQuestion, uidA, uidB, uptoIndex) {
  let streak = 0
  for (let i = 0; i <= uptoIndex; i++) {
    const question = questions[i]
    const valid = new Map(validAnswers(question, answersByQuestion[i]))
    if (!valid.has(uidA) || !valid.has(uidB)) continue
    streak = isMatch(question, valid.get(uidA), valid.get(uidB)) ? streak + 1 : 0
  }
  return streak
}

/**
 * 一個玩家揭曉到 uptoIndex（含）為止，連續成為唯一異類嘅題數。
 * 作答少過 3 人嘅題目當冇發生；有足夠人作答但冇異類（或異類係第二人）先清零。
 */
export function soleOutlierStreak(questions, answersByQuestion, uid, uptoIndex) {
  let streak = 0
  for (let i = 0; i <= uptoIndex; i++) {
    const question = questions[i]
    const answers = answersByQuestion[i] ?? {}
    if (validAnswers(question, answers).length < 3) continue
    streak = findSoleOutlier(question, answers) === uid ? streak + 1 : 0
  }
  return streak
}

/**
 * 揭曉第 currentIndex 題後嘅中途事件：
 * - mindMeld：連續吻合次數為 3 嘅倍數嘅配對（每次去到 3 的倍數都再彈一次）
 * - outliers：連續做唯一異類 ≥2 次嘅玩家（揭曉頁用嚟喺名之後加 🤡，跟返呢個快照）
 * - fireworks：呢題全場一致
 */
export function revealEvents(questions, answersByQuestion, uids, currentIndex) {
  const mindMeld = []
  for (let i = 0; i < uids.length; i++) {
    for (let j = i + 1; j < uids.length; j++) {
      const streak = matchStreak(questions, answersByQuestion, uids[i], uids[j], currentIndex)
      if (streak > 0 && streak % 3 === 0) mindMeld.push({ a: uids[i], b: uids[j], streak })
    }
  }
  const outliers = uids
    .map((uid) => ({ uid, streak: soleOutlierStreak(questions, answersByQuestion, uid, currentIndex) }))
    .filter(({ streak }) => streak >= 2)
  const fireworks = isUnanimous(questions[currentIndex], answersByQuestion[currentIndex] ?? {})
  return { mindMeld, outliers, fireworks }
}
