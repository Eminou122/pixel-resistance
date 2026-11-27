import { ArrowLeft, Lightbulb } from 'lucide-react'
import { m } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { HINT_COST, POINTS, missions, type Quality } from '../game/content.ts'
import { allMissionsDone, coins, maxScore, missionUnlocked, type Reward } from '../game/progress.ts'
import { play } from '../game/sound.ts'
import { useGame } from '../game/store.ts'
import { EnemySprite } from '../sprites.tsx'
import { Confetti, PixelButton, PixelCard, PixelDialog, PixelLink, PixelProgressBar } from '../ui.tsx'
import { Stars } from './MissionsPage.tsx'

const VERDICT_COLOR: Record<Quality, string> = { best: '#63B75D', ok: '#F5C451', bad: '#E84855' }

export function MissionPlayPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const mission = missions.find((mi) => mi.id === id)
  const progress = useGame((s) => s.progress)

  if (!mission || !missionUnlocked(progress, mission.id)) {
    return (
      <PixelCard className="mx-auto max-w-lg p-6 text-center">
        <p className="font-pixel text-xs leading-relaxed">{mission ? t('missions.lockedHint') : t('missions.notFound')}</p>
        <PixelLink to={`/missions`} className="mt-5">
          {t('nav.missions')}
        </PixelLink>
      </PixelCard>
    )
  }
  // A fresh component per mission resets all play state when navigating to the next one.
  return <Play key={mission.id} missionId={mission.id} />
}

function Play({ missionId }: { missionId: (typeof missions)[number]['id'] }) {
  const { t } = useTranslation()
  const mission = missions.find((mi) => mi.id === missionId)!
  const progress = useGame((s) => s.progress)
  const complete = useGame((s) => s.completeMission)
  const spend = useGame((s) => s.spend)

  const [phase, setPhase] = useState<'intro' | 'question' | 'result'>('intro')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Quality[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const [removed, setRemoved] = useState<string | null>(null)
  const [hintNote, setHintNote] = useState('')
  const [reward, setReward] = useState<Reward | null>(null)
  const [attempt, setAttempt] = useState(0)

  const question = mission.questions[step]!
  const base = `missions.${mission.id}`
  const qBase = `${base}.q.${question.id}`
  const pickedOption = question.options.find((o) => o.id === picked)
  const bestOption = question.options.find((o) => o.quality === 'best')!
  const last = step === mission.questions.length - 1

  const choose = (optionId: string) => {
    if (picked || optionId === removed) return
    const option = question.options.find((o) => o.id === optionId)!
    setPicked(optionId)
    setAnswers((a) => [...a, option.quality])
    play(option.quality === 'best' ? 'good' : option.quality === 'ok' ? 'ok' : 'bad')
  }

  const hint = () => {
    if (removed || picked) return
    if (!spend(HINT_COST)) return setHintNote(t('play.hintPoor'))
    const weak = question.options.find((o) => o.quality === 'bad')!
    setRemoved(weak.id)
    setHintNote(t('play.hintUsed'))
    play('coin')
  }

  const next = () => {
    if (last) {
      const result = complete(mission.id, answers)
      setReward(result)
      setPhase('result')
      play(result.stars === 3 ? 'victory' : 'good')
      return
    }
    setStep((s) => s + 1)
    setPicked(null)
    setRemoved(null)
    setHintNote('')
  }

  const restart = () => {
    setPhase('intro')
    setStep(0)
    setAnswers([])
    setPicked(null)
    setRemoved(null)
    setHintNote('')
    setReward(null)
    setAttempt((n) => n + 1)
  }

  // Letter keys answer the current question.
  useEffect(() => {
    if (phase !== 'question' || picked) return
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || (event.target as HTMLElement).closest('dialog')) return
      const option = question.options['abcd'.indexOf(event.key.toLowerCase())]
      if (option) choose(option.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const nextMission = missions[missions.findIndex((mi) => mi.id === mission.id) + 1]

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <PixelLink to={`/missions`} tone="ghost" small>
          <ArrowLeft aria-hidden="true" className="size-4" /> {t('play.quit')}
        </PixelLink>
        {phase === 'question' && (
          <p className="font-pixel text-[0.6rem] text-px-cream">{t('play.question', { n: step + 1, total: mission.questions.length })}</p>
        )}
      </div>

      <h1 className="font-pixel mb-5 text-sm leading-relaxed text-px-gold sm:text-lg">{t(`${base}.title`)}</h1>

      {phase === 'intro' && (
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <PixelDialog name={t(`enemies.${mission.enemy}.name`)} role={t(`enemies.${mission.enemy}.threat`)} portrait={<EnemySprite id={mission.enemy} />} text={t(`${base}.intro`)} />
          <PixelCard className="p-5">
            <p className="font-pixel text-[0.6rem] text-px-red-dark">{t('play.objective')}</p>
            <p className="mt-2 text-lg font-semibold">{t(`${base}.objective`)}</p>
          </PixelCard>
          <PixelButton tone="red" onClick={() => setPhase('question')} autoFocus>
            ▶ {t('play.start')}
          </PixelButton>
        </m.div>
      )}

      {phase === 'question' && (
        <m.div key={`${attempt}-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <PixelProgressBar value={(step + (picked ? 1 : 0)) / mission.questions.length} label={t('play.question', { n: step + 1, total: mission.questions.length })} color="#E84855" />
          <PixelCard className="p-5">
            <h2 className="text-lg leading-snug font-bold sm:text-xl">{t(`${qBase}.prompt`)}</h2>
          </PixelCard>

          <ul className="space-y-3" aria-label={t('play.keys')}>
            {question.options.map((option, i) => {
              const isPicked = option.id === picked
              const isRemoved = option.id === removed
              const reveal = picked && (isPicked || option.quality === 'best')
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    disabled={Boolean(picked) || isRemoved}
                    onClick={() => choose(option.id)}
                    className={`px-frame flex w-full items-start gap-3 p-4 text-left transition-colors ${
                      isRemoved ? 'bg-px-night/60 text-px-cream/40 line-through' : picked ? 'bg-px-night text-px-cream' : 'bg-px-night text-px-cream hover:bg-px-blue-dark'
                    }`}
                    style={reveal ? { ['--frame' as string]: VERDICT_COLOR[option.quality] } : undefined}
                    aria-describedby={isRemoved ? `removed-${option.id}` : undefined}
                  >
                    <span className="font-pixel flex size-8 shrink-0 items-center justify-center bg-px-gold text-[0.65rem] text-px-ink" aria-hidden="true">
                      {'ABCD'[i]}
                    </span>
                    <span className="text-[0.98rem] leading-relaxed">{t(`${qBase}.o.${option.id}.label`)}</span>
                    {isRemoved && (
                      <span id={`removed-${option.id}`} className="sr-only">
                        {t('play.removed')}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          {!picked && (
            <div className="flex flex-wrap items-center gap-3">
              <PixelButton tone="ghost" small onClick={hint} disabled={Boolean(removed) || coins(progress) < HINT_COST}>
                <Lightbulb aria-hidden="true" className="size-4" /> {t('play.hint', { cost: HINT_COST })}
              </PixelButton>
              <p className="font-retro text-lg text-px-cream/80" aria-live="polite">
                {hintNote || (coins(progress) < HINT_COST && !removed ? t('play.hintPoor') : t('play.keys'))}
              </p>
            </div>
          )}

          {pickedOption && (
            <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
              <PixelCard className="space-y-4 p-5">
                <p className="font-pixel text-xs leading-relaxed" style={{ color: pickedOption.quality === 'ok' ? '#8A6510' : pickedOption.quality === 'best' ? '#2E6B2A' : '#B82E3A' }}>
                  {t(`play.verdict.${pickedOption.quality}`)} (+{POINTS[pickedOption.quality]})
                </p>
                <div>
                  <p className="text-sm font-bold uppercase">{t('play.yourChoice')}</p>
                  <p className="mt-1 leading-relaxed">{t(`${qBase}.o.${pickedOption.id}.why`)}</p>
                </div>
                {pickedOption.quality !== 'best' && (
                  <div className="border-t-4 border-dashed border-px-ink/20 pt-4">
                    <p className="text-sm font-bold uppercase">{t('play.bestChoice')}</p>
                    <p className="mt-1 font-semibold">{t(`${qBase}.o.${bestOption.id}.label`)}</p>
                    <p className="mt-1 leading-relaxed">{t(`${qBase}.o.${bestOption.id}.why`)}</p>
                  </div>
                )}
                <PixelButton tone={last ? 'red' : 'gold'} onClick={next} autoFocus>
                  {last ? t('play.finish') : t('common.next')} ▶
                </PixelButton>
              </PixelCard>
            </m.div>
          )}
        </m.div>
      )}

      {phase === 'result' && reward && (
        <m.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
          {(reward.firstClear || reward.newBest) && <Confetti />}
          <PixelCard className="space-y-4 p-6 text-center">
            <div className="mx-auto w-20 opacity-40 grayscale">
              <EnemySprite id={mission.enemy} />
            </div>
            <h2 className="font-pixel text-sm text-px-red-dark sm:text-base">{t('play.resultTitle')}</h2>
            <div className="flex justify-center [&_svg]:size-8">
              <Stars count={reward.stars} label={`${reward.stars}/3`} />
            </div>
            <p className="font-pixel text-xs">{t('play.score', { score: reward.score, max: maxScore(mission.id) })}</p>
            {reward.firstClear ? (
              <p className="font-pixel text-[0.6rem] text-[#2E6B2A]">{t('play.firstClear')}</p>
            ) : reward.newBest ? (
              <p className="font-pixel text-[0.6rem] text-[#2E6B2A]">{t('play.newBest')}</p>
            ) : (
              <p className="text-sm">{t('play.noGain')}</p>
            )}
            <p className="font-retro text-2xl">{t('play.gained', { xp: reward.xp, coins: reward.coins })}</p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {allMissionsDone(progress) ? (
                <PixelLink to={`/victoire`} tone="red" autoFocus>
                  ★ {t('play.toVictory')}
                </PixelLink>
              ) : (
                nextMission &&
                missionUnlocked(progress, nextMission.id) && (
                  <PixelLink to={`/missions/${nextMission.id}`} tone="red" autoFocus>
                    {t('play.nextMission')} ▶
                  </PixelLink>
                )
              )}
              <PixelButton tone="blue" onClick={restart}>
                {t('play.replay')}
              </PixelButton>
              <PixelLink to={`/village`} tone="cream">
                {t('play.toVillage')}
              </PixelLink>
            </div>
          </PixelCard>
        </m.div>
      )}
    </div>
  )
}
