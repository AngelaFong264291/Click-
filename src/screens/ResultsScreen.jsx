import { useEffect, useState } from 'react'
import { playAgain } from '../firebase/rooms.js'
import { pairKey, personalRanking, rankingPopup } from '../game/results.js'
import { sortedPlayers } from '../game/room.js'
import { useLanguage } from '../i18n/useLanguage.js'
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js'

const REVEAL_STAGGER_MS = 700

export default function ResultsScreen({ code, room, uid, onLeave }) {
  const { lang, t } = useLanguage()
  const [stage, setStage] = useState('ranking')
  const players = sortedPlayers(room.players)
  const isHost = room.host === uid
  const results = room.results

  if (!results) {
    return <main className="screen"><p>{t('common.loading')}</p></main>
  }

  return (
    <main className="screen">
      {stage === 'ranking' ? (
        <PersonalRanking
          players={players}
          uid={uid}
          results={results}
          t={t}
          onContinue={() => setStage('results')}
        />
      ) : (
        <GroupResults code={code} players={players} isHost={isHost} results={results} lang={lang} t={t} />
      )}
      <button type="button" onClick={onLeave}>{t('room.leave')}</button>
    </main>
  )
}

function PersonalRanking({ players, uid, results, t, onContinue }) {
  const reducedMotion = usePrefersReducedMotion()
  const [revealedCount, setRevealedCount] = useState(0)
  const otherUids = players.filter((p) => p.uid !== uid).map((p) => p.uid)
  const nameOf = (id) => players.find((p) => p.uid === id)?.name ?? id
  const { ranked, noData } = personalRanking(uid, results.pairScores, otherUids)
  const revealOrder = [...ranked].reverse() // 最尾一名開始，第一名最後先揭曉
  const maxRank = ranked.length > 0 ? Math.max(...ranked.map((r) => r.rank)) : 0
  const allUids = players.map((p) => p.uid)
  const allRevealed = revealedCount >= revealOrder.length

  useEffect(() => {
    if (players.length === 2 || reducedMotion) {
      setRevealedCount(revealOrder.length)
      return undefined
    }
    const timers = revealOrder.map((_, index) =>
      setTimeout(() => setRevealedCount((count) => Math.max(count, index + 1)), (index + 1) * REVEAL_STAGGER_MS),
    )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (players.length === 2) {
    const otherUid = otherUids[0]
    const score = results.pairScores[pairKey(uid, otherUid)] ?? null
    return (
      <section className="stack">
        <h1>{t('results.rankingTitle')}</h1>
        <p>
          {score === null
            ? t('results.twoPlayerNoData', { name: nameOf(otherUid) })
            : t('results.twoPlayerScore', { name: nameOf(otherUid), score })}
        </p>
        <button type="button" className="primary" onClick={onContinue}>{t('results.seeResults')}</button>
      </section>
    )
  }

  return (
    <section className="stack" aria-labelledby="ranking-title">
      <h1 id="ranking-title">{t('results.rankingTitle')}</h1>
      <ul className="player-list">
        {noData.map((otherUid) => (
          <li key={otherUid}>{t('results.noSharedData', { name: nameOf(otherUid) })}</li>
        ))}
        {revealOrder.map((entry, index) => (
          <li key={entry.uid} className={`reveal-answer${index < revealedCount ? ' visible' : ''}`}>
            {index < revealedCount && (
              entry.rank === maxRank
                ? t('results.lastPlaceHint', { name: nameOf(entry.uid) })
                : t('results.rankRow', { rank: entry.rank, name: nameOf(entry.uid), score: entry.score })
            )}
          </li>
        ))}
      </ul>

      {allRevealed && (
        <>
          {ranked.map((entry) => {
            const popup = rankingPopup(uid, entry.uid, results.pairScores, allUids)
            if (!popup) return null
            return (
              <p key={entry.uid} role="status">
                {popup === 'mutual' ? t('results.mutualFirst') : t('results.oneSided')}
                {' — '}
                {nameOf(entry.uid)}
              </p>
            )
          })}
          <button type="button" className="primary" onClick={onContinue}>{t('results.seeResults')}</button>
        </>
      )}
    </section>
  )
}

function GroupResults({ code, players, isHost, results, lang, t }) {
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)
  const nameOf = (id) => players.find((p) => p.uid === id)?.name ?? id
  const join = (names) => names.map(nameOf).join(lang === 'zh-HK' ? '、' : ', ')
  const joinPairs = (pairs) =>
    pairs.map((p) => `${nameOf(p.a)} / ${nameOf(p.b)}`).join(lang === 'zh-HK' ? '、' : ', ')

  async function handlePlayAgain() {
    setStarting(true)
    setError(null)
    try {
      await playAgain(code)
    } catch (e) {
      console.error('[ResultsScreen] Failed to play again', { code: e?.code ?? e?.name, error: e })
      setError('generic')
      setStarting(false)
    }
  }

  return (
    <section className="stack" aria-labelledby="results-title">
      <h1 id="results-title">
        {t('results.groupScoreLabel')}: {results.groupScore ?? t('game.noScore')}
      </h1>
      {results.groupTitle && <p>{t(`results.titles.${results.groupTitle}`)}</p>}

      <ul className="player-list">
        {results.awards.bestMatch && (
          <li>{t('results.awards.bestMatch')}: {joinPairs(results.awards.bestMatch)}</li>
        )}
        {results.awards.parallelLines && (
          <li>{t('results.awards.parallelLines')}: {joinPairs(results.awards.parallelLines)}</li>
        )}
        {results.awards.soleOutlier && (
          <li>
            {t('results.awards.soleOutlier')}: {join(results.awards.soleOutlier.uids)}
            {t('results.awards.timesSuffix', { count: results.awards.soleOutlier.count })}
          </li>
        )}
        {results.awards.voiceOfPeople && (
          <li>
            {t('results.awards.voiceOfPeople')}: {join(results.awards.voiceOfPeople.uids)}
            {t('results.awards.timesSuffix', { count: results.awards.voiceOfPeople.count })}
          </li>
        )}
      </ul>

      {isHost ? (
        <button type="button" className="primary" disabled={starting} onClick={handlePlayAgain}>
          {t('results.playAgain')}
        </button>
      ) : (
        <p className="hint">{t('results.waitingPlayAgain')}</p>
      )}
      {error && <p className="error" role="alert">{t(`errors.${error}`)}</p>}
    </section>
  )
}
