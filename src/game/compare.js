// 答案檢查同比較：每款題型點樣判斷答案啱唔啱格式、兩個答案有幾接近。
// 純函數，唔依賴 Firebase 或 React。

export const SLIDER_MIN = 0
export const SLIDER_MAX = 10
export const HOURS = 24

/** 距離 0 / 1 / 2 → 100 / 70 / 40，再遠 0。拉桿、時間、排序共用。 */
const TIERS = [100, 70, 40]
export function tierScore(distance) {
  return TIERS[distance] ?? 0
}

/** options / adjectives 每項可以係 id 字串或者 { id, zh, en }，呢度只攞 id。 */
export function idsOf(list) {
  return Array.isArray(list) ? list.map((item) => (typeof item === 'string' ? item : item?.id)) : []
}

/** 時間係圓形：23 點同 0 點相差 1。 */
export function timeDistance(a, b) {
  const d = Math.abs(a - b) % HOURS
  return Math.min(d, HOURS - d)
}

/** 兩個排序之間，有幾多組物件嘅先後次序一樣（4 個物件共 6 組）。 */
export function rankingAgreements(a, b) {
  const position = new Map(b.map((id, i) => [id, i]))
  let agree = 0
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      if (position.get(a[i]) < position.get(a[j])) agree++
    }
  }
  return agree
}

function pairCount(n) {
  return (n * (n - 1)) / 2
}

/** 兩個配對答案有幾多條線一樣（未連嘅線唔計）。 */
export function sameLines(a, b) {
  return Object.keys(a).filter((item) => b[item] !== undefined && a[item] === b[item]).length
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 檢查並整理一個答案。格式唔啱就返回 undefined（當冇作答）。
 * - choice / guess：options 入面嘅 id
 * - slider：0–10 整數；time：0–23 整數
 * - matching：{ itemId: adjectiveId }，id 唔啱嘅線會被剔走
 * - ranking：options 全部 id 嘅一個排列
 */
export function normalizeAnswer(question, value) {
  if (value === undefined || value === null) return undefined
  switch (question.type) {
    case 'choice':
    case 'guess':
      return idsOf(question.options).includes(value) ? value : undefined
    case 'slider':
      return Number.isInteger(value) && value >= SLIDER_MIN && value <= SLIDER_MAX ? value : undefined
    case 'time':
      return Number.isInteger(value) && value >= 0 && value < HOURS ? value : undefined
    case 'matching': {
      if (!isPlainObject(value)) return undefined
      const items = idsOf(question.options)
      const adjectives = idsOf(question.adjectives)
      return Object.fromEntries(
        Object.entries(value).filter(([item, adj]) => items.includes(item) && adjectives.includes(adj)),
      )
    }
    case 'ranking': {
      const items = idsOf(question.options)
      if (!Array.isArray(value) || value.length !== items.length) return undefined
      if (new Set(value).size !== value.length || !value.every((id) => items.includes(id))) {
        return undefined
      }
      return [...value]
    }
    default:
      return undefined
  }
}

/** answers { uid: value } → [[uid, 整理好嘅答案]]，冇作答同格式唔啱嘅跳過。 */
export function validAnswers(question, answers) {
  return Object.entries(answers ?? {})
    .map(([uid, value]) => [uid, normalizeAnswer(question, value)])
    .filter(([, value]) => value !== undefined)
}

/** 兩個（已整理）答案完全一樣。 */
export function answersEqual(question, a, b) {
  switch (question.type) {
    case 'matching': {
      const keysA = Object.keys(a)
      return keysA.length === Object.keys(b).length && keysA.every((k) => a[k] === b[k])
    }
    case 'ranking':
      return a.length === b.length && a.every((id, i) => id === b[i])
    default:
      return a === b
  }
}

/**
 * 計分用嘅整數「點數」，除以 pointScale(question) 就係 0–100 分。
 * 配對題用「線數 × 100」，除以物件數（3），避免 33.33… 嘅浮點誤差影響比較。
 */
export function similarityPoints(question, a, b) {
  switch (question.type) {
    case 'choice':
    case 'guess':
      return a === b ? 100 : 0
    case 'slider':
      return tierScore(Math.abs(a - b))
    case 'time':
      return tierScore(timeDistance(a, b))
    case 'matching':
      return sameLines(a, b) * 100
    case 'ranking':
      return tierScore(pairCount(a.length) - rankingAgreements(a, b))
    default:
      return 0
  }
}

export function pointScale(question) {
  return question.type === 'matching' ? idsOf(question.options).length : 1
}

/** 兩個（已整理）答案嘅接近程度，0–100（配對題可能有小數）。 */
export function similarity(question, a, b) {
  return similarityPoints(question, a, b) / pointScale(question)
}

/** 所有排列，次序固定（字典序跟原陣列）。 */
export function permutations(list) {
  if (list.length <= 1) return [list.slice()]
  return list.flatMap((first, i) =>
    permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [first, ...rest]),
  )
}

/** 平均（跳過 null / undefined），Math.round；冇數就返回 null。 */
export function roundedAverage(values) {
  const nums = (values ?? []).filter((v) => typeof v === 'number' && !Number.isNaN(v))
  if (nums.length === 0) return null
  return Math.round(nums.reduce((sum, v) => sum + v, 0) / nums.length)
}
