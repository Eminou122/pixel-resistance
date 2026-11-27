import { Check, Lock, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { missions, type Mission } from '../game/content.ts'
import { maxScore, missionUnlocked, stars } from '../game/progress.ts'
import { useGame } from '../game/store.ts'
import { EnemySprite } from '../sprites.tsx'
import { PixelBadge, PixelLink, SectionTitle } from '../ui.tsx'

export function MissionsPage() {
  const { t } = useTranslation()
  return (
    <div>
      <SectionTitle sub={t('missions.intro')}>{t('missions.title')}</SectionTitle>
      <ol className="grid gap-5 md:grid-cols-2">
        {missions.map((mission, i) => (
          <li key={mission.id}>
            <MissionCard mission={mission} index={i + 1} />
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Stars({ count, label }: { count: number; label: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3].map((n) => (
        <Star key={n} aria-hidden="true" className={`size-4 ${n <= count ? 'fill-px-gold text-px-ink' : 'text-px-ink/30'}`} />
      ))}
    </span>
  )
}

export function MissionCard({ mission, index }: { mission: Mission; index: number }) {
  const { t } = useTranslation()
  const progress = useGame((s) => s.progress)
  const record = progress.missions[mission.id]
  const unlocked = missionUnlocked(progress, mission.id)
  const count = record ? stars(mission.id, record.best) : 0

  return (
    <article className="px-frame px-card flex h-full flex-col gap-4 p-5">
      <div className="flex items-start gap-4">
        <div className={`flex size-16 shrink-0 items-center justify-center bg-px-navy p-2 ${unlocked ? '' : 'grayscale'}`}>
          {unlocked ? <EnemySprite id={mission.enemy} /> : <Lock aria-hidden="true" className="size-6 text-px-cream" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-pixel text-[0.55rem] text-px-red-dark">#{index}</p>
          <h2 className="font-pixel mt-1 text-xs leading-relaxed sm:text-sm">{t(`missions.${mission.id}.title`)}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {record ? (
              <PixelBadge color="#63B75D">
                <Check aria-hidden="true" className="size-3" /> {t('missions.status.done')}
              </PixelBadge>
            ) : unlocked ? (
              <PixelBadge>{t('missions.status.available')}</PixelBadge>
            ) : (
              <PixelBadge color="#9AA3B5">{t('missions.status.locked')}</PixelBadge>
            )}
            {record && <Stars count={count} label={`${count}/3`} />}
          </div>
        </div>
      </div>

      <p className="flex-1 text-[0.95rem] leading-relaxed">{unlocked ? t(`missions.${mission.id}.objective`) : t('missions.lockedHint')}</p>

      {record && (
        <p className="font-retro text-lg leading-none text-px-ink/80">
          {t('missions.best', { score: record.best, max: maxScore(mission.id) })} · {t('missions.attempts', { count: record.attempts })}
        </p>
      )}

      {unlocked && (
        <PixelLink to={`/missions/${mission.id}`} tone={record ? 'blue' : 'red'} className="self-start">
          {record ? t('missions.replay') : `▶ ${t('missions.play')}`}
        </PixelLink>
      )}
    </article>
  )
}
