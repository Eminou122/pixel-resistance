// Title screen: animated backdrop, main menu, save slots, settings, controls and credits.
import { useMemo, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { SLOT_COUNT, latestSlot, type SlotStatus } from '../game/save.ts'
import { xpProgress } from '../game/state.ts'
import { readSlot, saveStore, useGame } from '../game/store.ts'
import { currentObjective } from '../game/story.ts'
import { portraitUrl } from '../engine/art.ts'
import { playMusic, sfx, unlockAudio } from '../engine/audio.ts'
import { Button, Controls, SettingsForm, formatTime } from './ui.tsx'

type View = 'menu' | 'new' | 'load' | 'settings' | 'controls' | 'credits'

export function Title() {
  const { t } = useTranslation()
  const [view, setView] = useState<View>('menu')
  const [version, setVersion] = useState(0)
  const continueSlot = useMemo(() => latestSlot(saveStore), [version])
  const start = () => {
    unlockAudio()
    playMusic('title')
  }

  // Up/Down move between menu buttons, like a console menu.
  const onMenuKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const next = buttons[(i + (e.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length]
    next?.focus()
    sfx('ui')
    e.preventDefault()
  }

  return (
    <div className="er-title" onPointerDown={start} onKeyDown={start}>
      <Backdrop />
      <main className="er-title__content">
        <header className="er-logo">
          <p className="er-logo__project">{t('title.project')}</p>
          <h1 className="er-logo__name">
            <span>ECHOES</span> <span className="er-logo__small">OF THE</span> <span>LAST SIGNAL</span>
          </h1>
          <p className="er-logo__tagline">{t('title.tagline')}</p>
        </header>

        {view === 'menu' && (
          <nav className="er-menu" aria-label={t('title.name')} onKeyDown={onMenuKey}>
            {continueSlot !== null && (
              <Button autoFocus onClick={() => useGame.getState().loadSlot(continueSlot)}>
                {t('title.continue')}
              </Button>
            )}
            <Button autoFocus={continueSlot === null} tone={continueSlot === null ? 'primary' : 'cyan'} onClick={() => setView('new')}>
              {t('title.newGame')}
            </Button>
            <Button tone="ghost" onClick={() => setView('load')}>
              {t('title.load')}
            </Button>
            <Button tone="ghost" onClick={() => setView('settings')}>
              {t('title.settings')}
            </Button>
            <Button tone="ghost" onClick={() => setView('controls')}>
              {t('title.controls')}
            </Button>
            <Button tone="ghost" onClick={() => setView('credits')}>
              {t('title.credits')}
            </Button>
            {!saveStore && <p className="er-warn">{t('title.storageOff')}</p>}
          </nav>
        )}

        {(view === 'new' || view === 'load') && (
          <Slots mode={view} onBack={() => setView('menu')} onChange={() => setVersion((v) => v + 1)} />
        )}
        {view === 'settings' && (
          <Sub title={t('settings.title')} onBack={() => setView('menu')}>
            <SettingsForm />
          </Sub>
        )}
        {view === 'controls' && (
          <Sub title={t('controls.title')} onBack={() => setView('menu')}>
            <Controls />
          </Sub>
        )}
        {view === 'credits' && (
          <Sub title={t('credits.title')} onBack={() => setView('menu')}>
            <div className="er-text">
              {(t('credits.lines', { returnObjects: true }) as string[]).map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          </Sub>
        )}
      </main>
    </div>
  )
}

function Sub({ title, children, onBack }: { title: string; children: React.ReactNode; onBack: () => void }) {
  const { t } = useTranslation()
  return (
    <section className="er-panel er-panel--title" aria-label={title} onKeyDown={(e) => e.key === 'Escape' && onBack()}>
      <header className="er-panel__head">
        <h2 className="er-h2">{title}</h2>
      </header>
      <div className="er-panel__body">{children}</div>
      <Button tone="ghost" autoFocus onClick={onBack}>
        {t('title.back')}
      </Button>
    </section>
  )
}

function Slots({ mode, onBack, onChange }: { mode: 'new' | 'load'; onBack: () => void; onChange: () => void }) {
  const { t } = useTranslation()
  const [version, setVersion] = useState(0)
  const [confirm, setConfirm] = useState<{ n: number; action: 'delete' | 'overwrite' } | null>(null)
  const slots = useMemo(() => Array.from({ length: SLOT_COUNT }, (_, i) => readSlot(saveStore, i + 1)), [version])
  const refresh = () => (setVersion((v) => v + 1), onChange())

  const describe = (s: SlotStatus) => {
    if (s.state === 'empty') return t('title.empty')
    if (s.state === 'corrupt') return t('title.corrupt')
    if (s.state === 'outdated') return t('title.outdated', { version: s.version })
    const obj = currentObjective(s.data)
    return [
      t('title.summary', { level: xpProgress(s.data.player.xp).level, area: t(`areas.${s.data.world.area}`), time: formatTime(s.data.playTime) }),
      obj ? t('title.objective', { step: t(`quests.${obj.quest}.steps.${obj.step}`) }) : t('title.finished'),
    ].join(' — ')
  }

  const choose = (n: number, s: SlotStatus) => {
    if (mode === 'load') return s.state === 'ok' && useGame.getState().loadSlot(n)
    if (s.state !== 'empty') return setConfirm({ n, action: 'overwrite' })
    sfx('confirm')
    useGame.getState().newGame(n)
  }

  return (
    <section className="er-panel er-panel--title" aria-label={t(mode === 'new' ? 'title.chooseNew' : 'title.chooseLoad')} onKeyDown={(e) => e.key === 'Escape' && onBack()}>
      <header className="er-panel__head">
        <h2 className="er-h2">{t(mode === 'new' ? 'title.chooseNew' : 'title.chooseLoad')}</h2>
      </header>
      <ul className="er-slots">
        {slots.map((s, i) => {
          const n = i + 1
          const usable = mode === 'new' || s.state === 'ok'
          return (
            <li key={n} className="er-slot">
              <img src={portraitUrl(s.state === 'ok' ? 'kael' : 'archive')} alt="" width={40} height={40} className="er-pixel er-slot__pic" />
              <button type="button" className="er-slot__main" disabled={!usable} onClick={() => (unlockAudio(), choose(n, s))} autoFocus={i === 0}>
                <b>{t('title.slot', { n })}</b>
                <span>{describe(s)}</span>
              </button>
              {s.state !== 'empty' && (
                <Button tone="danger" className="er-btn--sm" onClick={() => setConfirm({ n, action: 'delete' })}>
                  {t('title.delete')}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      {confirm && (
        <div className="er-confirm" role="alertdialog" aria-label={t(confirm.action === 'delete' ? 'title.confirmDelete' : 'title.confirmOverwrite', { n: confirm.n })}>
          <p>{t(confirm.action === 'delete' ? 'title.confirmDelete' : 'title.confirmOverwrite', { n: confirm.n })}</p>
          <div className="er-row">
            <Button
              tone="danger"
              autoFocus
              onClick={() => {
                const { n, action } = confirm
                setConfirm(null)
                if (action === 'delete') return (useGame.getState().deleteSlot(n), refresh())
                sfx('confirm')
                useGame.getState().newGame(n)
              }}
            >
              {t('title.yes')}
            </Button>
            <Button tone="ghost" onClick={() => setConfirm(null)}>
              {t('title.no')}
            </Button>
          </div>
        </div>
      )}
      <Button tone="ghost" onClick={onBack}>
        {t('title.back')}
      </Button>
    </section>
  )
}

/** Stars, a ringed planet and the colony skyline; animated with CSS (calmer when motion is reduced). */
function Backdrop() {
  const stars = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({ left: (i * 37.7) % 100, top: (i * 61.3) % 70, delay: (i % 7) * 0.4, big: i % 9 === 0 })),
    [],
  )
  return (
    <div className="er-backdrop" aria-hidden="true">
      {stars.map((s, i) => (
        <span key={i} className={`er-star ${s.big ? 'er-star--big' : ''}`} style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }} />
      ))}
      <div className="er-planet" />
      <div className="er-signal" />
      <div className="er-skyline" />
      <div className="er-scanlines" />
    </div>
  )
}
