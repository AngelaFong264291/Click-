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
  update,
} from 'firebase/database'
import { generateRoomCode, isRoomStale, joinError, pickNextHost } from '../game/room.js'
import { nextQuestionState, questionDeadline } from '../game/flow.js'
import { generateQuestions } from '../game/generateQuestions.js'
import { revealEvents } from '../game/midgame.js'
import { scoreQuestion } from '../game/scoring.js'
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

async function accurateServerNow() {
  serverTimeOffset = await new Promise((resolve, reject) => {
    let unsubscribe = () => {}
    unsubscribe = onValue(
      ref(db, '.info/serverTimeOffset'),
      (snapshot) => {
        const offset = snapshot.val()
        unsubscribe()
        if (!Number.isFinite(offset)) {
          reject(new Error('Firebase returned an invalid server time offset.'))
          return
        }
        resolve(offset)
      },
      (error) => {
        unsubscribe()
        reject(error)
      },
    )
  })
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
  if (room?.status !== 'lobby') {
    if (room?.host === uid && room.status === 'playing') {
      const next = pickNextHost(room.players, uid)
      if (next) await set(ref(db, `rooms/${code}/host`), next)
    }
    await update(playerRef(code, uid), { left: true, online: false })
    return
  }
  if (room?.host === uid) {
    const next = pickNextHost(room.players, uid)
    if (next) await set(ref(db, `rooms/${code}/host`), next)
  }
  await remove(playerRef(code, uid))
}

export async function startGame(code, playerUids) {
  let stage = 'generate questions'
  try {
    const questions = generateQuestions(playerUids)
    stage = 'read server time offset'
    const now = await accurateServerNow()
    stage = 'write questions and initial room state'
    await update(roomRef(code), {
      questions,
      status: 'playing',
      current: 0,
      phase: 'answering',
      deadline: questionDeadline(now, questions[0].type),
    })
  } catch (error) {
    console.error(`[startGame] Failed to ${stage}`, {
      code: error?.code ?? error?.name,
      error,
    })
    throw error
  }
}

export function submitAnswer(code, questionIndex, uid, value, ms) {
  return set(ref(db, `rooms/${code}/answers/${questionIndex}/${uid}`), { value, ms })
}

function plainAnswers(entry) {
  return Object.fromEntries(Object.entries(entry ?? {}).map(([uid, answer]) => [uid, answer.value]))
}

/**
 * 揭曉：喺同一個 update 入面計分同寫 phase，等所有裝置睇到一樣嘅結果。
 * room 要有 questions、answers、players、current（即係 useRoom 嗰個 room 物件）。
 */
export function revealQuestion(code, room) {
  const { current, questions, players } = room
  const answersByQuestion = questions.map((_, index) => plainAnswers(room.answers?.[index]))
  const result = scoreQuestion(questions[current], answersByQuestion[current])
  const events = revealEvents(questions, answersByQuestion, Object.keys(players ?? {}), current)
  return update(roomRef(code), {
    phase: 'reveal',
    [`scores/${current}`]: { ...result, events },
  })
}

export async function advanceQuestion(code, current, nextQuestionType) {
  const next = nextQuestionState(current)
  if (next.status === 'finished') return update(roomRef(code), next)
  const now = await accurateServerNow()
  return update(roomRef(code), {
    ...next,
    deadline: questionDeadline(now, nextQuestionType),
  })
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
