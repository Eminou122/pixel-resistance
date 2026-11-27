import { Skull } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { enemies, type Enemy } from '../game/content.ts'
import { useGame } from '../game/store.ts'
import { list } from '../i18n.ts'
import { EnemySprite } from '../sprites.tsx'
import { PixelBadge, PixelLink, PixelModal, SectionTitle } from '../ui.tsx'

export function EnemiesPage() {
  const { t } = useTranslation()
  const read = useGame((s) => s.progress.enemies)
  const discover = useGame((s) => s.discover)
  const [open, setOpen] = useState<Enemy | null>(null)

  const show = (enemy: Enemy) => {
    setOpen(enemy)
    discover('enemies', enemy.id)
  }

  return (
    <div>
      <SectionTitle sub={t('enemies.intro')}>{t('enemies.title')}</SectionTitle>
      <p className="font-pixel mb-5 text-[0.6rem] text-px-cream">{t('enemies.discovered', { count: read.length, total: enemies.length })}</p>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enemies.map((enemy) => {
          const seen = read.includes(enemy.id)
          return (
            <li key={enemy.id}>
              <button type="button" onClick={() => show(enemy)} className="px-frame px-card group flex h-full w-full flex-col gap-3 p-4 text-left hover:bg-white">
                <div className="flex items-center gap-4">
                  <div className="flex size-20 shrink-0 items-center justify-center bg-px-navy p-2">
                    <EnemySprite id={enemy.id} className={`px-bob ${seen ? '' : 'brightness-0 invert-[.35]'}`} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-pixel text-[0.65rem] leading-relaxed">{t(`enemies.${enemy.id}.name`)}</h2>
                    <p className="mt-1 text-sm font-semibold text-px-red-dark">{t(`enemies.${enemy.id}.threat`)}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <Danger level={enemy.danger} />
                  {!seen && <PixelBadge>{t('common.new')}</PixelBadge>}
                </div>
                {!seen && <span className="sr-only">{t('enemies.unread')}</span>}
              </button>
            </li>
          )
        })}
      </ul>

      <PixelModal open={open !== null} onClose={() => setOpen(null)} title={open ? `${t(`enemies.${open.id}.name`)} — ${t(`enemies.${open.id}.threat`)}` : ''}>
        {open && <EnemyFile enemy={open} />}
      </PixelModal>
    </div>
  )
}

function Danger({ level }: { level: number }) {
  const { t } = useTranslation()
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`${t('enemies.danger')} ${level}/5`}>
      <span className="font-pixel mr-1 text-[0.5rem]" aria-hidden="true">
        {t('enemies.danger')}
      </span>
      {[1, 2, 3, 4, 5].map((n) => (
        <Skull key={n} aria-hidden="true" className={`size-3.5 ${n <= level ? 'text-px-red-dark' : 'text-px-ink/25'}`} />
      ))}
    </span>
  )
}

function EnemyFile({ enemy }: { enemy: Enemy }) {
  const { t } = useTranslation()
  const base = `enemies.${enemy.id}`
  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <section>
      <h3 className="font-pixel mb-2 text-[0.6rem] text-px-red-dark">{title}</h3>
      {children}
    </section>
  )
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="size-20 shrink-0 bg-px-navy p-2">
          <EnemySprite id={enemy.id} />
        </div>
        <Danger level={enemy.danger} />
      </div>
      <Section title={t('enemies.sections.description')}>
        <p>{t(`${base}.description`)}</p>
      </Section>
      <Section title={t('enemies.sections.example')}>
        <p className="border-l-4 border-px-gold bg-px-gold/15 p-3 italic">{t(`${base}.example`)}</p>
      </Section>
      <Section title={t('enemies.sections.consequences')}>
        <ul className="list-disc space-y-1 pl-5">
          {list(`${base}.consequences`).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>
      <Section title={t('enemies.sections.alternatives')}>
        <ul className="list-disc space-y-1 pl-5">
          {list(`${base}.alternatives`).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>
      <Section title={t('enemies.sections.nuance')}>
        <p className="border-l-4 border-px-blue bg-px-blue/10 p-3">{t(`${base}.nuance`)}</p>
      </Section>
      <Section title={t('enemies.sections.counters')}>
        <div className="flex flex-wrap gap-1">
          {enemy.counters.map((id) => (
            <PixelLink key={id} to={`/atelier#${id}`} tone="green" small>
              {t(`modules.${id}.title`)}
            </PixelLink>
          ))}
        </div>
      </Section>
    </div>
  )
}
