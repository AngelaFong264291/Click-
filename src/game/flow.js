import { normalizeAnswer } from './compare.js'

export const QUESTION_COUNT = 10
export const QUESTION_TIME_MS = 10_000
export const MATCHING_TIME_MS = 15_000
export const ANSWER_GRACE_MS = 2_000

export function questionDurationMs(type) {
  return type === 'matching' ? MATCHING_TIME_MS : QUESTION_TIME_MS
}

export function questionDeadline(serverNow, type) {
  if (!Number.isFinite(serverNow)) throw new Error('Server time must be a finite number.')
  return serverNow + questionDurationMs(type)
}

export function onlinePlayerUids(players) {
  return Object.entries(players ?? {})
    .filter(([, player]) => player.online === true && player.left !== true)
    .map(([uid]) => uid)
}

export function hasEveryoneAnswered(players, answers) {
  const uids = onlinePlayerUids(players)
  return uids.length > 0 && uids.every((uid) => Object.hasOwn(answers?.[uid] ?? {}, 'value'))
}

export function shouldRevealQuestion(room, players, answers, serverNow) {
  if (room?.status !== 'playing' || room.phase !== 'answering') return false
  if (hasEveryoneAnswered(players, answers)) return true
  return (
    Number.isFinite(room.deadline) &&
    Number.isFinite(serverNow) &&
    serverNow >= room.deadline + ANSWER_GRACE_MS
  )
}

/** Return the answer to auto-submit, or undefined when it should remain unanswered. */
export function autoSubmitValue(question, draft, interacted) {
  if (!interacted || !['slider', 'time', 'matching', 'ranking'].includes(question?.type)) {
    return undefined
  }
  if (question.type === 'matching' && (!draft || Object.keys(draft).length === 0)) {
    return undefined
  }
  if (question.type === 'ranking' && (!Array.isArray(draft) || draft.length !== question.options.length)) {
    return undefined
  }
  return normalizeAnswer(question, draft)
}

export function nextQuestionState(current) {
  if (!Number.isInteger(current) || current < 0 || current >= QUESTION_COUNT) {
    throw new Error(`Current question must be an integer from 0 to ${QUESTION_COUNT - 1}.`)
  }
  if (current >= QUESTION_COUNT - 1) return { status: 'finished' }
  return { status: 'playing', current: current + 1, phase: 'answering' }
}