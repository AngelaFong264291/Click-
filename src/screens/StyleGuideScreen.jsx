import { useState } from 'react'
import LanguageToggle from '../components/LanguageToggle.jsx'
import AwardCertificate from '../components/design/AwardCertificate.jsx'
import AwardRow from '../components/design/AwardRow.jsx'
import Button from '../components/design/Button.jsx'
import ClownSticker from '../components/design/ClownSticker.jsx'
import CountdownTimer from '../components/design/CountdownTimer.jsx'
import GuessLayout from '../components/design/GuessLayout.jsx'
import HourPicker from '../components/design/HourPicker.jsx'
import MatchingLines from '../components/design/MatchingLines.jsx'
import { MindMeldNote, MutualPopup, OneSidedPopup } from '../components/design/Popups.jsx'
import PlayerPolaroid from '../components/design/PlayerPolaroid.jsx'
import { Avatar, HostTag, PlayerCard, PlayerPill } from '../components/design/PlayerTag.jsx'
import RankingList from '../components/design/RankingList.jsx'
import AnswerOption from '../components/design/AnswerOption.jsx'
import { CodeDigitInputs, RoomCodeCard } from '../components/design/RoomCodeBlock.jsx'
import SliderControl from '../components/design/SliderControl.jsx'
import { ThermometerBar, ThermometerBox } from '../components/design/Thermometer.jsx'
import WhiteboardCard from '../components/design/WhiteboardCard.jsx'
import { useLanguage } from '../i18n/useLanguage.js'
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js'

const GROUPS = [
  { key: 'red', color: 'var(--color-player-red)', text: 'var(--color-player-red-text)', safeText: 'var(--color-player-red-text-safe)' },
  { key: 'orange', color: 'var(--color-player-orange)', text: 'var(--color-player-orange-text)' },
  { key: 'yellow', color: 'var(--color-player-yellow)', text: 'var(--color-player-yellow-text)' },
  { key: 'green', color: 'var(--color-player-green)', text: 'var(--color-player-green-text)', safeText: 'var(--color-player-green-text-safe)' },
  { key: 'blue', color: 'var(--color-player-blue)', text: 'var(--color-player-blue-text)' },
  { key: 'pink', color: 'var(--color-player-pink)', text: 'var(--color-player-pink-text)' },
]

const BASE_SWATCHES = [
  { label: '大花紙 paper', varName: '--color-paper' },
  { label: '卡紙 cardstock', varName: '--color-cardstock' },
  { label: '白板 whiteboard', varName: '--color-whiteboard', textColor: 'var(--color-ink)' },
  { label: 'Marker 黑 ink', varName: '--color-ink', textColor: 'var(--color-paper-white)' },
  { label: '熒光黃 highlight', varName: '--color-highlight' },
  { label: '白板藍 question', varName: '--color-question-text', textColor: 'var(--color-paper-white)' },
  { label: '批改紅 grading', varName: '--color-grading-red', textColor: 'var(--color-paper-white)' },
]

export default function StyleGuideScreen() {
  const { lang, t } = useLanguage()
  const reducedMotion = usePrefersReducedMotion()
  const language = lang === 'zh-HK' ? 'zh' : 'en'

  const [sliderValue, setSliderValue] = useState(7)
  const [hour24, setHour24] = useState(19)
  const nightHours = [21, 22, 23, 0, 1, 2, 3, 4]
  const [hourRange, setHourRange] = useState(23)
  const connections = [
    { itemIndex: 0, adjectiveIndex: 0, auto: false },
    { itemIndex: 1, adjectiveIndex: 1, auto: false },
    { itemIndex: 2, adjectiveIndex: 2, auto: true },
  ]
  const [rankingItems, setRankingItems] = useState([
    t('design.sample.rankingItems0'),
    t('design.sample.rankingItems1'),
    t('design.sample.rankingItems2'),
    t('design.sample.rankingItems3'),
  ])
  const [guessSelected, setGuessSelected] = useState(1)
  const [showMutual, setShowMutual] = useState(false)
  const [showOneSided, setShowOneSided] = useState(false)

  function moveItem(from, to) {
    setRankingItems((items) => {
      const next = [...items]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  const options = [
    t('design.sample.options0'),
    t('design.sample.options1'),
    t('design.sample.options2'),
    t('design.sample.options3'),
  ]

  return (
    <div className="ds-guide ds-reset">
      <div className="ds-guide__header">
        <div>
          <div className="ds-guide__title">{t('design.pageTitle')}</div>
          <p style={{ margin: 0, color: 'var(--color-ink-muted)' }}>{t('design.pageSubtitle')}</p>
        </div>
        <LanguageToggle />
      </div>

      {/* ── Tokens ── */}
      <section>
        <h2>1. Tokens</h2>
        <h3>底色 Base colors</h3>
        <div className="ds-guide__grid">
          {BASE_SWATCHES.map((s) => (
            <div key={s.varName}>
              <div className="ds-swatch" style={{ background: `var(${s.varName})`, color: s.textColor ?? 'var(--color-ink)' }}>
                {s.label}
              </div>
              <div className="ds-swatch-label">{s.varName}</div>
            </div>
          ))}
        </div>

        <h3>六個組色 Player / question-type colors</h3>
        <div className="ds-guide__grid">
          {GROUPS.map((g) => (
            <div key={g.key}>
              <div className="ds-swatch" style={{ background: g.color, color: g.text }}>
                {g.key}
              </div>
              <div className="ds-swatch-label">{g.color.replace('var(', '').replace(')', '')}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-ink-muted)', maxWidth: 520 }}>
          紅／綠底配細隻白字（細過 18.66px 粗體，例如名牌縮寫、題型標籤）對比未夠 AA，細字場合改用
          <code> --color-player-red-text-safe</code> / <code>--color-player-green-text-safe</code>；大色塊／粗體標題用返原色已經過 AA。
        </p>
        <div className="ds-guide__row" style={{ marginTop: 'var(--space-2)' }}>
          <div className="ds-swatch" style={{ background: 'var(--color-player-red-text-safe)', color: 'var(--color-paper-white)', width: 160 }}>
            small-text safe red
          </div>
          <div className="ds-swatch" style={{ background: 'var(--color-player-green-text-safe)', color: 'var(--color-paper-white)', width: 160 }}>
            small-text safe green
          </div>
        </div>

        <h3>字體 Fonts</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ borderBottom: 'var(--border-dashed-muted)', paddingBottom: 'var(--space-2)' }}>
            <span style={{ fontFamily: 'var(--font-black)', fontWeight: 900, fontSize: 'var(--text-display-sm)' }}>夾唔夾 Do We Click?</span>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-ink-muted)' }}>--font-black · Noto Sans TC 900</div>
          </div>
          <div style={{ borderBottom: 'var(--border-dashed-muted)', paddingBottom: 'var(--space-2)' }}>
            <span style={{ fontFamily: 'var(--font-hand)', fontSize: 'var(--text-heading)' }}>拉埋班朋友答十條題 — answer ten questions together</span>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-ink-muted)' }}>--font-hand · LXGW WenKai TC 400/700</div>
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-marker)', fontSize: 'var(--text-display)' }}>78 · 4827</span>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-ink-muted)' }}>--font-marker · Permanent Marker 400</div>
          </div>
        </div>

        <h3>歪角邊框 / 陰影 Wobble radius + shadows</h3>
        <div className="ds-guide__row">
          {['--radius-card-a', '--radius-card-b', '--radius-card-c', '--radius-card-d'].map((r) => (
            <div key={r} style={{ width: 90, height: 60, background: 'var(--color-paper-white)', border: 'var(--border-thick)', borderRadius: `var(${r})` }} />
          ))}
          <div style={{ width: 120, height: 60, background: 'var(--color-highlight)', border: 'var(--border-thick)', borderRadius: 'var(--radius-button)', boxShadow: 'var(--shadow-md)' }} />
        </div>
      </section>

      {/* ── Buttons ── */}
      <section>
        <h2>2. Buttons</h2>
        <div className="ds-guide__row">
          <Button variant="primary">{t('room.start')}</Button>
          <Button variant="secondary">{t('room.leave')}</Button>
          <Button variant="primary" pressed>
            pressed
          </Button>
          <Button variant="primary" disabled>
            disabled
          </Button>
        </div>
        <div className="ds-guide__dark" style={{ marginTop: 'var(--space-3)' }}>
          <Button variant="outline">{t('results.seeResults')}</Button>
        </div>
      </section>

      {/* ── Whiteboard card + answer options ── */}
      <section>
        <h2>3. Whiteboard question card + answer options</h2>
        <WhiteboardCard tagLabel={t('design.questionTypes.choice')} tagColor="var(--color-player-yellow)" theme={t('design.sample.choiceTheme')} question={t('design.sample.choiceQuestion')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <AnswerOption letter="A" label={options[0]} state="selected" />
          <AnswerOption letter="B" label={options[1]} state="default" />
          <AnswerOption letter="C" label={options[2]} state="notChosen" />
          <AnswerOption letter="D" label={options[3]} state="disabled" />
        </div>
        <h3>揭曉 reveal states</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <AnswerOption letter="A" label={`${options[0]} — consensus`} state="consensus" />
          <AnswerOption letter="B" label={`${options[1]} — timed out`} state="timedOut" />
        </div>
      </section>

      {/* ── Slider ── */}
      <section>
        <h2>4. Slider</h2>
        <WhiteboardCard tagLabel={t('design.questionTypes.slider')} tagColor="var(--color-player-orange)" question={t('design.sample.sliderQuestion')} />
        <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
          <div className="ds-slider__readout-value">{sliderValue}</div>
        </div>
        <SliderControl value={sliderValue} onChange={setSliderValue} lowLabel="0" highLabel="10" t={t} />
      </section>

      {/* ── Hour picker ── */}
      <section>
        <h2>5. Hour picker</h2>
        <h3>全日 24 粒（真鐘面） — full day, 24 buttons</h3>
        <HourPicker selected={hour24} onSelect={setHour24} />
        <h3>跨午夜嘅範圍：21,22,23,0,1,2,3,4（8 粒） — a range crossing midnight, 8 buttons</h3>
        <HourPicker hours={nightHours} selected={hourRange} onSelect={setHourRange} />
      </section>

      {/* ── Matching ── */}
      <section>
        <h2>6. Matching</h2>
        <WhiteboardCard tagLabel={t('design.questionTypes.matching')} tagColor="var(--color-player-pink)" question={t('design.sample.matchingQuestion')} />
        <div style={{ marginTop: 'var(--space-4)' }}>
          <MatchingLines
            items={[t('design.sample.items0'), t('design.sample.items1'), t('design.sample.items2')]}
            adjectives={[t('design.sample.adjectives0'), t('design.sample.adjectives1'), t('design.sample.adjectives2')]}
            connections={connections}
          />
        </div>
      </section>

      {/* ── Ranking ── */}
      <section>
        <h2>7. Ranking</h2>
        <WhiteboardCard tagLabel={t('design.questionTypes.ranking')} tagColor="var(--color-player-green)" theme={t('design.sample.rankingTheme')} question={t('design.sample.rankingQuestion')} />
        <div style={{ marginTop: 'var(--space-4)' }}>
          <RankingList
            items={rankingItems}
            activeIndex={1}
            onMoveUp={(i) => i > 0 && moveItem(i, i - 1)}
            onMoveDown={(i) => i < rankingItems.length - 1 && moveItem(i, i + 1)}
            t={t}
          />
        </div>
      </section>

      {/* ── Guess ── */}
      <section>
        <h2>8. Guess-a-friend</h2>
        <WhiteboardCard tagLabel={t('design.questionTypes.guess')} tagColor="var(--color-player-red)" question={t('design.sample.guessQuestion', { name: 'Kelvin' })} />
        <div style={{ marginTop: 'var(--space-4)' }}>
          <GuessLayout
            targetName="Kelvin"
            targetInitial="K"
            targetColor="var(--color-player-green)"
            options={options}
            selectedIndex={guessSelected}
            hintLabel={t('design.poster.myGuessHint')}
            onSelect={setGuessSelected}
          />
        </div>
      </section>

      {/* ── Player tags ── */}
      <section>
        <h2>9. Player tags</h2>
        <h3>名牌貼紙 Lobby sticker</h3>
        <div className="ds-guide__row">
          <PlayerCard name="Kelvin" color="var(--color-player-green)" textColor="var(--color-player-green-text)" isHost isYou rotate={-2} t={t} />
          <PlayerCard name="阿珊" color="var(--color-player-red)" textColor="var(--color-player-red-text)" rotate={1.5} t={t} />
          <PlayerCard name="阿May" color="var(--color-player-pink)" textColor="var(--color-player-pink-text)" outlierBadge rotate={-1.5} t={t} />
          <PlayerCard name="阿明" color="var(--color-player-blue)" textColor="var(--color-player-blue-text)" left rotate={2.5} t={t} />
        </div>
        <h3>揭曉細 pill Reveal pill</h3>
        <div className="ds-guide__row">
          <PlayerPill name="Kelvin" color="var(--color-player-green)" textColor="var(--color-player-green-text)" t={t} />
          <PlayerPill name="阿May" color="var(--color-player-pink)" textColor="var(--color-player-pink-text)" outlierBadge t={t} />
          <PlayerPill name="阿明" color="var(--color-player-blue)" textColor="var(--color-player-blue-text)" left t={t} />
        </div>
        <h3>頭像狀態 Avatar states</h3>
        <div className="ds-guide__row" style={{ alignItems: 'center' }}>
          <Avatar initial="K" color="var(--color-player-green)" state="answered" />
          <Avatar initial="明" color="var(--color-player-blue)" state="waiting" />
          <Avatar initial="May" color="var(--color-player-pink)" state="left" />
          <HostTag t={t} />
          <ClownSticker label={t('game.soleOutlierBadge')} />
        </div>
      </section>

      {/* ── Countdown / thermometer / room code ── */}
      <section>
        <h2>10. Countdown, thermometer, room code</h2>
        <div className="ds-guide__row" style={{ alignItems: 'center' }}>
          <CountdownTimer seconds={7} total={10} label={t('game.countdown', { seconds: 7 })} />
          <CountdownTimer seconds={1} total={10} label={t('game.countdown', { seconds: 1 })} />
        </div>
        <h3>溫度計 Thermometer</h3>
        <ThermometerBar value={84} count={5} t={t} />
        <div style={{ marginTop: 'var(--space-3)' }}>
          <ThermometerBox value={82} count={5} t={t} />
        </div>
        <h3>房號 / 分享連結 Room code</h3>
        <RoomCodeCard code="4827" link="…github.io/jaap/#4827" round={1} t={t} />
        <div style={{ marginTop: 'var(--space-3)' }}>
          <CodeDigitInputs value={['4', '8', '', '']} t={t} />
        </div>
      </section>

      {/* ── Popups ── */}
      <section>
        <h2>11. Mid-game moments &amp; popups</h2>
        <h3>心靈相通 Mind Meld note</h3>
        <div style={{ maxWidth: 260 }}>
          <MindMeldNote a="Kelvin" b="阿珊" streak={3} t={t} />
        </div>
        <h3>雙向奔赴 / 單戀 — full screen (preview)</h3>
        <div className="ds-guide__row">
          <Button variant="primary" onClick={() => setShowMutual(true)}>
            {t('results.mutualFirst')}
          </Button>
          <Button variant="secondary" onClick={() => setShowOneSided(true)}>
            {t('results.oneSided')}
          </Button>
        </div>
        {showMutual && (
          <div style={{ marginTop: 'var(--space-4)', maxWidth: 420 }}>
            <MutualPopup
              nameA="Kelvin"
              colorA="var(--color-player-green)"
              textColorA="var(--color-player-green-text)"
              nameB="阿珊"
              colorB="var(--color-player-red)"
              textColorB="var(--color-player-red-text)"
              score={82}
              t={t}
              reducedMotion={reducedMotion}
              onContinue={() => setShowMutual(false)}
            />
          </div>
        )}
        {showOneSided && (
          <div style={{ marginTop: 'var(--space-4)', maxWidth: 420 }}>
            <OneSidedPopup
              myName={t('room.you')}
              theirName="阿明"
              theirColor="var(--color-player-blue)"
              theirTextColor="var(--color-player-blue-text)"
              t={t}
              reducedMotion={reducedMotion}
              onContinue={() => setShowOneSided(false)}
            />
          </div>
        )}
      </section>

      {/* ── Results ── */}
      <section>
        <h2>12. Results: awards, certificate, polaroid</h2>
        <div style={{ maxWidth: 400 }}>
          <AwardCertificate names={['Kelvin', '阿珊', '阿明', '阿May']} score={78} scoreRange="70–89" titleText={t('results.titles.oldFriends')} roomCode="4827" date="2026.11.09" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)', maxWidth: 400 }}>
          <AwardRow label={t('results.awards.bestMatch')} labelColor="var(--color-player-pink)" winner="阿珊 × Kelvin" stat={82} rotate={-0.8} />
          <AwardRow label={t('results.awards.parallelLines')} labelColor="#b7c9ec" winner="阿明 × 阿May" stat={24} rotate={0.6} />
          <AwardRow label={t('results.awards.soleOutlier')} labelColor="var(--color-player-orange)" winner="阿May" stat={t('results.awards.timesSuffix', { count: 4 })} statIsCaption rotate={-0.5} />
          <AwardRow label={t('results.awards.voiceOfPeople')} labelColor="#8fd0a6" winner="Kelvin" stat={t('results.awards.timesSuffix', { count: 7 })} statIsCaption rotate={0.9} />
        </div>
        <div className="ds-guide__row" style={{ marginTop: 'var(--space-4)' }}>
          <PlayerPolaroid initial="K" name="Kelvin" color="var(--color-player-green)" textColor="var(--color-player-green-text)" rotate={-6} />
          <PlayerPolaroid initial="珊" name="阿珊" color="var(--color-player-red)" textColor="var(--color-player-red-text)" rotate={4} />
        </div>
      </section>

      {/* ── night / dark screens for contrast check ── */}
      <section>
        <h2>13. Dark screens (默契排名 night mode, 單戀 dark mode)</h2>
        <div className="ds-guide__dark">
          <p style={{ margin: 0 }}>{t('results.rankingTitle')}</p>
          <p style={{ color: 'var(--color-night-text-muted)', margin: '4px 0 0' }}>{t('results.rankRow', { rank: 2, name: '阿明', score: 65 })}</p>
        </div>
      </section>

      <p style={{ color: 'var(--color-ink-muted)', fontSize: 'var(--text-caption)' }}>{t('design.devOnlyHint')} — {language}</p>
    </div>
  )
}
