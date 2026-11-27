// Small building blocks shared by the menus.
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ItemId } from '../game/data.ts'
import { useGame } from '../game/store.ts'
import { iconUrl } from '../engine/art.ts'
import { sfx, unlockAudio } from '../engine/audio.ts'

export function Button({
  tone = 'primary',
  className = '',
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'ghost' | 'danger' | 'cyan' }) {
  return (
    <button
      type="button"
      {...props}
      className={`er-btn er-btn--${tone} ${className}`}
      onClick={(e) => {
        unlockAudio()
        sfx('ui')
        onClick?.(e)
      }}
    />
  )
}

/** A modal window inside the game screen. Focus moves into it when it opens. */
export function Panel({ title, children, onClose, wide, className = '' }: { title: string; children: ReactNode; onClose?: () => void; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  const { t } = useTranslation()
  useEffect(() => {
    const first = ref.current?.querySelector<HTMLElement>('[data-autofocus], button, [href], input, select')
    first?.focus()
  }, [title])
  return (
    <section ref={ref} className={`er-panel ${wide ? 'er-panel--wide' : ''} ${className}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="er-panel__head">
        <h2 className="er-h2">{title}</h2>
        {onClose && (
          <Button tone="ghost" className="er-btn--sm" onClick={onClose} aria-label={t('title.back')}>
            ✕
          </Button>
        )}
      </header>
      <div className="er-panel__body">{children}</div>
    </section>
  )
}

export const Icon = ({ id, size = 32, label }: { id: ItemId | 'credits'; size?: number; label?: string }) => (
  <img src={iconUrl(id)} width={size} height={size} alt={label ?? ''} className="er-pixel" draggable={false} />
)

export const Meter = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => (
  <div className="er-meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)}>
    <span style={{ width: `${Math.max(0, Math.min(100, (100 * value) / Math.max(1, max)))}%`, background: color }} />
  </div>
)

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  return h ? `${h} h ${String(m % 60).padStart(2, '0')}` : `${m} min`
}

export function SettingsForm() {
  const { t } = useTranslation()
  const s = useGame((x) => x.settings)
  const set = useGame((x) => x.setSettings)
  const slider = (key: 'master' | 'music' | 'sfx') => (
    <label className="er-field">
      <span>
        {t(`settings.${key}`)} <b>{s[key]}</b>
      </span>
      <input type="range" min={0} max={100} step={5} value={s[key]} onChange={(e) => set({ [key]: Number(e.target.value) })} />
    </label>
  )
  return (
    <div className="er-form">
      {slider('master')}
      {slider('music')}
      {slider('sfx')}
      <label className="er-check">
        <input type="checkbox" checked={s.muted} onChange={(e) => set({ muted: e.target.checked })} />
        {t('settings.mute')}
      </label>
      <label className="er-check">
        <input type="checkbox" checked={s.reducedMotion} onChange={(e) => set({ reducedMotion: e.target.checked })} />
        {t('settings.reducedMotion')}
      </label>
      <label className="er-field">
        <span>{t('settings.touch')}</span>
        <select value={s.touch} onChange={(e) => set({ touch: e.target.value as typeof s.touch })}>
          <option value="auto">{t('settings.touchAuto')}</option>
          <option value="on">{t('settings.touchOn')}</option>
          <option value="off">{t('settings.touchOff')}</option>
        </select>
      </label>
      <label className="er-field">
        <span>{t('settings.language')}</span>
        <select value={s.lang} onChange={(e) => set({ lang: e.target.value as typeof s.lang })}>
          <option value="fr" lang="fr">
            Français
          </option>
          <option value="en" lang="en">
            English
          </option>
        </select>
      </label>
    </div>
  )
}

export function Controls() {
  const { t } = useTranslation()
  const rows = t('controls.rows', { returnObjects: true }) as string[][]
  const tips = t('controls.tips', { returnObjects: true }) as string[]
  return (
    <div className="er-text">
      <dl className="er-keys">
        {rows.map(([action, keys]) => (
          <div key={action}>
            <dt>{action}</dt>
            <dd>{keys}</dd>
          </div>
        ))}
      </dl>
      <p>{t('controls.touch')}</p>
      {tips.map((tip) => (
        <p key={tip}>{tip}</p>
      ))}
    </div>
  )
}
