// 全組默契分同整體稱號。規則見 docs/proposal-v3.pdf「結果與稱號」。
import { roundedAverage } from './compare.js'

/** 全組默契分：十題分數平均（跳過 null），Math.round。全部 null → null。 */
export function overallScore(questionScores) {
  return roundedAverage(questionScores)
}

/** [靈魂伴侶, 老友記, 普通朋友] 嘅最低分；兩人局門檻提高。 */
export const THRESHOLDS = [90, 70, 40]
export const TWO_PLAYER_THRESHOLDS = [95, 75, 45]
export const TITLES = ['soulmates', 'oldFriends', 'justFriends']

/**
 * 整體稱號 key，俾 UI 經 t() 翻譯：
 * 'soulmates'（靈魂伴侶）| 'oldFriends'（老友記）| 'justFriends'（普通朋友）| 'parallelUniverses'（平行宇宙）。
 * 分數係 null → null。
 */
export function groupTitle(score, playerCount) {
  if (typeof score !== 'number') return null
  const thresholds = playerCount === 2 ? TWO_PLAYER_THRESHOLDS : THRESHOLDS
  const index = thresholds.findIndex((min) => score >= min)
  return index === -1 ? 'parallelUniverses' : TITLES[index]
}

/**
 * 某個稱號對應嘅分數範圍 { min, max }，俾結果頁獎狀顯示（例如「70–89」）。
 * title 係 null，或者唔係 groupTitle 會出嘅 key → null。
 */
export function scoreRangeFor(playerCount, title) {
  const thresholds = playerCount === 2 ? TWO_PLAYER_THRESHOLDS : THRESHOLDS
  const lowest = thresholds[thresholds.length - 1]
  if (title === 'parallelUniverses') return { min: 0, max: lowest - 1 }
  const index = TITLES.indexOf(title)
  if (index === -1) return null
  return { min: thresholds[index], max: index === 0 ? 100 : thresholds[index - 1] - 1 }
}
