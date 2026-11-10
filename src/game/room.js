// 房間規則嘅純函數：唔依賴 Firebase 或 React。

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 6
export const NAME_MAX_LENGTH = 10
export const ROOM_CODE_LENGTH = 4
/** 開房超過 8 小時，個房號就可以俾新房重用（database.rules.json 用同一個數）。 */
export const ROOM_REUSE_AFTER_MS = 8 * 60 * 60 * 1000
/** Host 離線持續咁耐先移交，避免 host refresh 一下就失去 host。 */
export const HOST_GRACE_MS = 5000

/** 隨機 4 位數字房號（0000–9999，字串）。random 可以注入，方便測試。 */
export function generateRoomCode(random = Math.random) {
  const n = Math.floor(random() * 10 ** ROOM_CODE_LENGTH)
  return String(n).padStart(ROOM_CODE_LENGTH, '0')
}

export function isValidRoomCode(code) {
  return typeof code === 'string' && /^\d{4}$/.test(code)
}

export function normalizeName(name) {
  return typeof name === 'string' ? name.trim() : ''
}

/**
 * 檢查名字（先 trim）。返回 'nameRequired' | 'nameTooLong' | null。
 * 長度用 String.length，同 Realtime Database rules 嘅計法一致。
 */
export function nameError(name) {
  const trimmed = normalizeName(name)
  if (trimmed.length === 0) return 'nameRequired'
  if (trimmed.length > NAME_MAX_LENGTH) return 'nameTooLong'
  return null
}

/** 房開咗超過 8 小時：當佢唔存在，房號可以重用。 */
export function isRoomStale(room, now) {
  if (!room) return true
  return !(typeof room.createdAt === 'number' && room.createdAt >= now - ROOM_REUSE_AFTER_MS)
}

/** players 物件 → 按加入時間排序嘅陣列 [{ uid, name, joinedAt, online }]。 */
export function sortedPlayers(players) {
  return Object.entries(players ?? {})
    .map(([uid, p]) => ({ uid, ...p }))
    .sort((a, b) => a.joinedAt - b.joinedAt || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0))
}

export function playerCount(room) {
  return Object.keys(room?.players ?? {}).length
}

export function isMember(room, uid) {
  return Boolean(uid && room?.players?.[uid])
}

/**
 * 呢個玩家入唔入到呢個房。返回 'notFound' | 'started' | 'full' | null。
 * 已經喺房入面嘅玩家（例如 refresh）一定入到。
 */
export function joinError(room, uid, now) {
  if (isMember(room, uid)) return null
  if (!room || isRoomStale(room, now)) return 'notFound'
  if (room.status !== 'lobby') return 'started'
  if (playerCount(room) >= MAX_PLAYERS) return 'full'
  return null
}

/** 最早加入而又在線嘅玩家（唔計 excludeUid），冇就返回 null。 */
export function pickNextHost(players, excludeUid) {
  const next = sortedPlayers(players).find((p) => p.online === true && p.uid !== excludeUid)
  return next ? next.uid : null
}

/** Host 離線，或者已經唔喺房入面。 */
export function hostIsGone(room) {
  if (!room) return false
  const host = room.host ? room.players?.[room.host] : undefined
  return !host || host.online !== true
}

/** 我係咪應該接手 host：host 唔喺度，而我係最早加入而又在線嘅玩家。 */
export function shouldClaimHost(room, uid) {
  return hostIsGone(room) && pickNextHost(room.players, room.host) === uid
}

export function canStart(room, uid) {
  return Boolean(
    room && room.host === uid && room.status === 'lobby' && playerCount(room) >= MIN_PLAYERS,
  )
}
