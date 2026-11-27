import { Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, type LinkProps } from 'react-router'
import { play } from './game/sound.ts'
import { useGame } from './game/store.ts'
import { LANGUAGES } from './i18n.ts'

type Tone = 'gold' | 'red' | 'blue' | 'green' | 'cream' | 'ghost'
const btnClass = (tone: Tone = 'gold', small?: boolean, extra = '') =>
  `px-btn ${tone === 'gold' ? '' : `px-btn--${tone}`} ${small ? 'px-btn--sm' : ''} ${extra}`

export function PixelButton({
  tone,
  small,
  className,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; small?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={btnClass(tone, small, className)}
      onClick={(event) => {
        play('click')
        onClick?.(event)
      }}
    />
  )
}

/** A link that looks like a PixelButton (navigation stays a real link). */
export function PixelLink({ tone, small, className, onClick, ...props }: LinkProps & { tone?: Tone; small?: boolean }) {
  return (
    <Link
      {...props}
      className={btnClass(tone, small, className)}
      onClick={(event) => {
        play('click')
        onClick?.(event)
      }}
    />
  )
}

export const PixelCard = ({ dark, className = '', children }: { dark?: boolean; className?: string; children: ReactNode }) => (
  <div className={`px-frame px-card ${dark ? 'px-card--dark' : ''} ${className}`}>{children}</div>
)

export const PixelBadge = ({ color = '#F5C451', children }: { color?: string; children: ReactNode }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-1 font-pixel text-[0.55rem] text-px-ink"
    style={{ background: color, boxShadow: '0 0 0 2px #1B1F2E' }}
  >
    {children}
  </span>
)

export function PixelProgressBar({ value, label, color }: { value: number; label: string; color?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="px-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <span style={{ width: `${pct}%`, ['--fill' as string]: color }} />
    </div>
  )
}

export function PixelTooltip({ tip, children }: { tip: string; children: ReactNode }) {
  return (
    <span className="px-tip">
      {children}
      <span className="px-tip__bubble" aria-hidden="true">
        {tip}
      </span>
    </span>
  )
}

/** Native <dialog>: focus trapping, Escape and the backdrop come for free. */
export function PixelModal({
  open,
  onClose,
  title,
  children,
  actions,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t } = useTranslation()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className="px-modal" aria-labelledby="px-modal-title" onClose={onClose} onCancel={onClose}>
      {open && (
        <div className="px-frame px-card px-modal__body p-5 sm:p-7">
          <h2 id="px-modal-title" className="font-pixel mb-4 pr-2 text-sm leading-relaxed sm:text-base">
            {title}
          </h2>
          <div className="space-y-3 text-[0.98rem] leading-relaxed">{children}</div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            {actions}
            <PixelButton tone="ghost" small onClick={onClose}>
              {t('common.close')}
            </PixelButton>
          </div>
        </div>
      )}
    </dialog>
  )
}

/** Speech box with a portrait; the text types itself out unless the player prefers less motion. */
export function PixelDialog({
  name,
  role,
  portrait,
  text,
  children,
}: {
  name: string
  role?: string
  portrait?: ReactNode
  text: string
  children?: ReactNode
}) {
  const [shown, setShown] = useState(text.length)
  const { t } = useTranslation()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setShown(text.length)
    setShown(0)
    const timer = window.setInterval(() => setShown((n) => (n >= text.length ? (window.clearInterval(timer), n) : n + 2)), 18)
    return () => window.clearInterval(timer)
  }, [text])

  const done = shown >= text.length
  return (
    <div className="px-frame px-card--dark flex gap-3 p-3 sm:gap-4 sm:p-4" role="group" aria-label={name}>
      {portrait && <div className="flex size-14 shrink-0 items-center justify-center bg-px-navy p-1 sm:size-16">{portrait}</div>}
      <div className="min-w-0 flex-1">
        <p className="font-pixel text-[0.6rem] text-px-gold">
          {name}
          {role && <span className="font-retro ml-2 text-base text-px-cream/70 normal-case">{role}</span>}
        </p>
        {/* The full text is always available to assistive technologies. */}
        <p className="sr-only" aria-live="polite">
          {text}
        </p>
        <p className="font-retro mt-1 min-h-[3.2em] text-xl text-px-cream sm:text-[1.35rem]" aria-hidden="true">
          {text.slice(0, shown)}
          {!done && <span className="px-blink">▌</span>}
        </p>
        <div className="mt-2 flex flex-wrap justify-end gap-1">
          {!done && (
            <PixelButton tone="ghost" small onClick={() => setShown(text.length)}>
              {t('menu.skipStory')}
            </PixelButton>
          )}
          {done && children}
        </div>
      </div>
    </div>
  )
}

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  return (
    <div role="group" aria-label={t('meta.lang')} className="flex">
      {LANGUAGES.map((lng) => {
        const active = i18n.resolvedLanguage === lng
        return (
          <button
            key={lng}
            type="button"
            lang={lng}
            aria-pressed={active}
            onClick={() => {
              play('click')
              void i18n.changeLanguage(lng)
            }}
            className={`font-pixel min-h-9 min-w-10 px-2 text-[0.6rem] uppercase ${active ? 'bg-px-gold text-px-ink' : 'bg-px-night text-px-cream hover:bg-px-blue-dark'}`}
            style={{ boxShadow: '0 0 0 2px #1B1F2E' }}
          >
            {lng}
          </button>
        )
      })}
    </div>
  )
}

export function SoundToggle() {
  const { t } = useTranslation()
  const sound = useGame((s) => s.sound)
  const toggle = useGame((s) => s.toggleSound)
  const label = sound ? t('common.soundOn') : t('common.soundOff')
  return (
    <button
      type="button"
      aria-pressed={sound}
      aria-label={label}
      title={label}
      onClick={() => {
        toggle()
        play('click')
      }}
      className="inline-flex size-9 items-center justify-center bg-px-night text-px-cream hover:bg-px-blue-dark"
      style={{ boxShadow: '0 0 0 2px #1B1F2E' }}
    >
      {sound ? <Volume2 aria-hidden="true" className="size-4" /> : <VolumeX aria-hidden="true" className="size-4" />}
    </button>
  )
}

const CONFETTI_COLORS = ['#F5C451', '#E84855', '#4776D0', '#63B75D', '#FFF1C7']

/** Falling pixel squares; hidden entirely under reduced motion (see pixel.css). */
export function Confetti({ count = 40 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 2 + Math.random() * 1.6,
      dx: (Math.random() - 0.5) * 120,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    })),
  )
  return (
    <div aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="px-confetti"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            ['--dur' as string]: `${p.dur}s`,
            ['--dx' as string]: `${p.dx}px`,
          }}
        />
      ))}
    </div>
  )
}

export const SectionTitle = ({ children, sub }: { children: ReactNode; sub?: ReactNode }) => (
  <header className="mb-6">
    <h1 className="font-pixel text-base text-px-gold sm:text-xl">{children}</h1>
    {sub && <p className="mt-3 max-w-3xl text-[0.98rem] leading-relaxed text-px-cream/85">{sub}</p>}
  </header>
)
