import { BookOpen, Flag, Map, Swords, Trophy, Wrench } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useEffect } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { missions } from './game/content.ts'
import { coins, level, xp } from './game/progress.ts'
import { play } from './game/sound.ts'
import { useGame, type Toast } from './game/store.ts'
import { i18n } from './i18n.ts'
import './pixel.css'
import { Coin } from './sprites.tsx'
import { LanguageSwitcher, PixelProgressBar, SoundToggle } from './ui.tsx'

export function PixelLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <Shell />
    </I18nextProvider>
  )
}

function Shell() {
  const { t, i18n: active } = useTranslation()
  const { pathname } = useLocation()
  const onMenu = pathname === '/'

  useEffect(() => {
    document.documentElement.lang = active.resolvedLanguage ?? 'fr'
    document.title = t('meta.title')
  }, [active.resolvedLanguage, t])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="px-root">
      <a
        href="#px-main"
        className="font-pixel sr-only z-50 bg-px-gold px-3 py-2 text-[0.6rem] text-px-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('meta.skip')}
      </a>
      {!onMenu && <PixelHUD />}
      <main id="px-main" className={onMenu ? '' : 'mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 md:pb-12'}>
        <Outlet />
      </main>
      <Toasts />
    </div>
  )
}

const NAV = [
  { to: 'village', key: 'village', icon: Map },
  { to: 'missions', key: 'missions', icon: Swords },
  { to: 'ennemis', key: 'enemies', icon: BookOpen },
  { to: 'atelier', key: 'workshop', icon: Wrench },
  { to: 'qg', key: 'hq', icon: Flag },
] as const

export function PixelHUD() {
  const { t } = useTranslation()
  const progress = useGame((s) => s.progress)
  const total = xp(progress)
  const lv = level(total)
  const done = missions.filter((mi) => progress.missions[mi.id]).length

  const navLinks = (mobile: boolean) =>
    NAV.map(({ to, key, icon: Icon }) => (
      <li key={to} className={mobile ? 'flex-1' : ''}>
        <NavLink
          to={`/${to}`}
          onClick={() => play('click')}
          className={({ isActive }) =>
            `font-pixel flex items-center gap-2 text-[0.55rem] ${
              mobile ? 'min-h-14 flex-col justify-center gap-1.5 px-1' : 'min-h-10 px-3'
            } ${isActive ? 'bg-px-gold text-px-ink' : 'text-px-cream hover:bg-px-blue-dark'}`
          }
        >
          <Icon aria-hidden="true" className="size-4" />
          {t(`nav.${key}`)}
        </NavLink>
      </li>
    ))

  return (
    <>
      <header className="sticky top-0 z-40 border-b-4 border-px-ink bg-px-night/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
          <Link to="/" onClick={() => play('click')} className="font-pixel px-logo text-[0.6rem] sm:text-xs" aria-label={`PIXEL RESISTANCE — ${t('common.menu')}`}>
            PIXEL<span className="text-px-cream"> RES</span>
          </Link>

          <section aria-label={t('hud.label')} className="order-last flex w-full min-w-0 items-center gap-3 sm:order-none sm:w-auto sm:flex-1 sm:gap-5">
            <div className="min-w-0 flex-1 sm:max-w-56">
              <p className="font-pixel flex justify-between gap-2 text-[0.5rem] text-px-cream sm:text-[0.55rem]">
                <span>
                  {t('common.level')} {lv.level} · {t(`levels.${lv.level}`)}
                </span>
              </p>
              <PixelProgressBar
                value={lv.ratio}
                color="#F5C451"
                label={lv.next === undefined ? t('hud.max') : t('hud.toNext', { xp: lv.next - total, level: lv.level + 1 })}
              />
              <p className="font-retro text-base leading-none text-px-cream/75">
                {total} {t('common.xp')} <span aria-hidden="true">·</span> {lv.next === undefined ? t('hud.max') : t('hud.toNext', { xp: lv.next - total, level: lv.level + 1 })}
              </p>
            </div>
            <p className="font-pixel flex items-center gap-1.5 text-[0.6rem] text-px-gold" title={t('common.coins')}>
              <Coin size={2} />
              <span>{coins(progress)}</span>
              <span className="sr-only">{t('common.coins')}</span>
            </p>
            <p className="font-pixel flex items-center gap-1.5 text-[0.6rem] text-px-cream">
              <Trophy aria-hidden="true" className="size-4 text-px-gold" />
              <span className="sr-only">{t('hud.missions')}</span>
              {done}/{missions.length}
            </p>
          </section>

          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <LanguageSwitcher />
            <SoundToggle />
          </div>
        </div>
        <nav aria-label={t('nav.label')} className="mx-auto hidden max-w-6xl px-4 pb-2 sm:px-6 md:block">
          <ul className="flex gap-1">{navLinks(false)}</ul>
        </nav>
      </header>
      <nav aria-label={t('nav.label')} className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-px-ink bg-px-night md:hidden">
        <ul className="flex">{navLinks(true)}</ul>
      </nav>
    </>
  )
}

function Toasts() {
  const toasts = useGame((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed top-20 right-3 z-50 flex w-72 max-w-[calc(100vw-24px)] flex-col gap-3" aria-live="polite">
      <AnimatePresence>
        {toasts.slice(0, 3).map((toast) => (
          <ToastItem key={toast.key} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const { t } = useTranslation()
  const dismiss = useGame((s) => s.dismissToast)
  useEffect(() => {
    play(toast.kind === 'level' ? 'level' : 'coin')
    const timer = window.setTimeout(() => dismiss(toast.key), 4000)
    return () => window.clearTimeout(timer)
  }, [toast, dismiss])

  return (
    <m.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className="px-frame px-card p-3"
      role="status"
    >
      <p className="font-pixel text-[0.55rem] text-px-red-dark">
        {toast.kind === 'level' ? t('toasts.level', { level: toast.level }) : t('toasts.achievement')}
      </p>
      <p className="font-retro mt-1 text-xl leading-tight">
        {toast.kind === 'level' ? t(`levels.${toast.level}`) : `★ ${t(`achievements.${toast.id}.name`)}`}
      </p>
    </m.div>
  )
}
