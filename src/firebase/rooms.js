// 房間讀寫：開房、入房、離開、開始、接手 host、presence。
// 規則判斷（入唔入到、揀邊個做 host）喺 src/game/room.js。
import {
  get,
  onDisconnect,
  onValue,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
} from 'firebase/database'
import { generateRoomCode, isRoomStale, joinError, pickNextHost } from '../game/room.js'
import { db } from './app.js'

const MAX_CODE_ATTEMPTS = 10

/** 帶住翻譯 key 嘅錯誤：notFound / started / full / noCode / generic。 */
export class RoomError extends Error {
  constructor(code, cause) {
    super(code)
    this.code = code
    this.cause = cause
  }
}

const roomRef = (code) => ref(db, `rooms/${code}`)
const playerRef = (code, uid) => ref(db, `rooms/${code}/players/${uid}`)
const onlineRef = (code, uid) => ref(db, `rooms/${code}/players/${uid}/online`)

// 用伺服器時間估算 now，避免玩家部機時鐘唔準影響 8 小時重用嘅判斷。
let serverTimeOffset = 0
let offsetListening = false
function serverNow() {
  if (!offsetListening) {
    offsetListening = true
    onValue(ref(db, '.info/serverTimeOffset'), (snap) => {
      serverTimeOffset = snap.val() ?? 0
    })
  }
  return Date.now() + serverTimeOffset
}

/**
 * 開新房，返回房號。用 transaction 寫 rooms/{code}：
 * 房號已經有人用（而又未過 8 小時）就放棄，再試第二個號。
 */
export async function createRoom(uid, name) {
  serverNow() // 盡早開始聽時間偏差
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateRoomCode()
    const now = serverNow()
    try {
      const result = await runTransaction(
        roomRef(code),
        (current) => {
          if (current && !isRoomStale(current, now)) return undefined // 有人用緊，放棄
          return {
            host: uid,
            status: 'lobby',
            createdAt: now,
            players: { [uid]: { name, joinedAt: now, online: true } },
          }
        },
        { applyLocally: false },
      )
      if (result.committed) return code
    } catch {
      // 例如 rules 拒絕（極少見），試下一個號
    }
  }
  throw new RoomError('noCode')
}

/** 入房。已經喺房入面（例如 refresh）就只係重新上線。 */
export async function joinRoom(code, uid, name) {
  let room
  try {
    room = (await get(roomRef(code))).val()
  } catch (e) {
    throw new RoomError('generic', e)
  }
  const error = joinError(room, uid, serverNow())
  if (error) throw new RoomError(error)

  try {
    if (room.players?.[uid]) {
      await set(onlineRef(code, uid), true)
    } else {
      await set(playerRef(code, uid), { name, joinedAt: serverTimestamp(), online: true })
    }
  } catch (e) {
    // 讀完之後先有人開始遊戲，rules 會拒絕新玩家
    throw new RoomError('generic', e)
  }
}

/** 離開：取消 onDisconnect，host 先交俾最早加入而又在線嘅人，再刪走自己。 */
export async function leaveRoom(code, uid, room) {
  await onDisconnect(onlineRef(code, uid)).cancel()
  if (room?.host === uid) {
    const next = pickNextHost(room.players, uid)
    if (next) await set(ref(db, `rooms/${code}/host`), next)
  }
  await remove(playerRef(code, uid))
}

export function startGame(code) {
  return set(ref(db, `rooms/${code}/status`), 'playing')
}

/**
 * 接手 host。用 transaction：只有 host 仲係 expectedHost 先寫入，
 * 所以就算兩個人同時以為自己係下一位，都只有一個成功。
 */
export async function claimHost(code, uid, expectedHost) {
  const result = await runTransaction(ref(db, `rooms/${code}/host`), (current) =>
    (current ?? null) === (expectedHost ?? null) ? uid : undefined,
  )
  return result.committed
}

/** 訂閱房間，返回 unsubscribe。callback 收到 room（唔存在就係 null）。 */
export function subscribeRoom(code, callback, onError) {
  return onValue(roomRef(code), (snap) => callback(snap.val()), onError)
}

/**
 * Presence：每次連上就先設定斷線時 online = false，然後寫 online = true。
 * 返回 cleanup：停止監聽並標記自己離線。
 */
export function trackPresence(code, uid) {
  const unsubscribe = onValue(ref(db, '.info/connected'), (snap) => {
    if (snap.val() !== true) return
    onDisconnect(onlineRef(code, uid))
      .set(false)
      .then(() => set(onlineRef(code, uid), true))
      .catch(() => {
        // 已經離開房間（entry 冇咗），rules 會拒絕，唔使理
      })
  })
  return () => {
    unsubscribe()
    set(onlineRef(code, uid), false).catch(() => {})
  }
}
