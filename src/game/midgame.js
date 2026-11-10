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
