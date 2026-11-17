// Firebase Realtime Database 寫入時會刪走 null、undefined 同空 object/array 嘅欄位
// （例如 scoreQuestion 答案少過 2 人嗰陣，score/consensus 係 null，playerScores 係 {}，
// 讀返嚟就淨係淨低 events）。依個檔案喺讀嗰下（subscribeRoom）將呢啲刪剩嘅洞
// 補返 scoreQuestion／buildResults 本身會出嘅「空」值，等下游程式碼唔使周圍加 undefined 判斷。
// 純函數，唔依賴 Firebase 或 React。

function normalizeEvents(events) {
  return {
    mindMeld: events?.mindMeld ?? [],
    outliers: events?.outliers ?? [],
    fireworks: events?.fireworks ?? false,
  }
}

function normalizeScoreEntry(score) {
  if (!score) return score
  return {
    score: score.score ?? null,
    consensus: score.consensus ?? null,
    consensuses: score.consensuses ?? [],
    playerScores: score.playerScores ?? {},
    targetAnswer: score.targetAnswer ?? null,
    events: normalizeEvents(score.events),
  }
}

function normalizeScores(scores) {
  if (!scores) return scores
  return Object.fromEntries(
    Object.entries(scores).map(([index, score]) => [index, normalizeScoreEntry(score)]),
  )
}

function normalizeAwards(awards) {
  return {
    bestMatch: awards?.bestMatch ?? null,
    parallelLines: awards?.parallelLines ?? null,
    soleOutlier: awards?.soleOutlier ?? null,
    voiceOfPeople: awards?.voiceOfPeople ?? null,
  }
}

function normalizeResults(results) {
  if (!results) return results
  return {
    groupScore: results.groupScore ?? null,
    groupTitle: results.groupTitle ?? null,
    pairScores: results.pairScores ?? {},
    awards: normalizeAwards(results.awards),
  }
}

/**
 * 補返 Firebase 讀嗰陣俾刪走嘅欄位。room 唔存在（null/undefined）就原樣返回。
 * 淨係補 scores／results 入面已經有嘅 entry 嘅內部欄位，唔會無端生出成個 scores／results
 * （房間未揭曉／未完局嗰陣，呢兩個照樣唔存在，等畫面可以分辨「未到」同「到咗但係空」）。
 */
export function normalizeRoom(room) {
  if (!room) return room
  return {
    ...room,
    scores: normalizeScores(room.scores),
    results: normalizeResults(room.results),
  }
}
