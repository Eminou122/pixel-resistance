// Hosts the Phaser canvas and the React layers drawn over it (dialogue, menus, defeat screen, touch controls).
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type Phaser from 'phaser'
import { isBlocked, useGame } from '../game/store.ts'
import { lines } from '../i18n.ts'
import { portraitUrl } from '../engine/art.ts'
import { playMusic, sfx } from '../engine/audio.ts'
import { touch, type TouchButton } from '../engine/input.ts'
import { Bench, Character, Inventory, Journal } from './panels.tsx'
import { Button, Panel, SettingsForm } from './ui.tsx'

const W = 384
const H = 216

const coarse = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

export function GameView() {
  const { t } = useTranslation()
  const host = useRef<HTMLDivElement>(null)
  const game = useRef<Phaser.Game | null>(null)
  const touchSetting = useGame((s) => s.settings.touch)
  const showTouch = touchSetting === 'on' || (touchSetting === 'auto' && coarse())
  const [size, setSize] = useState({ z: 2, portrait: false })

  // Pixel-perfect: a whole-number zoom when it fills the screen well enough, otherwise the largest that fits.
  useLayoutEffect(() => {
    const fit = () => {
      const portrait = window.innerHeight > window.innerWidth
      const reserve = showTouch && portrait ? 200 : 0
      const scale = Math.max(0.5, Math.min(window.innerWidth / W, (window.innerHeight - reserve) / H))
      const whole = Math.floor(scale)
      setSize({ z: whole >= 2 && whole / scale >= 0.8 ? whole : scale, portrait })
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [showTouch])

  useEffect(() => {
    game.current?.scale.refresh()
  }, [size])

  // Start Phaser once fonts are ready (the HUD draws text on the canvas).
  useEffect(() => {
    let cancelled = false
    let created: Phaser.Game | null = null
    void (async () => {
      await Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('16px "VT323"')]).catch(() => undefined)
      const { createGame } = await import('../engine/boot.ts')
      if (cancelled || !host.current) return
      created = createGame(host.current)
      game.current = created
      if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__echoes = { game: created, store: useGame, touch }
    })()
    return () => {
      cancelled = true
      created?.destroy(true)
      game.current = null
      playMusic(null)
    }
  }, [])

  const ui = useGame((s) => s.ui)

  // Esc: pause / back; I: inventory.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useGame.getState()
      if (st.ui.gameOver || st.ui.dialogue) return
      if (e.key === 'Escape') {
        e.preventDefault()
        if (st.ui.panel) st.closePanel()
        else st.togglePause()
        sfx('ui')
      } else if ((e.key === 'i' || e.key === 'I') && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
        if (st.ui.panel === 'inventory') st.togglePause()
        else if (!st.ui.panel || st.ui.panel !== 'bench') st.openPanel('inventory')
        sfx('ui')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const layered = showTouch && !size.portrait
  return (
    <div className={`er-game ${size.portrait ? 'er-game--portrait' : ''}`}>
      <div className="er-stage" style={{ width: W * size.z, height: H * size.z, ['--z' as string]: size.z }}>
        <div ref={host} className="er-canvas" role="application" aria-label={t('meta.game')} />
        {ui.dialogue && <Dialogue />}
        {ui.paused && !ui.panel && <PauseMenu />}
        {ui.panel && <PanelView />}
        {ui.gameOver && <GameOver />}
        {showTouch && layered && !isBlocked({ ui }) && <TouchControls overlay />}
      </div>
      {showTouch && !layered && <TouchControls />}
    </div>
  )
}

function Dialogue() {
  const { t, i18n } = useTranslation()
  const script = useGame((s) => s.ui.dialogue)!
  const reduced = useGame((s) => s.settings.reducedMotion)
  const text = lines(script.text)
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(0)
  const line = text[i] ?? ''
  const done = shown >= line.length
  const last = i >= text.length - 1
  const choosing = last && done && !!script.choices

  useEffect(() => {
    if (reduced) return setShown(line.length)
    setShown(0)
    const timer = window.setInterval(() => setShown((n) => (n >= line.length ? (window.clearInterval(timer), n) : n + 2)), 22)
    return () => window.clearInterval(timer)
  }, [line, reduced])

  const advance = () => {
    if (!done) return setShown(line.length)
    if (!last) return (setI(i + 1), sfx('ui'))
    if (!script.choices) useGame.getState().closeDialogue(script.effect ?? null)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (choosing) return
      if (['e', 'E', 'Enter', ' ', 'Escape'].includes(e.key)) (e.preventDefault(), advance())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <section className="er-dialogue" role="dialog" aria-label={t(`speakers.${script.speaker}`)} lang={i18n.resolvedLanguage} onClick={() => !choosing && advance()}>
      <img src={portraitUrl(script.speaker)} alt="" className="er-pixel er-dialogue__pic" width={48} height={48} />
      <div className="er-dialogue__body">
        <p className="er-dialogue__name">{t(`speakers.${script.speaker}`)}</p>
        <p className="er-sr" aria-live="polite">
          {line}
        </p>
        <p className="er-dialogue__text" aria-hidden="true">
          {line.slice(0, shown)}
          {!done && <span className="er-caret">▌</span>}
        </p>
        {choosing ? (
          <div className="er-row">
            {script.choices!.map((c, k) => (
              <Button key={c.label} tone={k === 0 ? 'primary' : 'ghost'} autoFocus={k === 0} onClick={() => (sfx('confirm'), useGame.getState().closeDialogue(c.effect))}>
                {t(c.label)}
              </Button>
            ))}
          </div>
        ) : (
          <p className="er-dialogue__hint">
            {i + 1}/{text.length} · {t('dialogue.hint')}
          </p>
        )}
      </div>
    </section>
  )
}

function PauseMenu() {
  const { t } = useTranslation()
  const st = useGame.getState()
  const [message, setMessage] = useState<string | null>(null)
  return (
    <Panel title={t('pause.title')} onClose={() => st.togglePause()}>
      <nav className="er-menu er-menu--pause">
        <Button data-autofocus onClick={() => st.togglePause()}>
          {t('pause.resume')}
        </Button>
        <Button tone="ghost" onClick={() => st.openPanel('inventory')}>
          {t('pause.inventory')}
        </Button>
        <Button tone="ghost" onClick={() => st.openPanel('character')}>
          {t('pause.character')}
        </Button>
        <Button tone="ghost" onClick={() => st.openPanel('journal')}>
          {t('pause.journal')}
        </Button>
        <Button tone="ghost" onClick={() => st.openPanel('settings')}>
          {t('pause.settings')}
        </Button>
        <Button tone="cyan" onClick={() => setMessage(st.saveNow() ? t('pause.saved') : t('pause.saveFailed'))}>
          {t('pause.save')}
        </Button>
        <Button tone="ghost" onClick={() => (st.saveNow(), st.quitToTitle())}>
          {t('pause.quit')}
        </Button>
      </nav>
      {message && (
        <p className="er-note" role="status">
          {message}
        </p>
      )}
    </Panel>
  )
}

function PanelView() {
  const { t } = useTranslation()
  const panel = useGame((s) => s.ui.panel)
  const close = useGame((s) => s.closePanel)
  switch (panel) {
    case 'inventory':
      return <Inventory onClose={close} />
    case 'character':
      return <Character onClose={close} />
    case 'journal':
      return <Journal onClose={close} />
    case 'bench':
      return <Bench onClose={close} />
    case 'settings':
      return (
        <Panel title={t('settings.title')} onClose={close}>
          <SettingsForm />
        </Panel>
      )
    default:
      return null
  }
}

function GameOver() {
  const { t } = useTranslation()
  return (
    <section className="er-gameover" role="alertdialog" aria-label={t('gameover.title')}>
      <h2 className="er-gameover__title">{t('gameover.title')}</h2>
      <p>{t('gameover.text')}</p>
      <div className="er-row">
        <Button autoFocus onClick={() => useGame.getState().retry()}>
          {t('gameover.retry')}
        </Button>
        <Button tone="ghost" onClick={() => useGame.getState().quitToTitle()}>
          {t('gameover.menu')}
        </Button>
      </div>
    </section>
  )
}

function TouchControls({ overlay = false }: { overlay?: boolean }) {
  const { t } = useTranslation()
  const canInteract = useGame((s) => s.canInteract)
  const stick = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  const move = (e: React.PointerEvent) => {
    const r = stick.current!.getBoundingClientRect()
    const max = r.width / 2
    let x = e.clientX - (r.left + max)
    let y = e.clientY - (r.top + max)
    const len = Math.hypot(x, y)
    if (len > max) (x *= max / len), (y *= max / len)
    touch.x = Math.abs(x) < max * 0.2 ? 0 : x / max
    touch.y = Math.abs(y) < max * 0.2 ? 0 : y / max
    setKnob({ x, y })
  }
  const release = () => {
    touch.x = 0
    touch.y = 0
    setKnob({ x: 0, y: 0 })
  }
  useEffect(() => release, [])

  const btn = (id: TouchButton, label: string, cls = '') => (
    <button
      type="button"
      className={`er-tbtn ${cls}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault()
        touch[id] = true
      }}
    >
      {label}
    </button>
  )

  return (
    <div className={`er-touch ${overlay ? 'er-touch--overlay' : ''}`}>
      <div
        ref={stick}
        className="er-stick"
        role="slider"
        aria-label={t('touch.stick')}
        aria-valuenow={0}
        onPointerDown={(e) => (e.currentTarget.setPointerCapture(e.pointerId), move(e))}
        onPointerMove={(e) => e.buttons && move(e)}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <span style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      <div className="er-tsys">
        <button type="button" className="er-tbtn er-tbtn--sm" onClick={() => useGame.getState().togglePause()}>
          {t('touch.pause')}
        </button>
        <button type="button" className="er-tbtn er-tbtn--sm" onClick={() => useGame.getState().openPanel('inventory')}>
          {t('touch.bag')}
        </button>
        {btn('heal', t('touch.heal'), 'er-tbtn--sm er-tbtn--green')}
      </div>
      <div className="er-tactions">
        {btn('interact', t('touch.use'), canInteract ? 'er-tbtn--hot' : 'er-tbtn--dim')}
        {btn('ranged', t('touch.blaster'), 'er-tbtn--cyan')}
        {btn('dash', t('touch.dash'))}
        {btn('melee', t('touch.blade'), 'er-tbtn--big')}
      </div>
    </div>
  )
}
