import { m } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { AXES, achievements, missions } from '../game/content.ts'
import { allMissionsDone, axisScores, finalScore, recommendations, xp } from '../game/progress.ts'
import { play } from '../game/sound.ts'
import { useGame } from '../game/store.ts'
import { BuildingSprite, Hero } from '../sprites.tsx'
import { locations } from '../game/content.ts'
import { Confetti, PixelButton, PixelCard, PixelLink, PixelModal, PixelProgressBar } from '../ui.tsx'

const AXIS_COLORS = ['#F08A3C', '#4776D0', '#E84855', '#63B75D', '#F5C451']

export function VictoryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const progress = useGame((s) => s.progress)
  const newGame = useGame((s) => s.newGame)
  const [confirm, setConfirm] = useState(false)
  const won = allMissionsDone(progress)

  useEffect(() => {
    if (won) play('victory')
  }, [won])

  if (!won) {
    return (
      <PixelCard className="mx-auto max-w-lg p-6 text-center">
        <div className="mx-auto mb-4 w-16">
          <BuildingSprite location={locations.find((l) => l.id === 'tower')!} />
        </div>
        <p className="leading-relaxed">{t('victory.locked')}</p>
        <PixelLink to={`/missions`} className="mt-5">
          {t('victory.toMissions')}
        </PixelLink>
      </PixelCard>
    )
  }

  const axes = axisScores(progress)
  const recs = recommendations(progress)
  const tiles: [string, string | number][] = [
    [t('victory.score'), finalScore(progress)],
    [t('victory.missions'), `${missions.length}/${missions.length}`],
    [t('victory.xp'), xp(progress)],
    [t('victory.achievements'), `${Object.keys(progress.achievements).length}/${achievements.length}`],
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <Confetti count={60} />
      <m.header initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }} className="text-center">
        <div className="mx-auto flex w-fit items-end gap-3">
          <span className="w-16 sm:w-20">
            <BuildingSprite location={locations.find((l) => l.id === 'tower')!} freed />
          </span>
          <span className="px-bob w-8 sm:w-10">
            <Hero />
          </span>
        </div>
        <h1 className="px-logo mt-6 text-2xl sm:text-4xl">{t('victory.title')}</h1>
        <p className="font-retro mt-3 text-2xl text-px-cream">{t('victory.subtitle')}</p>
      </m.header>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map(([label, value], i) => (
          <m.div key={label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.1 }} className="px-frame px-card p-4 text-center">
            <dt className="text-xs font-bold uppercase">{label}</dt>
            <dd className="font-pixel mt-2 text-base text-px-red-dark sm:text-lg">{value}</dd>
          </m.div>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <PixelCard className="p-5">
          <h2 className="font-pixel text-xs leading-relaxed">{t('victory.summary')}</h2>
          <p className="mt-2 text-sm">{t('victory.summaryIntro')}</p>
          <ul className="mt-4 space-y-3">
            {AXES.map((axis, i) => (
              <li key={axis}>
                <p className="flex justify-between text-sm font-semibold">
                  <span>{t(`axes.${axis}`)}</span>
                  <span>{Math.round(axes[axis] * 100)} %</span>
                </p>
                <PixelProgressBar value={axes[axis]} color={AXIS_COLORS[i]} label={t(`axes.${axis}`)} />
              </li>
            ))}
          </ul>
        </PixelCard>

        <PixelCard className="p-5">
          <h2 className="font-pixel text-xs leading-relaxed">{t('victory.recs')}</h2>
          {recs.length === 0 ? (
            <p className="mt-4 leading-relaxed">{t('victory.perfect')}</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {recs.slice(0, 3).map((rec) => (
                <li key={rec.axis}>
                  <p className="leading-relaxed">{t(`recs.${rec.axis}`)}</p>
                  <p className="mt-2 text-xs font-bold uppercase">{t('victory.modules')}</p>
                  <div className="flex flex-wrap gap-1">
                    {rec.modules.map((id) => (
                      <PixelLink key={id} to={`/atelier#${id}`} tone="green" small>
                        {t(`modules.${id}.title`)}
                      </PixelLink>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PixelCard>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <PixelLink to={`/missions`} tone="blue">
          {t('victory.replay')}
        </PixelLink>
        <PixelButton tone="red" onClick={() => setConfirm(true)}>
          {t('victory.restart')}
        </PixelButton>
        <PixelLink to="/" tone="cream">
          {t('victory.toMenu')}
        </PixelLink>
      </div>

      <PixelModal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('menu.confirmTitle')}
        actions={
          <PixelButton
            tone="red"
            small
            onClick={() => {
              newGame()
              void navigate(`/village`)
            }}
          >
            {t('menu.confirmYes')}
          </PixelButton>
        }
      >
        <p>{t('menu.confirmText')}</p>
      </PixelModal>
    </div>
  )
}
