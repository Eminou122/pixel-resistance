import { ExternalLink } from 'lucide-react'
import { m } from 'motion/react'
import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { missions, npcs } from '../game/content.ts'
import { level, xp } from '../game/progress.ts'
import { hasSave, useGame } from '../game/store.ts'
import { list } from '../i18n.ts'
import { BuildingSprite, Hero, NpcSprite, Tree } from '../sprites.tsx'
import { locations } from '../game/content.ts'
import { LanguageSwitcher, PixelButton, PixelDialog, PixelModal, SoundToggle } from '../ui.tsx'

export function MenuPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const progress = useGame((s) => s.progress)
  const newGame = useGame((s) => s.newGame)
  const saved = hasSave(progress)
  const [modal, setModal] = useState<null | 'howto' | 'about' | 'confirm'>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const start = () => {
    newGame()
    void navigate(`/village`)
  }

  /** Arcade-style menu: up/down arrows move between entries. */
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    const next = items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]
    next?.focus()
    event.preventDefault()
  }

  const done = missions.filter((mi) => progress.missions[mi.id]).length

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <Backdrop />

      <div className="relative z-10 flex items-center justify-between gap-3 px-4 pt-4 sm:px-6">
        <a href="https://nird-world.vercel.app" className="font-pixel inline-flex min-h-9 items-center gap-2 text-[0.55rem] text-px-cream/80 hover:text-px-gold">
          <ExternalLink aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">{t('common.backToSite')}</span>
          <span className="sm:hidden">NIRD</span>
        </a>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <SoundToggle />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 pt-10 pb-40 text-center sm:pt-14">
        <m.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
          className="px-logo text-[1.7rem] sm:text-5xl"
        >
          PIXEL
          <br />
          RESISTANCE
        </m.h1>
        <p className="font-pixel mt-5 text-[0.6rem] text-px-cream sm:text-xs">{t('menu.tagline')}</p>

        <div className="mt-8 w-full text-left">
          <PixelDialog name="Karim" role={t('npcs.tech.role')} portrait={<NpcSprite npc={npcs[1]!} size={3} />} text={t('menu.story')} />
        </div>

        <div ref={menuRef} onKeyDown={onKeyDown} className="mt-8 flex w-full max-w-sm flex-col gap-3">
          {saved && (
            <PixelButton tone="green" onClick={() => navigate(`/village`)} autoFocus>
              ▶ {t('menu.continue')}
            </PixelButton>
          )}
          {saved && (
            <p className="font-retro -mt-1 text-lg text-px-cream/80">
              {t('menu.progress', { done, total: missions.length, level: level(xp(progress)).level })}
            </p>
          )}
          <PixelButton tone={saved ? 'cream' : 'gold'} onClick={() => (saved ? setModal('confirm') : start())} autoFocus={!saved}>
            {saved ? '' : '▶ '}
            {t('menu.start')}
          </PixelButton>
          <PixelButton tone="blue" onClick={() => setModal('howto')}>
            {t('menu.howto')}
          </PixelButton>
          <PixelButton tone="red" onClick={() => setModal('about')}>
            {t('menu.about')}
          </PixelButton>
          <p className="font-retro mt-2 hidden bg-px-night/85 px-2 text-lg text-px-cream sm:block">{t('menu.keys')}</p>
        </div>
      </div>

      <PixelModal open={modal === 'howto'} onClose={() => setModal(null)} title={t('howto.title')}>
        <ol className="list-decimal space-y-2 pl-5">
          {list('howto.items').map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </PixelModal>
      <PixelModal open={modal === 'about'} onClose={() => setModal(null)} title={t('about.title')}>
        {list('about.paragraphs').map((p) => (
          <p key={p}>{p}</p>
        ))}
      </PixelModal>
      <PixelModal
        open={modal === 'confirm'}
        onClose={() => setModal(null)}
        title={t('menu.confirmTitle')}
        actions={
          <PixelButton tone="red" small onClick={start}>
            {t('menu.confirmYes')}
          </PixelButton>
        }
      >
        <p>{t('menu.confirmText')}</p>
      </PixelModal>
    </div>
  )
}

/** Night sky, drifting clouds and a pixel village skyline, all in CSS and SVG. */
function Backdrop() {
  const stars = useMemo(
    () => Array.from({ length: 46 }, (_, i) => ({ left: (i * 37) % 100, top: (i * 53) % 60, delay: (i % 7) * 0.35 })),
    [],
  )
  const skyline = ['hq', 'library', 'tower', 'school', 'workshop', 'repair', 'server'] as const
  return (
    <div className="px-sky" aria-hidden="true">
      {stars.map((s, i) => (
        <span key={i} className="px-star" style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }} />
      ))}
      <span className="px-cloud" style={{ top: '18%', width: 64, animationDuration: '70s' }} />
      <span className="px-cloud" style={{ top: '32%', width: 48, animationDuration: '50s', animationDelay: '-20s' }} />
      <span className="px-cloud" style={{ top: '10%', width: 80, animationDuration: '90s', animationDelay: '-45s' }} />
      <div className="px-skyline flex items-end justify-center gap-[1.5vw] bg-px-green-dark px-2" style={{ boxShadow: '0 -8px 0 #63B75D' }}>
        <span className="w-[5vw] max-w-12 -translate-y-2">
          <Tree />
        </span>
        {skyline.map((id) => (
          <span key={id} className={`${id === 'tower' ? 'w-[7vw] max-w-20' : 'w-[9vw] max-w-28'} -translate-y-2`}>
            <BuildingSprite location={locations.find((l) => l.id === id)!} />
          </span>
        ))}
        <span className="px-bob w-[3vw] max-w-8 -translate-y-2">
          <Hero />
        </span>
        <span className="w-[5vw] max-w-12 -translate-y-2">
          <Tree />
        </span>
      </div>
    </div>
  )
}
