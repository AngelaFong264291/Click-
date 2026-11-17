import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { scoreQuestion } from '../game/scoring.js'
import {
  autoSubmitValue,
  questionDurationMs,
  shouldRevealQuestion,
} from '../game/flow.js'
import { useServerTime } from '../firebase/useServerTime.js'
import { advanceQuestion, revealQuestion, submitAnswer } from '../firebase/rooms.js'
import { sortedPlayers } from '../game/room.js'
import { useLanguage } from '../i18n/useLanguage.js'
import ChoiceQuestion from './questions/ChoiceQuestion.jsx'
import GuessQuestion from './questions/GuessQuestion.jsx'
import MatchingQuestion from './questions/MatchingQuestion.jsx'
import RankingQuestion from './questions/RankingQuestion.jsx'
import SliderQuestion from './questions/SliderQuestion.jsx'
import TimeQuestion from './questions/TimeQuestion.jsx'

function valueForDisplay(question, value, language, t) {
  if (value === undefined || value === null) return t('game.unanswered')
  if (question.type === 'slider') return t('game.sliderValue', { value })
  if (question.type === 'time') return t('game.hourValue', { hour: value })
  if (question.type === 'matching') {
    return Object.entries(value)
      .map(([itemId, adjectiveId]) => {
        const item = question.options.find((option) => option.id === itemId)?.[language] ?? itemId
        const adjective = question.adjectives.find((option) => option.id === adjectiveId)?.[language] ?? adjectiveId
        return t('game.matchPair', { item, adjective })
      })
      .join(', ') || t('game.noMatches')
  }
  if (question.type === 'ranking') {
    return value
      .map((id) => question.options.find((option) => option.id === id)?.[language] ?? id)
      .join(' → ')
  }
  return question.options.find((option) => option.id === value)?.[language] ?? value
}

export default function GameScreen({ code, room, uid, onLeave }) {
  const { lang, t } = useLanguage()
  const serverNow = useServerTime()
  const [error, setError] = useState(null)
  const [advancing, setAdvancing] = useState(false)
  const revealAttempt = useRef(null)
  const players = sortedPlayers(room.players)
  const question = room.questions?.[room.current]
  const answerSnapshot = room.answers?.[room.current]
  const answers = answerSnapshot ?? {}
  const isHost = room.host === uid

  const revealIfReady = useEffectEvent(() => {
    if (!shouldRevealQuestion(room, room.players, answers, serverNow) || !isHost) return
    const attempt = `${room.current}:${room.deadline}`
    if (revealAttempt.current === attempt) return
    revealAttempt.current = attempt
    revealQuestion(code).catch((error) => {
      console.error('[GameScreen] Failed to reveal question', {
        code: error?.code ?? error?.name,
        error,
      })
      revealAttempt.current = null
      setError('generic')
    })
  })

  useEffect(() => {
    revealIfReady()
  }, [answerSnapshot, isHost, serverNow])

  if (!question) {
    return <main className="screen"><p className="error">{t('game.questionUnavailable')}</p></main>
  }

  async function handleNext() {
    setAdvancing(true)
    setError(null)
    try {
      await advanceQuestion(code, room.current, room.questions[room.current + 1]?.type)
    } catch (error) {
      console.error('[GameScreen] Failed to advance question', {
        code: error?.code ?? error?.name,
        error,
      })
      setError('generic')
      setAdvancing(false)
    }
  }

  const language = lang === 'zh-HK' ? 'zh' : 'en'
  const questionNumber = room.current + 1
  const score = room.phase === 'reveal'
    ? scoreQuestion(question, Object.fromEntries(Object.entries(answers).map(([playerUid, answer]) => [playerUid, answer.value])))
    : null

  return (
    <main className="screen game-screen">
      <header className="game-header">
        <p>{t('game.questionProgress', { current: questionNumber, total: room.questions.length })}</p>
        {room.phase === 'answering' && <Countdown room={room} serverNow={serverNow} t={t} />}
      </header>

      <h1>{
        question.type === 'guess' && question.targetUid === uid
          ? t('game.guessTargetPrompt')
          : question.text[language].replace(/\{name\}/g, room.players?.[question.targetUid]?.name ?? '')
      }</h1>

      {room.phase === 'answering' ? (
        <AnsweringPanel
          key={`${room.current}-${uid}`}
          code={code}
          room={room}
          question={question}
          answers={answers}
          serverNow={serverNow}
          uid={uid}
          language={language}
          t={t}
        />
      ) : (
        <section aria-labelledby="reveal-title">
          <h2 id="reveal-title">{t('game.revealTitle')}</h2>
          <ul className="answer-list">
            {players.map((player) => (
              <li key={player.uid}>
                <strong>{player.name}</strong>
                <span>{valueForDisplay(question, answers[player.uid]?.value, language, t)}</span>
              </li>
            ))}
          </ul>
          <p>{t('game.questionScore', { score: score.score === null ? t('game.noScore') : score.score })}</p>
          {isHost ? (
            <button type="button" className="primary" disabled={advancing} onClick={handleNext}>
              {t('game.next')}
            </button>
          ) : (
            <p className="hint">{t('game.waitingHost')}</p>
          )}
        </section>
      )}

      <section aria-label={t('game.playerStatus')}>
        <ul className="player-list">
          {players.map((player) => (
            <li key={player.uid} className={player.online ? undefined : 'offline'}>
              <span>{player.name}</span>
              {player.uid === room.host && <span className="tag">{t('room.host')}</span>}
              {player.left && <span className="tag muted">{t('game.left')}</span>}
              {answers[player.uid] && <span className="tag" aria-label={t('game.answered')}>✓ {t('game.answered')}</span>}
            </li>
          ))}
        </ul>
      </section>

      {error && <p className="error" role="alert">{t(`errors.${error}`)}</p>}
      <button type="button" onClick={onLeave}>{t('room.leave')}</button>
    </main>
  )
}

function Countdown({ room, serverNow, t }) {
  if (serverNow === null || !Number.isFinite(room.deadline)) {
    return <p aria-live="polite">{t('common.loading')}</p>
  }
  const seconds = Math.max(0, Math.ceil((room.deadline - serverNow) / 1000))
  return <p aria-live="off">{t('game.countdown', { seconds })}</p>
}

function AnsweringPanel({ code, room, question, answers, serverNow, uid, language, t }) {
  const [draft, setDraft] = useState(
    question.type === 'ranking' ? [] : question.type === 'matching' ? {} : undefined,
  )
  const [interacted, setInteracted] = useState(false)
  const [localSubmitted, setLocalSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const submittedRef = useRef(false)
  const duration = questionDurationMs(question.type)
  const remaining = serverNow === null ? duration : Math.max(0, room.deadline - serverNow)
  const existingAnswer = answers[uid]
  const locked = Boolean(existingAnswer || localSubmitted || remaining <= 0)
  async function sendAnswer(value) {
    if (submittedRef.current || existingAnswer || serverNow === null) return
    submittedRef.current = true
    setLocalSubmitted(true)
    setSubmitError(false)
    const ms = Math.max(0, Math.round(serverNow - (room.deadline - duration)))
    try {
      await submitAnswer(code, room.current, uid, value, ms)
    } catch (error) {
      console.error('[GameScreen] Failed to submit answer', {
        code: error?.code ?? error?.name,
        error,
      })
      submittedRef.current = false
      setLocalSubmitted(false)
      setSubmitError(true)
    }
  }

  const submitAtDeadline = useEffectEvent((value) => sendAnswer(value))

  useEffect(() => {
    if (remaining > 0 || !interacted || submittedRef.current) return
    const value = autoSubmitValue(question, draft, interacted)
    if (value === undefined) return undefined
    const timer = setTimeout(() => submitAtDeadline(value), 0)
    return () => clearTimeout(timer)
  }, [draft, interacted, question, remaining])

  const commonProps = {
    question,
    value: draft,
    disabled: locked,
    t,
    onChange: (value) => {
      setDraft(value)
      setInteracted(true)
    },
    onSubmit: sendAnswer,
  }

  if (existingAnswer || localSubmitted) {
    return <p className="hint" aria-live="polite">{t('game.waitingOthers')}</p>
  }
  if (remaining <= 0) {
    return <p className="hint" aria-live="polite">{t('game.waitingReveal')}</p>
  }
  if (serverNow === null) return <p className="hint">{t('common.loading')}</p>

  return (
    <section className="stack">
      {question.type === 'choice' && <ChoiceQuestion question={question} language={language} disabled={locked} onAnswer={sendAnswer} />}
      {question.type === 'guess' && (
        <GuessQuestion
          question={question}
          language={language}
          disabled={locked}
          onAnswer={sendAnswer}
        />
      )}
      {question.type === 'slider' && <SliderQuestion {...commonProps} />}
      {question.type === 'time' && <TimeQuestion {...commonProps} />}
      {question.type === 'matching' && <MatchingQuestion {...commonProps} />}
      {question.type === 'ranking' && <RankingQuestion {...commonProps} />}
      {submitError && <p className="error" role="alert">{t('errors.generic')}</p>}
    </section>
  )
}