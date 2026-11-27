import { Lock, Trophy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { achievements, enemies, locations, missions, modules, npcs, type AchievementId } from '../game/content.ts'
import { allMissionsDone, coins, coinsEarned, finalScore, level, maxScore, xp } from '../game/progress.ts'
import { useGame } from '../game/store.ts'
import { Hero } from '../sprites.tsx'
import { PixelButton, PixelCard, PixelLink, PixelModal, PixelProgressBar, SectionTitle } from '../ui.tsx'

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const progress = useGame((s) => s.progress)
  const reset = useGame((s) => s.reset)
  const [confirm, setConfirm] = useState(false)
  const total = xp(progress)
  const lv = level(total)
  const records = missions.map((m) => progress.missions[m.id]).filter((r) => r !== undefined)

  const stats: [string, string | number][] = [
    [t('profile.score'), finalScore(progress)],
    [t('profile.xp'), total],
    [t('profile.coins'), coins(progress)],
    [t('profile.coinsEarned'), coinsEarned(progress)],
    [t('profile.coinsSpent'), progress.coinsSpent],
    [t('profile.missions'), `${records.length}/${missions.length}`],
    [t('profile.perfect'), missions.filter((m) => progress.missions[m.id]?.best === maxScore(m.id)).length],
    [t('profile.attempts'), records.reduce((sum, r) => sum + r.attempts, 0)],
    [t('profile.enemies'), `${progress.enemies.length}/${enemies.length}`],
    [t('profile.modules'), `${progress.modules.length}/${modules.length}`],
    [t('profile.places'), `${progress.locations.length}/${locations.length}`],
    [t('profile.npcs'), `${progress.npcs.length}/${npcs.length}`],
  ]

  const unlocked = achievements.filter((id) => progress.achievements[id])

  return (
    <div>
      <SectionTitle>{t('profile.title')}</SectionTitle>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <PixelCard dark className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="px-bob w-16">
            <Hero />
          </div>
          <p className="font-pixel text-xs text-px-gold">
            {t('common.level')} {lv.level}
          </p>
          <p className="font-retro text-2xl">{t(`levels.${lv.level}`)}</p>
          <div className="w-full">
            <PixelProgressBar value={lv.ratio} color="#F5C451" label={lv.next === undefined ? t('hud.max') : t('hud.toNext', { xp: lv.next - total, level: lv.level + 1 })} />
            <p className="font-retro mt-1 text-lg text-px-cream/80">
              {lv.next === undefined ? t('hud.max') : t('hud.toNext', { xp: lv.next - total, level: lv.level + 1 })}
            </p>
          </div>
          {allMissionsDone(progress) && (
            <PixelLink to={`/victoire`} tone="red" small>
              ★ {t('profile.victory')}
            </PixelLink>
          )}
        </PixelCard>

        <PixelCard className="p-5">
          <h2 className="font-pixel mb-4 text-xs">{t('profile.stats')}</h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map(([label, value]) => (
              <div key={label} className="bg-px-navy/5 p-3" style={{ boxShadow: 'inset 0 0 0 2px rgb(27 31 46 / 0.15)' }}>
                <dt className="text-xs font-semibold text-px-ink/70 uppercase">{label}</dt>
                <dd className="font-pixel mt-1 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </PixelCard>
      </div>

      <h2 className="font-pixel mt-10 mb-4 text-xs text-px-gold sm:text-sm">
        {t('profile.achievements', { count: unlocked.length, total: achievements.length })}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((id) => (
          <li key={id}>
            <AchievementCard id={id} at={progress.achievements[id]} locale={i18n.resolvedLanguage ?? 'fr'} />
          </li>
        ))}
      </ul>

      <div className="mt-12 border-t-4 border-dashed border-px-cream/15 pt-6">
        <PixelButton tone="red" small onClick={() => setConfirm(true)}>
          {t('profile.reset')}
        </PixelButton>
      </div>

      <PixelModal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('profile.resetTitle')}
        actions={
          <PixelButton
            tone="red"
            small
            onClick={() => {
              reset()
              setConfirm(false)
              void navigate('/')
            }}
          >
            {t('profile.resetYes')}
          </PixelButton>
        }
      >
        <p>{t('profile.resetText')}</p>
      </PixelModal>
    </div>
  )
}

export function AchievementCard({ id, at, locale }: { id: AchievementId; at?: number; locale: string }) {
  const { t } = useTranslation()
  return (
    <div className={`px-frame flex h-full items-start gap-3 p-4 ${at ? 'px-card' : 'px-card--dark opacity-70'}`}>
      <span className={`flex size-10 shrink-0 items-center justify-center ${at ? 'bg-px-gold' : 'bg-px-navy'}`} aria-hidden="true">
        {at ? <Trophy className="size-5 text-px-ink" /> : <Lock className="size-4 text-px-cream/60" />}
      </span>
      <div>
        <p className="font-pixel text-[0.6rem] leading-relaxed">
          {t(`achievements.${id}.name`)}
          {!at && <span className="sr-only"> — {t('profile.lockedAchievement')}</span>}
        </p>
        <p className="mt-1 text-sm">{t(`achievements.${id}.desc`)}</p>
        {at && (
          <p className="font-retro mt-1 text-base text-px-ink/70">
            {t('profile.unlockedOn', { date: new Date(at).toLocaleDateString(locale) })}
          </p>
        )}
      </div>
    </div>
  )
}
