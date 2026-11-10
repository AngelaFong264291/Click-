// 全組默契分同整體稱號。規則見 docs/proposal-v2.pdf「結果與稱號」。
import { roundedAverage } from './compare.js'

/** 全組默契分：十題分數平均（跳過 null），Math.round。全部 null → null。 */
export function overallScore(questionScores) {
  return roundedAverage(questionScores)
}

/** [靈魂伴侶, 老友記, 普通朋友] 嘅最低分；兩人局門檻提高。 */
const THRESHOLDS = [90, 70, 40]
const TWO_PLAYER_THRESHOLDS = [95, 75, 45]
const TITLES = ['soulmates', 'oldFriends', 'justFriends']

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
