import { useEffect, useEffectEvent, useRef, useState } from 'react'
import Button from '../components/design/Button.jsx'
import { Avatar, HostTag } from '../components/design/PlayerTag.jsx'
import ClownSticker from '../components/design/ClownSticker.jsx'
import { ThermometerBar } from '../components/design/Thermometer.jsx'
import CountdownTimer from '../components/design/CountdownTimer.jsx'
import WhiteboardCard from '../components/design/WhiteboardCard.jsx'
import { scoreFormula } from '../game/formula.js'
import { thermometer } from '../game/midgame.js'
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
import { playerColorVar } from './playerColor.js'
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js'

const FLIP_STAGGER_MS = 250

const QUESTION_TAG_COLOR = {
  choice: 'var(--color-player-yellow)',
  slider: 'var(--color-player-orange)',
  time: 'var(--color-player-blue)',
  matching: 'var(--color-player-pink)',
  ranking: 'var(--color-player-green)',
  guess: 'var(--color-player-red)',
}

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
  const reducedMotion = usePrefersReducedMotion()
  const [error, setError] = useState(null)
  const [advancing, setAdvancing] = useState(false)
  const [revealedCount, setRevealedCount] = useState(0)
  const revealAttempt = useRef(null)
  const players = sortedPlayers(room.players)
  const question = room.questions?.[room.current]
  const answerSnapshot = room.answers?.[room.current]
  const answers = answerSnapshot ?? {}
  const isHost = room.host === uid
  const scores = room.scores ?? {}
  const scoreResult = room.phase === 'reveal' ? scores[room.current] : null

  const revealIfReady = useEffectEvent(() => {
    if (!shouldRevealQuestion(room, room.players, answers, serverNow) || !isHost) return
    const attempt = `${room.current}:${room.deadline}`
    if (revealAttempt.current === attempt) return
    revealAttempt.current = attempt
    revealQuestion(code, room).catch((error) => {
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

  useEffect(() => {
    if (room.phase !== 'reveal') {
      setRevealedCount(0)
      return undefined
    }
    if (reducedMotion) {
      setRevealedCount(players.length)
      return undefined
    }
    setRevealedCount(0)
    const timers = players.map((_, index) =>
      setTimeout(() => setRevealedCount((count) => Math.max(count, index + 1)), (index + 1) * FLIP_STAGGER_MS),
    )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.phase, room.current, reducedMotion])

  if (!question) {
    return <main className="screen"><p className="error">{t('game.questionUnavailable')}</p></main>
  }

  async function handleNext() {
    setAdvancing(true)
    setError(null)
    try {
      await advanceQuestion(code, room)
    } catch (error) {
      console.error('[GameScreen] Failed to advance question', {
        code: error?.code ?? error?.name,
        error,
      })
      setError('generic')
    } finally {
      setAdvancing(false)
    }
  }

  const language = lang === 'zh-HK' ? 'zh' : 'en'
  const questionNumber = room.current + 1
  const scoredValues = Object.values(scores).map((s) => (typeof s.score === 'number' ? s.score : null))
  const thermometerValue = thermometer(scoredValues)
  const scoredCount = scoredValues.filter((v) => v !== null).length
  const allRevealed = revealedCount >= players.length
  const outlierUids = new Set((scoreResult?.events?.outliers ?? []).map((o) => o.uid))

  return (
    <main className="screen game-screen">
      <header className="game-header">
        <p>{t('game.questionProgress', { current: questionNumber, total: room.questions.length })}</p>
        {room.phase === 'answering' && <Countdown room={room} serverNow={serverNow} question={question} t={t} />}
      </header>

      <ThermometerBar value={thermometerValue} count={scoredCount} t={t} />

      <WhiteboardCard
        tagLabel={t(`design.questionTypes.${question.type}`)}
        tagColor={QUESTION_TAG_COLOR[question.type]}
        theme={question.theme ? t('game.themeLabel', { name: question.theme[language] }) : undefined}
        question={
          question.type === 'guess' && question.targetUid === uid
            ? t('game.guessTargetPrompt')
            : question.text[language].replace(/\{name\}/g, room.players?.[question.targetUid]?.name ?? '')
        }
      />

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
            {players.map((player, index) => (
              <li
                key={player.uid}
                className={`reveal-answer${index < revealedCount ? ' visible' : ''}`}
              >
                <strong>{player.name}</strong>
                <span>{index < revealedCount ? valueForDisplay(question, answers[player.uid]?.value, language, t) : ''}</span>
              </li>
            ))}
          </ul>

          {allRevealed && scoreResult && (
            <>
              <p>{t('game.questionScore', { score: scoreResult.score === null || scoreResult.score === undefined ? t('game.noScore') : scoreResult.score })}</p>
              <p className="hint">{scoreFormula(question, plainAnswerValues(answers), scoreResult, t, language)}</p>
              <RevealEvents events={scoreResult.events} players={players} reducedMotion={reducedMotion} t={t} />
            </>
          )}

          {isHost ? (
            <button type="button" className="primary" disabled={advancing || !allRevealed} onClick={handleNext}>
              {t('game.next')}
            </button>
          ) : (
            <p className="hint">{t('game.waitingHost')}</p>
          )}
        </section>
      )}

      <section aria-label={t('game.playerStatus')}>
        <ul className="player-status-list">
          {players.map((player) => (
            <li key={player.uid} className="player-status-row">
              <Avatar
                initial={player.name.charAt(0)}
                color={playerColorVar(room.players, player.uid)}
                state={player.left ? 'left' : answers[player.uid] ? 'answered' : 'waiting'}
              />
              <span className="player-status-name">{player.name}</span>
              {player.uid === room.host && <HostTag t={t} />}
              {player.left && <span className="hint">{t('game.left')}</span>}
              {answers[player.uid] && <span className="sr-only">{t('game.answered')}</span>}
              {outlierUids.has(player.uid) && <ClownSticker size={20} label={t('game.soleOutlierBadge')} />}
            </li>
          ))}
        </ul>
      </section>

      {error && <p className="error" role="alert">{t(`errors.${error}`)}</p>}
      <Button variant="secondary" onClick={onLeave}>{t('room.leave')}</Button>
    </main>
  )
}

function plainAnswerValues(answers) {
  return Object.fromEntries(Object.entries(answers).map(([playerUid, answer]) => [playerUid, answer.value]))
}

function RevealEvents({ events, players, reducedMotion, t }) {
  if (!events) return null
  const nameOf = (uid) => players.find((p) => p.uid === uid)?.name ?? uid
  return (
    <>
      {(events.mindMeld ?? []).map(({ a, b }) => (
        <p key={`${a}-${b}`} role="status">{t('game.mindMeld', { a: nameOf(a), b: nameOf(b) })}</p>
      ))}
      {events.fireworks && (
        reducedMotion
          ? <p role="status">{t('game.unanimous')}</p>
          : <p role="status" className="fireworks">{t('game.unanimous')}</p>
      )}
    </>
  )
}

function Countdown({ room, serverNow, question, t }) {
  if (serverNow === null || !Number.isFinite(room.deadline)) {
    return <p aria-live="polite">{t('common.loading')}</p>
  }
  const seconds = Math.max(0, Math.ceil((room.deadline - serverNow) / 1000))
  const total = Math.round(questionDurationMs(question.type) / 1000)
  return (
    <div aria-live="off">
      <CountdownTimer seconds={seconds} total={total} label={t('game.countdown', { seconds })} />
    </div>
  )
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
    language,
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
          targetName={room.players?.[question.targetUid]?.name}
          targetColor={playerColorVar(room.players, question.targetUid)}
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