import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Lock } from 'lucide-react'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { HERO_START, MAP_H, MAP_W, NPC_LINES, locations, npcs, pond, trees, type Location, type Npc } from '../game/content.ts'
import { locationUnlocked } from '../game/progress.ts'
import { play } from '../game/sound.ts'
import { useGame } from '../game/store.ts'
import { BuildingSprite, Hero, NpcSprite, Tree } from '../sprites.tsx'
import { PixelBadge, PixelButton, PixelDialog, PixelLink, PixelModal, SectionTitle } from '../ui.tsx'

const PATHS = [
  [5, 3, 10, 1],
  [5, 7, 10, 1],
  [5, 3, 1, 5],
  [14, 3, 1, 5],
  [9, 7, 2, 2],
  [3, 4, 1, 3],
  [3, 5, 3, 1],
  [16, 4, 1, 3],
  [14, 5, 2, 1],
  [9, 3, 2, 1],
]

const box = (x: number, y: number, w = 1, h = 1) => ({
  left: `${(x / MAP_W) * 100}%`,
  top: `${(y / MAP_H) * 100}%`,
  width: `${(w / MAP_W) * 100}%`,
  height: `${(h / MAP_H) * 100}%`,
})

const inside = (x: number, y: number, r: { x: number; y: number; w: number; h: number }) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h

type Talk = { kind: 'npc'; npc: Npc; line: number } | { kind: 'intro'; line: number }

const KEYS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  z: [0, -1],
  s: [0, 1],
  a: [-1, 0],
  q: [-1, 0],
  d: [1, 0],
}

export function VillagePage() {
  const { t } = useTranslation()
  const progress = useGame((s) => s.progress)
  const discover = useGame((s) => s.discover)
  const seeIntro = useGame((s) => s.seeIntro)
  const [[x, y], setPos] = useState(HERO_START)
  const [facingLeft, setFacingLeft] = useState(false)
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState<Location | null>(null)
  const [talk, setTalk] = useState<Talk | null>(progress.introSeen ? null : { kind: 'intro', line: 1 })

  const treeSet = useMemo(() => new Set(trees.map(([tx, ty]) => `${tx},${ty}`)), [])

  const enter = (location: Location) => {
    setTalk(null)
    setOpen(location)
    if (locationUnlocked(progress, location)) {
      play('good')
      discover('locations', location.id)
    } else play('bump')
  }

  const speak = (npc: Npc) => {
    play('ok')
    setTalk({ kind: 'npc', npc, line: 0 })
    discover('npcs', npc.id)
  }

  const move = (dx: number, dy: number) => {
    if (dx) setFacingLeft(dx < 0)
    const nx = x + dx
    const ny = y + dy
    if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) return play('bump')
    const location = locations.find((l) => inside(nx, ny, l))
    if (location) return enter(location)
    const npc = npcs.find((n) => n.x === nx && n.y === ny)
    if (npc) return speak(npc)
    if (treeSet.has(`${nx},${ny}`)) return (play('bump'), setMessage(t('village.bump')))
    if (inside(nx, ny, pond)) return (play('bump'), setMessage(t('village.water')))
    setMessage('')
    if (talk?.kind === 'npc') setTalk(null)
    play('step')
    setPos([nx, ny])
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const dir = KEYS[event.key.length === 1 ? event.key.toLowerCase() : event.key]
    if (!dir || event.altKey || event.ctrlKey || event.metaKey) return
    event.preventDefault()
    move(...dir)
  }

  const lockText = (location: Location) => {
    const rule = location.unlock
    if (!rule) return ''
    if ('mission' in rule) return t('village.lockedBy', { mission: t(`missions.${rule.mission}.title`) })
    return t('village.lockedAll')
  }

  const closeIntro = () => {
    seeIntro()
    setTalk(null)
  }

  const karim = npcs.find((n) => n.id === 'tech')!

  return (
    <div>
      <SectionTitle sub={t('village.intro')}>{t('village.title')}</SectionTitle>

      <div className="px-frame relative" style={{ ['--frame' as string]: '#1B1F2E' }}>
        <div
          className="px-map"
          role="application"
          aria-label={t('village.mapLabel')}
          aria-describedby="px-map-status"
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          {PATHS.map(([px, py, pw, ph], i) => (
            <span key={i} className="px-path" style={box(px!, py!, pw, ph)} aria-hidden="true" />
          ))}
          <span className="px-water" style={box(pond.x, pond.y, pond.w, pond.h)} aria-hidden="true" />
          {trees.map(([tx, ty]) => (
            <span key={`${tx}-${ty}`} className="px-tile-item" style={box(tx, ty)} aria-hidden="true">
              <Tree />
            </span>
          ))}

          {locations.map((location) => {
            const unlocked = locationUnlocked(progress, location)
            return (
              <button
                key={location.id}
                type="button"
                tabIndex={-1}
                className={`px-building ${unlocked ? '' : 'is-locked'}`}
                style={box(location.x, location.y, location.w, location.h)}
                onClick={() => enter(location)}
                aria-label={`${t(`locations.${location.id}.name`)}${unlocked ? '' : ` (${t('common.locked')})`}`}
              >
                <BuildingSprite location={location} freed={location.id === 'tower' && unlocked} />
                {!unlocked && <Lock aria-hidden="true" className="absolute top-1/3 size-[30%] max-w-6 text-px-gold" />}
                <span className="px-label hidden sm:block">{t(`locations.${location.id}.name`)}</span>
              </button>
            )
          })}

          {npcs.map((npc) => (
            <button
              key={npc.id}
              type="button"
              tabIndex={-1}
              className="px-tile-item px-bob cursor-pointer"
              style={box(npc.x, npc.y)}
              onClick={() => speak(npc)}
              aria-label={`${t('village.talk')} : ${t(`npcs.${npc.id}.name`)}`}
            >
              <NpcSprite npc={npc} className="h-[92%] w-auto" />
              {!progress.npcs.includes(npc.id) && (
                <span className="font-pixel absolute -top-[40%] text-[clamp(6px,1vw,10px)] text-px-gold px-blink" aria-hidden="true">
                  !
                </span>
              )}
            </button>
          ))}

          <span className="px-hero px-tile-item" style={box(x, y)} aria-hidden="true">
            <Hero flip={facingLeft} className="h-[92%] w-auto" />
          </span>
        </div>
      {talk && (
          <div className="mt-4 md:absolute md:inset-x-3 md:bottom-3 md:z-20 md:mt-0">
            {talk.kind === 'intro' ? (
              <PixelDialog name={t(`npcs.tech.name`)} role={t('npcs.tech.role')} portrait={<NpcSprite npc={karim} size={3} />} text={t(`village.intro${talk.line}`)}>
                {talk.line < 3 ? (
                  <PixelButton small onClick={() => setTalk({ kind: 'intro', line: talk.line + 1 })}>
                    {t('common.next')} ▶
                  </PixelButton>
                ) : (
                  <PixelButton small onClick={closeIntro}>
                    {t('common.continue')} ▶
                  </PixelButton>
                )}
              </PixelDialog>
            ) : (
              <PixelDialog
                name={t(`npcs.${talk.npc.id}.name`)}
                role={t(`npcs.${talk.npc.id}.role`)}
                portrait={<NpcSprite npc={talk.npc} size={3} />}
                text={t(`npcs.${talk.npc.id}.lines.${talk.line}`)}
              >
                <PixelButton tone="ghost" small onClick={() => setTalk(null)}>
                  {t('common.close')}
                </PixelButton>
                <PixelButton small onClick={() => setTalk({ ...talk, line: (talk.line + 1) % NPC_LINES })}>
                  {t('common.next')} ▶
                </PixelButton>
              </PixelDialog>
            )}
          </div>
        )}
      </div>

      <p id="px-map-status" className="font-retro mt-3 min-h-6 text-lg text-px-cream/80" aria-live="polite">
        {message || t('village.mapHint')}
      </p>

      <div className="mt-2 grid w-40 grid-cols-3 gap-1 md:hidden" role="group" aria-label={t('village.mapLabel')}>
        {(
          [
            ['up', ArrowUp, 0, -1, 'col-start-2'],
            ['left', ArrowLeft, -1, 0, 'col-start-1 row-start-2'],
            ['down', ArrowDown, 0, 1, 'col-start-2 row-start-2'],
            ['right', ArrowRight, 1, 0, 'col-start-3 row-start-2'],
          ] as const
        ).map(([key, Icon, dx, dy, pos]) => (
          <button
            key={key}
            type="button"
            className={`${pos} flex size-12 items-center justify-center bg-px-night text-px-cream active:bg-px-gold active:text-px-ink`}
            style={{ boxShadow: '0 0 0 3px #1B1F2E' }}
            aria-label={t(`village.pad.${key}`)}
            onClick={() => move(dx, dy)}
          >
            <Icon aria-hidden="true" className="size-5" />
          </button>
        ))}
      </div>

      <h2 className="font-pixel mt-10 mb-4 text-xs text-px-gold sm:text-sm">{t('village.places')}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {locations.map((location) => {
          const unlocked = locationUnlocked(progress, location)
          const visited = progress.locations.includes(location.id)
          return (
            <li key={location.id}>
              <button
                type="button"
                onClick={() => enter(location)}
                className="px-frame px-card--dark flex w-full items-center gap-3 p-3 text-left hover:bg-px-navy"
              >
                <span className={`w-12 shrink-0 ${unlocked ? '' : 'grayscale brightness-50'}`}>
                  <BuildingSprite location={location} freed={location.id === 'tower' && unlocked} />
                </span>
                <span className="min-w-0">
                  <span className="font-pixel block text-[0.55rem] leading-relaxed">{t(`locations.${location.id}.name`)}</span>
                  <span className="mt-1 inline-flex">
                    {!unlocked ? (
                      <PixelBadge color="#9AA3B5">
                        <Lock aria-hidden="true" className="size-3" /> {t('common.locked')}
                      </PixelBadge>
                    ) : visited ? (
                      <PixelBadge color="#63B75D">
                        <Check aria-hidden="true" className="size-3" /> {t('village.visited')}
                      </PixelBadge>
                    ) : (
                      <PixelBadge>{t('common.new')}</PixelBadge>
                    )}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <PixelModal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open ? t(`locations.${open.id}.name`) : ''}
        actions={
          open &&
          locationUnlocked(progress, open) && (
            <PixelLink to={`/${open.to}`} small tone="green">
              {t(`locations.${open.id}.cta`)}
            </PixelLink>
          )
        }
      >
        {open && (
          <>
            <div className={`mx-auto w-28 ${locationUnlocked(progress, open) ? '' : 'grayscale brightness-50'}`}>
              <BuildingSprite location={open} freed={open.id === 'tower' && locationUnlocked(progress, open)} />
            </div>
            {locationUnlocked(progress, open) ? (
              <p>{t(`locations.${open.id}.text`)}</p>
            ) : (
              <p className="flex items-start gap-2 font-semibold">
                <Lock aria-hidden="true" className="mt-1 size-4 shrink-0" />
                {lockText(open)}
              </p>
            )}
          </>
        )}
      </PixelModal>
    </div>
  )
}

