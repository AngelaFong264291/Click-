import { useEffect, useState } from 'react'
import Button from '../components/design/Button.jsx'
import AwardCertificate from '../components/design/AwardCertificate.jsx'
import AwardRow from '../components/design/AwardRow.jsx'
import { MutualPopup, OneSidedPopup } from '../components/design/Popups.jsx'
import { playAgain } from '../firebase/rooms.js'
import { scoreRangeFor } from '../game/overall.js'
import { pairKey, personalRanking, rankingPopup } from '../game/results.js'
import { sortedPlayers } from '../game/room.js'
import { useLanguage } from '../i18n/useLanguage.js'
import { playerColorTextVar, playerColorVar } from './playerColor.js'
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js'

const REVEAL_STAGGER_MS = 700

export default function ResultsScreen({ code, room, uid, onLeave }) {
  const { lang, t } = useLanguage()
  const [stage, setStage] = useState('ranking')
  const players = sortedPlayers(room.players)
  const isHost = room.host === uid
  const results = room.results

  if (!results) {
    return <main className="screen"><p className="hint">{t('common.loading')}</p></main>
  }

  return (
    <main className="screen">
      {stage === 'ranking' ? (
        <PersonalRanking
          players={players}
          roomPlayers={room.players}
          uid={uid}
          results={results}
          t={t}
          onContinue={() => setStage('results')}
        />
      ) : (
        <GroupResults code={code} players={players} isHost={isHost} results={results} lang={lang} t={t} />
      )}
      <Button variant="secondary" onClick={onLeave}>{t('room.leave')}</Button>
    </main>
  )
}

function PersonalRanking({ players, roomPlayers, uid, results, t, onContinue }) {
  const reducedMotion = usePrefersReducedMotion()
  const [revealedCount, setRevealedCount] = useState(0)
  const [popupIndex, setPopupIndex] = useState(0)
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
      <section className="ranking-screen stack">
        <h1 className="ranking-title">{t('results.rankingTitle')}</h1>
        <p className="ranking-subtitle">
          {score === null
            ? t('results.twoPlayerNoData', { name: nameOf(otherUid) })
            : t('results.twoPlayerScore', { name: nameOf(otherUid), score })}
        </p>
        <Button variant="primary" onClick={onContinue}>{t('results.seeResults')}</Button>
      </section>
    )
  }

  const popups = ranked
    .map((entry) => ({ entry, type: rankingPopup(uid, entry.uid, results.pairScores, allUids) }))
    .filter(({ type }) => type !== null)

  return (
    <section className="ranking-screen stack" aria-labelledby="ranking-title">
      <div>
        <p className="ranking-eyebrow">{t('results.awardNightEyebrow')}</p>
        <h1 id="ranking-title" className="ranking-title">{t('results.rankingTitle')}</h1>
        <p className="ranking-subtitle">{t('results.rankingSubtitle')}</p>
      </div>

      {noData.length > 0 && (
        <ul className="ranking-nodata">
          {noData.map((otherUid) => (
            <li key={otherUid}>{t('results.noSharedData', { name: nameOf(otherUid) })}</li>
          ))}
        </ul>
      )}

      <div className="stack">
        {revealOrder.map((entry, index) => {
          const pending = index >= revealedCount
          if (pending) {
            return (
              <div key={entry.uid} className="rank-card rank-card--pending">
                {t('results.rankPending')}
              </div>
            )
          }
          const isLast = entry.rank === maxRank
          return (
            <div
              key={entry.uid}
              className={`rank-card rank-card--visible${entry.rank === 1 ? ' rank-card--first' : ''}`}
            >
              <span
                className="rank-card__badge"
                style={{ background: playerColorVar(roomPlayers, entry.uid), color: playerColorTextVar(roomPlayers, entry.uid) }}
              >
                {entry.rank}
              </span>
              <span className="rank-card__body">
                <span className="rank-card__name">{nameOf(entry.uid)}</span>
                <span className="rank-card__caption">
                  {isLast ? t('results.lastPlaceHint', { name: nameOf(entry.uid) }) : t('results.pairAverageCaption')}
                </span>
              </span>
              {!isLast && <span className="rank-card__score">{entry.score}</span>}
            </div>
          )
        })}
      </div>

      {allRevealed && (
        popupIndex < popups.length ? (
          <PopupFor
            uid={uid}
            roomPlayers={roomPlayers}
            popup={popups[popupIndex]}
            nameOf={nameOf}
            t={t}
            reducedMotion={reducedMotion}
            onContinue={() => setPopupIndex((i) => i + 1)}
          />
        ) : (
          <Button variant="primary" onClick={onContinue}>{t('results.seeResults')}</Button>
        )
      )}
    </section>
  )
}

function PopupFor({ uid, roomPlayers, popup, nameOf, t, reducedMotion, onContinue }) {
  const { entry, type } = popup
  if (type === 'mutual') {
    return (
      <MutualPopup
        nameA={nameOf(uid)}
        colorA={playerColorVar(roomPlayers, uid)}
        textColorA={playerColorTextVar(roomPlayers, uid)}
        nameB={nameOf(entry.uid)}
        colorB={playerColorVar(roomPlayers, entry.uid)}
        textColorB={playerColorTextVar(roomPlayers, entry.uid)}
        score={entry.score}
        t={t}
        reducedMotion={reducedMotion}
        onContinue={onContinue}
      />
    )
  }
  return (
    <OneSidedPopup
      myName={nameOf(uid)}
      theirName={nameOf(entry.uid)}
      theirColor={playerColorVar(roomPlayers, entry.uid)}
      theirTextColor={playerColorTextVar(roomPlayers, entry.uid)}
      t={t}
      reducedMotion={reducedMotion}
      onContinue={onContinue}
    />
  )
}

function GroupResults({ code, players, isHost, results, lang, t }) {
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)
  const nameOf = (id) => players.find((p) => p.uid === id)?.name ?? id
  const join = (names) => names.map(nameOf).join(lang === 'zh-HK' ? '、' : ', ')
  const joinPairs = (pairs) =>
    pairs.map((p) => `${nameOf(p.a)} / ${nameOf(p.b)}`).join(lang === 'zh-HK' ? '、' : ', ')
  const range = scoreRangeFor(players.length, results.groupTitle)
  const [date] = useState(() => new Date().toISOString().slice(0, 10).replace(/-/g, '.'))

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
      <h1 id="results-title" className="sr-only">{t('results.groupScoreLabel')}</h1>
      <AwardCertificate
        names={players.map((p) => p.name)}
        score={results.groupScore ?? t('game.noScore')}
        scoreRange={range ? `${range.min}–${range.max}` : null}
        titleText={results.groupTitle ? t(`results.titles.${results.groupTitle}`) : ''}
        roomCode={code}
        date={date}
        t={t}
      />

      <ul className="award-list">
        {results.awards.bestMatch && (
          <li>
            <AwardRow
              label={t('results.awards.bestMatch')}
              labelColor="var(--color-player-pink)"
              winner={joinPairs(results.awards.bestMatch)}
              stat={results.awards.bestMatch[0].score}
              rotate={-0.6}
            />
          </li>
        )}
        {results.awards.parallelLines && (
          <li>
            <AwardRow
              label={t('results.awards.parallelLines')}
              labelColor="#b7c9ec"
              winner={joinPairs(results.awards.parallelLines)}
              stat={results.awards.parallelLines[0].score}
              rotate={0.5}
            />
          </li>
        )}
        {results.awards.soleOutlier && (
          <li>
            <AwardRow
              label={t('results.awards.soleOutlier')}
              labelColor="var(--color-player-orange)"
              winner={join(results.awards.soleOutlier.uids)}
              stat={t('results.awards.timesSuffix', { count: results.awards.soleOutlier.count })}
              statIsCaption
              rotate={-0.5}
            />
          </li>
        )}
        {results.awards.voiceOfPeople && (
          <li>
            <AwardRow
              label={t('results.awards.voiceOfPeople')}
              labelColor="#8fd0a6"
              winner={join(results.awards.voiceOfPeople.uids)}
              stat={t('results.awards.timesSuffix', { count: results.awards.voiceOfPeople.count })}
              statIsCaption
              rotate={0.6}
            />
          </li>
        )}
      </ul>

      {isHost ? (
        <Button variant="primary" disabled={starting} onClick={handlePlayAgain}>
          {t('results.playAgain')}
        </Button>
      ) : (
        <p className="hint">{t('results.waitingPlayAgain')}</p>
      )}
      {error && <p className="error" role="alert">{t(`errors.${error}`)}</p>}
    </section>
  )
}
