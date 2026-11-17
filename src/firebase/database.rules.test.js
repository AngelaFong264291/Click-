import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { ref, set, update } from 'firebase/database'
import { generateQuestions } from '../game/generateQuestions.js'

const PROJECT_ID = 'demo-click-rules'
const ROOM_CODE = '8818'
const HOST_UID = 'host-user'
const PLAYER_UID = 'player-user'
const PLAYER_UIDS = [HOST_UID, PLAYER_UID]
const ROOM_PATH = `rooms/${ROOM_CODE}`
const rules = readFileSync(new URL('../../database.rules.json', import.meta.url), 'utf8')
const questions = generateQuestions(PLAYER_UIDS, () => 0.37)

let testEnv

function lobbyRoom() {
  const now = Date.now()
  return {
    host: HOST_UID,
    status: 'lobby',
    createdAt: now,
    players: Object.fromEntries(
      PLAYER_UIDS.map((uid) => [uid, { name: uid, joinedAt: now, online: true }]),
    ),
  }
}

async function seedRoom(room) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), ROOM_PATH), room)
  })
}

function startUpdate() {
  return {
    questions,
    status: 'playing',
    current: 0,
    phase: 'answering',
    deadline: Date.now() + 10_000,
  }
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: { host: '127.0.0.1', port: 9000, rules },
  })
})

beforeEach(async () => {
  await testEnv.clearDatabase()
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('Realtime Database room rules', () => {
  it('allows the host to start with real generated questions', async () => {
    await seedRoom(lobbyRoom())
    const database = testEnv.authenticatedContext(HOST_UID).database()

    await expect(update(ref(database, ROOM_PATH), startUpdate())).resolves.toBeUndefined()
  })

  it('rejects a non-host starting the game', async () => {
    await seedRoom(lobbyRoom())
    const database = testEnv.authenticatedContext(PLAYER_UID).database()

    await expect(update(ref(database, ROOM_PATH), startUpdate())).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
    })
  })

  it('rejects an extra question index', async () => {
    await seedRoom(lobbyRoom())
    const database = testEnv.authenticatedContext(HOST_UID).database()
    const invalidQuestions = Object.fromEntries(questions.map((question, index) => [index, question]))
    invalidQuestions[10] = questions[0]

    await expect(
      update(ref(database, ROOM_PATH), { ...startUpdate(), questions: invalidQuestions }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
  })

  it('allows a player to submit their own answer once', async () => {
    const room = lobbyRoom()
    room.status = 'playing'
    room.current = 0
    room.phase = 'answering'
    room.deadline = Date.now() + 10_000
    room.questions = questions
    await seedRoom(room)
    const database = testEnv.authenticatedContext(PLAYER_UID).database()
    const answerRef = ref(database, `${ROOM_PATH}/answers/0/${PLAYER_UID}`)
    const answer = { value: questions[0].options[0].id, ms: 250 }

    await expect(set(answerRef, answer)).resolves.toBeUndefined()
    await expect(set(answerRef, answer)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
  })

  it('allows the host to save a score once during the answering phase', async () => {
    const room = lobbyRoom()
    room.status = 'playing'
    room.current = 0
    room.phase = 'answering'
    room.deadline = Date.now() + 10_000
    room.questions = questions
    await seedRoom(room)
    const database = testEnv.authenticatedContext(HOST_UID).database()
    const score = { score: 75, consensus: 'A', playerScores: { [HOST_UID]: 100, [PLAYER_UID]: 50 } }

    await expect(
      update(ref(database, ROOM_PATH), { phase: 'reveal', 'scores/0': score }),
    ).resolves.toBeUndefined()
    await expect(
      update(ref(database, ROOM_PATH), { 'scores/0': score }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
  })

  it('rejects a non-host saving a score', async () => {
    const room = lobbyRoom()
    room.status = 'playing'
    room.current = 0
    room.phase = 'answering'
    room.deadline = Date.now() + 10_000
    room.questions = questions
    await seedRoom(room)
    const database = testEnv.authenticatedContext(PLAYER_UID).database()

    await expect(
      update(ref(database, ROOM_PATH), { phase: 'reveal', 'scores/0': { score: 75 } }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
  })

  it('rejects an unknown field in a score', async () => {
    const room = lobbyRoom()
    room.status = 'playing'
    room.current = 0
    room.phase = 'answering'
    room.deadline = Date.now() + 10_000
    room.questions = questions
    await seedRoom(room)
    const database = testEnv.authenticatedContext(HOST_UID).database()

    await expect(
      update(ref(database, ROOM_PATH), { phase: 'reveal', 'scores/0': { score: 75, extra: true } }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
  })

  it('rejects a score for a question index other than current', async () => {
    const room = lobbyRoom()
    room.status = 'playing'
    room.current = 0
    room.phase = 'answering'
    room.deadline = Date.now() + 10_000
    room.questions = questions
    await seedRoom(room)
    const database = testEnv.authenticatedContext(HOST_UID).database()

    await expect(
      update(ref(database, ROOM_PATH), { 'scores/1': { score: 75 } }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
  })

  it('rejects malformed or out-of-range answers', async () => {
    const room = lobbyRoom()
    room.status = 'playing'
    room.current = 0
    room.phase = 'answering'
    room.deadline = Date.now() + 10_000
    room.questions = questions
    await seedRoom(room)
    const database = testEnv.authenticatedContext(PLAYER_UID).database()

    await expect(
      set(ref(database, `${ROOM_PATH}/answers/0/${PLAYER_UID}`), {
        value: 'not-an-option',
        ms: 250,
      }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
    await expect(
      set(ref(database, `${ROOM_PATH}/answers/0/${PLAYER_UID}`), {
        value: questions[0].options[0].id,
        ms: -1,
      }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
    await expect(
      set(ref(database, `${ROOM_PATH}/answers/0/${PLAYER_UID}`), {
        value: questions[0].options[0].id,
        ms: 250,
        extra: true,
      }),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
  })
})