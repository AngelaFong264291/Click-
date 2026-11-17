// 結果頁：全組默契分、稱號、對分、獎項。規則見 docs/proposal-v3.pdf「默契排名」同「結果與稱號」。
// 房主喺完局嗰下計一次，存入 rooms/{code}/results，所有裝置讀返同一份。
import { answersEqual, normalizeAnswer } from './compare.js'
import { findSoleOutlier } from './midgame.js'
import { groupTitle, overallScore } from './overall.js'
import { averagePairScore } from './scoring.js'

/** 兩個 uid 砌成嘅固定 key（次序唔緊要），用嚟存 pairScores。 */
export function pairKey(uidA, uidB) {
  return [uidA, uidB].sort().join('_')
}

/** 所有玩家兩兩之間嘅對分平均，{ pairKey: number|null }。 */
export function allPairScores(questions, answersByQuestion, uids) {
  const result = {}
  for (let i = 0; i < uids.length; i++) {
    for (let j = i + 1; j < uids.length; j++) {
      result[pairKey(uids[i], uids[j])] = averagePairScore(questions, answersByQuestion, uids[i], uids[j])
    }
  }
  return result
}

/**
 * 最夾 CP / 平行線：對分平均最高 / 最低嘅配對，並列全部列出。
 * 兩人局唔頒（淨係得一對配對，冇意思）；冇任何一對有得比 → null。
 */
export function bestAndWorstPairs(uids, pairScores, playerCount) {
  if (playerCount === 2) return { best: null, worst: null }
  const pairs = []
  for (let i = 0; i < uids.length; i++) {
    for (let j = i + 1; j < uids.length; j++) {
      const score = pairScores[pairKey(uids[i], uids[j])]
      if (typeof score === 'number') pairs.push({ a: uids[i], b: uids[j], score })
    }
  }
  if (pairs.length === 0) return { best: null, worst: null }
  const max = Math.max(...pairs.map((p) => p.score))
  const min = Math.min(...pairs.map((p) => p.score))
  return {
    best: pairs.filter((p) => p.score === max),
    worst: pairs.filter((p) => p.score === min),
  }
}

/** 永遠的異類：成為唯一異類次數最多嘅玩家，並列全部列出。一次都冇試過 → null。 */
export function soleOutlierAward(questions, answersByQuestion, uids) {
  const counts = Object.fromEntries(uids.map((uid) => [uid, 0]))
  questions.forEach((question, index) => {
    const outlier = findSoleOutlier(question, answersByQuestion[index] ?? {})
    if (outlier) counts[outlier] += 1
  })
  const max = Math.max(...Object.values(counts))
  if (max === 0) return null
  return { uids: uids.filter((uid) => counts[uid] === max), count: max }
}

/**
 * 主流代表：答案同共識答案完全一樣嘅題數最多嘅玩家（猜朋友題唔計；共識打和時答中任何一個並列答案都計）。
 * 一次都冇試過 → null。
 */
export function voiceOfPeopleAward(questions, answersByQuestion, scoresByQuestion, uids) {
  const counts = Object.fromEntries(uids.map((uid) => [uid, 0]))
  questions.forEach((question, index) => {
    if (question.type === 'guess') return
    const consensuses = scoresByQuestion[index]?.consensuses
    if (!consensuses || consensuses.length === 0) return
    const answers = answersByQuestion[index] ?? {}
    uids.forEach((uid) => {
      const answer = normalizeAnswer(question, answers[uid])
      if (answer === undefined) return
      if (consensuses.some((candidate) => answersEqual(question, answer, candidate))) counts[uid] += 1
    })
  })
  const max = Math.max(...Object.values(counts))
  if (max === 0) return null
  return { uids: uids.filter((uid) => counts[uid] === max), count: max }
}

/**
 * 我嘅個人排名：其他玩家由最夾到最唔夾，分數相同共享排名。
 * 冇得比（例如中途離開、未夾過）嘅玩家放喺 noData，唔排名。
 */
export function personalRanking(myUid, pairScores, otherUids) {
  const withScores = otherUids.map((uid) => ({ uid, score: pairScores[pairKey(myUid, uid)] ?? null }))
  const noData = withScores.filter((r) => r.score === null).map((r) => r.uid)
  const sorted = withScores.filter((r) => r.score !== null).sort((a, b) => b.score - a.score)
  let rank = 0
  let lastScore = null
  const ranked = sorted.map((r, index) => {
    if (r.score !== lastScore) rank = index + 1
    lastScore = r.score
    return { uid: r.uid, score: r.score, rank }
  })
  return { ranked, noData }
}

/** uid 喺佢自己嘅排名入面，排第一同排尾嘅人（並列全部列出）。冇得比 → 都係空陣列。 */
export function theirExtremes(uid, pairScores, allUids) {
  const scores = allUids
    .filter((other) => other !== uid)
    .map((other) => ({ uid: other, score: pairScores[pairKey(uid, other)] ?? null }))
    .filter((r) => r.score !== null)
  if (scores.length === 0) return { firsts: [], lasts: [] }
  const max = Math.max(...scores.map((r) => r.score))
  const min = Math.min(...scores.map((r) => r.score))
  return {
    firsts: scores.filter((r) => r.score === max).map((r) => r.uid),
    lasts: scores.filter((r) => r.score === min).map((r) => r.uid),
  }
}

/**
 * 雙向奔赴 / 單戀：'mutual'（我同佢都排對方第一）、'oneSided'（我排佢第一，佢排我尾）、冇就 null。
 * 並列都計：排第一／尾嗰組入面有佢／我就算。
 */
export function rankingPopup(myUid, otherUid, pairScores, allUids) {
  const mine = theirExtremes(myUid, pairScores, allUids)
  const theirs = theirExtremes(otherUid, pairScores, allUids)
  const iRankThemFirst = mine.firsts.includes(otherUid)
  if (!iRankThemFirst) return null
  if (theirs.firsts.includes(myUid)) return 'mutual'
  if (theirs.lasts.includes(myUid)) return 'oneSided'
  return null
}

/**
 * 完局結果：全組默契分、稱號、對分、獎項。
 * uids 要用全部曾經入過呢局嘅玩家（包括中途離開嘅），咁樣個人排名先包晒一齊玩過嘅人。
 */
export function buildResults({ questions, answersByQuestion, scoresByQuestion, uids, playerCount }) {
  const groupScore = overallScore(scoresByQuestion.map((s) => (typeof s?.score === 'number' ? s.score : null)))
  const pairScores = allPairScores(questions, answersByQuestion, uids)
  const { best, worst } = bestAndWorstPairs(uids, pairScores, playerCount)
  return {
    groupScore,
    groupTitle: groupTitle(groupScore, playerCount),
    pairScores,
    awards: {
      bestMatch: best,
      parallelLines: worst,
      soleOutlier: soleOutlierAward(questions, answersByQuestion, uids),
      voiceOfPeople: voiceOfPeopleAward(questions, answersByQuestion, scoresByQuestion, uids),
    },
  }
}
