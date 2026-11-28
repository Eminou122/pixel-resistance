// The playable world: tile map, collisions, camera, combat, pickups, conversations, quest triggers and area changes.
import Phaser from 'phaser'
import { ITEMS, PLAYER, PYLONS, SPREAD_WEAPONS, type ItemId, type NpcId } from '../game/data.ts'
import {
  AREAS, DOORS, LIQUID, OVERLAY, SOLID, TILE, exitAt, inZone, kindAt, wallId,
  type AreaDef, type EnemySpawn, type Exit, type InteractKind, type Pickup, type TileKind,
} from '../game/maps.ts'
import { count, damage, enemyReward, equip, grantOnce, hasFlag, statsOf } from '../game/state.ts'
import { isBlocked, live, useGame } from '../game/store.ts'
import {
  arbiterDefeated, arenaOpen, beaconScript, beaconVisible, doorOpen, npcVisible, onArbiterDefeated as arbiterOutcome, onDevice,
  onEnterArea, onGuardDefeated, onKeycard, onLogPicked, onPylon, onReachOutpost, onTerminal, onWardenDefeated as wardenOutcome,
  powerRestored, questStep, spireGate, talk, wardenDefeated, type Notice,
} from '../game/story.ts'
import type { Tileset } from './art.ts'
import { variantFor } from './art.ts'
import { playMusic, sfx, type Track } from './audio.ts'
import { Drone, Enemy, FACING_VEC, FEET, Player, Sentinel, Warden, bodyRect, type Controls, type Facing, type Machine } from './actors.ts'
import { Arbiter, Heavy, Phantom, Technician } from './actors2.ts'
import { takeTouch, touch } from './input.ts'

// ---------- Visual effects ----------

export class Fx {
  private readonly scene: Phaser.Scene
  private readonly texts: Phaser.GameObjects.Text[] = []
  private readonly sparks: Phaser.GameObjects.Particles.ParticleEmitter

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.sparks = scene.add.particles(0, 0, 'fx', {
      frame: 'px',
      speed: { min: 30, max: 100 },
      lifespan: { min: 150, max: 350 },
      scale: { start: 1, end: 0 },
      emitting: false,
    })
    this.sparks.setDepth(960)
  }

  number(x: number, y: number, text: string, color: string) {
    let t = this.texts.find((x) => !x.visible)
    if (!t) {
      if (this.texts.length >= 16) return
      t = this.scene.add.text(0, 0, '', { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#fff', stroke: '#070a16', strokeThickness: 2 })
      t.setOrigin(0.5).setDepth(980)
      this.texts.push(t)
    }
    const label = t
    label.setText(text).setColor(color).setPosition(Math.round(x), Math.round(y)).setAlpha(1).setVisible(true)
    this.scene.tweens.add({ targets: label, y: y - 14, alpha: 0, duration: 650, ease: 'Quad.easeOut', onComplete: () => label.setVisible(false) })
  }

  spark(x: number, y: number, tint = 0xffffff, n = 6) {
    this.sparks.setParticleTint(tint)
    this.sparks.explode(n, x, y)
  }

  boom(x: number, y: number, big = false) {
    const s = this.scene.add.sprite(x, y, 'fx', 'boom-0').setDepth(970).setScale(big ? 2 : 1)
    s.play('fx-boom')
    s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.destroy())
  }

  /** An expanding ring: shows the reach of a slam or a landing. */
  shockwave(x: number, y: number, radius: number, color: number) {
    const g = this.scene.add.graphics().setDepth(965).setBlendMode(Phaser.BlendModes.ADD)
    const state = { r: 4 }
    this.scene.tweens.add({
      targets: state,
      r: radius,
      duration: 260,
      ease: 'Quad.easeOut',
      onUpdate: () => g.clear().lineStyle(2, color, 1 - state.r / (radius * 1.4)).strokeCircle(x, y, state.r),
      onComplete: () => g.destroy(),
    })
  }

  ghost(src: Phaser.GameObjects.Sprite) {
    const g = this.scene.add.image(src.x, src.y, src.texture.key, src.frame.name).setFlipX(src.flipX).setTint(0x3ef0ff).setAlpha(0.55).setDepth(src.depth - 1)
    this.scene.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() })
  }

  slash(x: number, y: number, facing: Facing) {
    const angle = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[facing]
    const s = this.scene.add.sprite(x, y, 'fx', 'slash-0').setRotation(angle).setDepth(y + 20)
    s.play('fx-slash')
    s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.destroy())
  }

  shake(ms: number, intensity: number) {
    if (!useGame.getState().settings.reducedMotion) this.scene.cameras.main.shake(ms, intensity)
  }
}

// ---------- The scene ----------

interface Interactable {
  kind: 'npc' | InteractKind
  id?: string
  x: number
  y: number
  sprite?: Phaser.GameObjects.Sprite
}
interface Vent {
  x: number
  y: number
  offset: number
  steam: Phaser.GameObjects.Sprite
  hurtAt: number
}

/** What a door looks like once open. */
const OPEN_ART: Partial<Record<TileKind, string>> = {
  gate: 'gateopen', blastdoor: 'blastopen', barrierA: 'barrieroff', barrierB: 'barrieroff', keydoor: 'keydooropen', cracked: 'rubble', seal: 'sealopen',
}
const VENT_CYCLE = 3200
const VENT_WARN = 2100
const VENT_BURST = 2650

export class WorldScene extends Phaser.Scene {
  area!: AreaDef
  player!: Player
  fx!: Fx
  private objects!: Phaser.Tilemaps.TilemapLayer
  private ground!: Phaser.Tilemaps.TilemapLayer
  private tileset!: Tileset
  private enemies: Machine[] = []
  private boss: Warden | Arbiter | null = null
  private pickups: { def: Pickup; sprite: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image }[] = []
  private interactables: Interactable[] = []
  private shots!: Phaser.Physics.Arcade.Group
  private foeShots!: Phaser.Physics.Arcade.Group
  private prompt!: Phaser.GameObjects.Image
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private pointerQueue: { melee: boolean; ranged: boolean; aim: { x: number; y: number } | null } = { melee: false, ranged: false, aim: null }
  private waterTiles: Phaser.Tilemaps.Tile[] = []
  private dynamic: { x: number; y: number; kind: TileKind }[] = []
  private vents: Vent[] = []
  private summons = 0
  private fightActive = false
  private leaving = false
  /** Exits are ignored for a moment after arriving, so a knock-back cannot bounce Kael straight out. */
  private exitsFrom = 0
  private regenAcc = 0
  private regenAt = 0
  private waterAt = 0
  private fullWarnAt = 0
  private quietUntil = 0
  private wasBlocked = false
  private readonly pressed = new Set<string>()
  private unsubs: (() => void)[] = []

  constructor() {
    super('world')
  }

  get machines(): readonly Machine[] {
    return this.enemies
  }

  create() {
    const st = useGame.getState()
    this.area = AREAS[st.save.world.area]
    this.enemies = []
    this.boss = null
    this.pickups = []
    this.interactables = []
    this.waterTiles = []
    this.dynamic = []
    this.vents = []
    this.fightActive = false
    this.leaving = false
    this.exitsFrom = this.time.now + 900
    this.regenAcc = 0
    this.wasBlocked = false
    this.tileset = this.registry.get('tileset') as Tileset

    this.buildMap()
    this.fx = new Fx(this)
    this.player = new Player(this, live.x, live.y)
    this.physics.add.collider(this.player, this.objects)
    this.physics.add.collider(this.player, this.ground)
    this.spawnWorld()

    this.shots = this.physics.add.group({ maxSize: 30, allowGravity: false })
    this.foeShots = this.physics.add.group({ maxSize: 60, allowGravity: false })
    this.physics.add.collider(this.shots, this.objects, (s, t) => {
      this.breakWall(t as Phaser.Tilemaps.Tile)
      this.killShot(s as Phaser.Physics.Arcade.Sprite, true)
    })
    this.physics.add.collider(this.foeShots, this.objects, (s) => this.killShot(s as Phaser.Physics.Arcade.Sprite, true))

    this.prompt = this.add.image(0, 0, 'fx', 'prompt').setDepth(990).setVisible(false)
    this.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(2000)
    this.ambience()

    const cam = this.cameras.main
    cam.setBounds(0, 0, this.area.rows[0]!.length * TILE, this.area.rows.length * TILE)
    cam.startFollow(this.player, true, 0.14, 0.14)
    cam.setRoundPixels(true)
    cam.fadeIn(350, 7, 10, 22)

    this.setupInput()
    playMusic(this.area.music)
    st.setBoss(null)
    st.notify({ key: 'notice.area', params: { area: this.area.id }, kind: 'info' })
    st.apply(onEnterArea(useGame.getState().save, this.area.id))
    this.refreshDynamic()

    this.unsubs = [
      useGame.subscribe((s, prev) => {
        if (s.epoch !== prev.epoch) return void this.scene.restart()
        const a = s.save
        const b = prev.save
        if (a.quests !== b.quests || a.world.flags !== b.world.flags || a.world.collected !== b.world.collected || a.inventory !== b.inventory) this.refreshDynamic()
      }),
    ]
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubs.forEach((u) => u()))
  }

  // ---------- Map ----------

  private tileIndex(kind: string, x: number, y: number, row: string, above?: string, below?: string): number {
    const first = this.tileset.first[kind]!
    const n = this.tileset.count[kind]!
    if (kind === 'neon') {
      const c = row[x]
      const vertical = above?.[x] === c || below?.[x] === c
      const horizontal = row[x - 1] === c || row[x + 1] === c
      return first + (vertical && horizontal ? 2 : vertical ? 1 : 0)
    }
    if (kind === 'exit') return first + ((this.area.exits[row[x]!] as Exit | undefined)?.dir === 'down' ? 0 : 1)
    if (kind === 'water' || kind === 'pylon' || kind === 'cable' || kind === 'terminal') return first
    return first + variantFor(kind as never, x, y, n)
  }

  private buildMap() {
    const rows = this.area.rows
    const W = rows[0]!.length
    const H = rows.length
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: W, height: H })
    const ts = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!
    this.ground = map.createBlankLayer('ground', ts)!.setDepth(0)
    this.objects = map.createBlankLayer('objects', ts)!.setDepth(5)
    for (let y = 0; y < H; y++) {
      const row = rows[y]!
      for (let x = 0; x < W; x++) {
        const kind = this.area.legend[row[x]!]!
        if (OVERLAY.has(kind)) {
          this.ground.putTileAt(this.tileIndex(this.area.baseGround, x, y, row), x, y)
          this.objects.putTileAt(this.tileIndex(kind, x, y, row, rows[y - 1], rows[y + 1]), x, y)
        } else {
          const t = this.ground.putTileAt(this.tileIndex(kind, x, y, row, rows[y - 1], rows[y + 1]), x, y)
          if (kind === 'water') this.waterTiles.push(t)
        }
        if (DOORS.has(kind) || kind === 'pylon' || kind === 'cable' || kind === 'terminal') this.dynamic.push({ x, y, kind })
        if (kind === 'vent') this.addVent(x, y)
      }
    }
    const indices = (kinds: Iterable<string>) => [...kinds].flatMap((k) => (this.tileset.first[k] === undefined ? [] : Array.from({ length: this.tileset.count[k]! }, (_, i) => this.tileset.first[k]! + i)))
    this.objects.setCollision(indices(SOLID))
    this.ground.setCollision(indices(LIQUID))
  }

  /** Doors, barriers, broken walls, pylons and cables follow the save. */
  private refreshDynamic() {
    const save = useGame.getState().save
    const power = powerRestored(save)
    for (const { x, y, kind } of this.dynamic) {
      if (kind === 'cable') {
        const t = this.ground.getTileAt(x, y)
        if (t) t.index = this.tileset.first.cable! + (power ? 1 : 0)
        continue
      }
      if (kind === 'pylon') {
        const id = this.area.interactables.find((i) => i.kind === 'pylon' && i.x === x && i.y === y)?.id
        const on = PYLONS.some((f) => f === id && hasFlag(save, f))
        this.objects.putTileAt(this.tileset.first.pylon! + (on ? 1 : 0), x, y).setCollision(true)
        continue
      }
      if (kind === 'terminal') {
        this.objects.putTileAt(this.tileset.first.terminal! + (hasFlag(save, 'barrier_b') ? 1 : 0), x, y).setCollision(true)
        continue
      }
      // During a boss fight the arena locks behind Kael.
      const locked = this.fightActive && (kind === 'gate' || kind === 'seal')
      const open = !locked && doorOpen(kind, save, this.area.id, x, y)
      const art = open ? OPEN_ART[kind]! : kind
      this.objects.putTileAt(this.tileset.first[art]!, x, y).setCollision(!open)
    }
    for (const it of this.interactables) if (it.kind === 'beacon') it.sprite?.setVisible(beaconVisible(this.area.id, save))
  }

  /** A blade or a bolt hitting a cracked wall breaks it, for good. */
  private breakWall(t: Phaser.Tilemaps.Tile | null) {
    if (!t || !t.collides || t.index !== this.tileset.first.cracked) return
    const st = useGame.getState()
    const res = grantOnce(st.save, 'collected', wallId(this.area.id, t.x, t.y), {})
    if (!res.granted) return
    const cx = (t.x + 0.5) * TILE
    const cy = (t.y + 0.5) * TILE
    this.fx.boom(cx, cy, true)
    this.fx.spark(cx, cy, 0xffb347, 10)
    this.fx.shake(160, 0.006)
    sfx('explode')
    st.apply({ save: res.save, notices: [{ key: 'notice.secret', kind: 'info' }] }, false)
    useGame.getState().saveNow()
  }

  solidAt(px: number, py: number) {
    const t = this.objects.getTileAtWorldXY(px, py)
    return !!t && t.collides
  }

  hasLOS(x1: number, y1: number, x2: number, y2: number) {
    return this.objects.getTilesWithinShape(new Phaser.Geom.Line(x1, y1, x2, y2), { isColliding: true }).length === 0
  }

  arenaBounds() {
    const z = this.area.zones.arena!
    return new Phaser.Geom.Rectangle(z.x * TILE, z.y * TILE - TILE, z.w * TILE, z.h * TILE + TILE)
  }

  // ---------- Placing things ----------

  private spawnNpc(id: NpcId, x: number, y: number) {
    const c = { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE }
    const s = this.physics.add.staticSprite(c.x, c.y - FEET, id, 'down-idle-0').setDepth(c.y + 10)
    s.play(`${id}-down-idle`)
    ;(s.body as Phaser.Physics.Arcade.StaticBody).setSize(10, 6).setOffset(3, 9)
    this.physics.add.collider(this.player, s)
    this.interactables.push({ kind: 'npc', id, x: c.x, y: c.y, sprite: s })
  }

  private spawnEnemy(e: EnemySpawn): Machine {
    const m =
      e.kind === 'drone' ? new Drone(this, e)
      : e.kind === 'sentinel' ? new Sentinel(this, e)
      : e.kind === 'phantom' ? new Phantom(this, e)
      : e.kind === 'heavy' ? new Heavy(this, e)
      : new Technician(this, e)
    m.collider = this.physics.add.collider(m, [this.objects, this.ground])
    this.enemies.push(m)
    return m
  }

  private spawnWorld() {
    const save = useGame.getState().save
    const center = (x: number, y: number) => ({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE })

    for (const n of this.area.npcs) if (npcVisible(n.id, this.area.id, save)) this.spawnNpc(n.id, n.x, n.y)

    for (const i of this.area.interactables) {
      const c = center(i.x, i.y)
      const it: Interactable = { kind: i.kind, id: i.id, x: c.x, y: c.y }
      const solidSprite = (tex: string, frame: string, w: number, h: number, ox: number, oy: number, dy = FEET) => {
        const s = this.physics.add.staticSprite(c.x, c.y - dy, tex, frame).setDepth(c.y + 10)
        ;(s.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h).setOffset(ox, oy)
        this.physics.add.collider(this.player, s)
        return s
      }
      if (i.kind === 'bench') it.sprite = solidSprite('fx', 'bench', 14, 8, 1, 7)
      if (i.kind === 'device' && !save.inventory.items.transmission_device) {
        it.sprite = solidSprite('fx', 'device', 14, 8, 1, 7)
        this.glow(c.x, c.y - 6, 0x3ef0ff, 0.5)
      }
      if (i.kind === 'pod' && !arbiterDefeated(save)) {
        it.sprite = solidSprite('fx2', 'pod', 12, 8, 2, 15, 8)
        this.glow(c.x, c.y - 8, 0x3ef0ff, 0.5)
      }
      if (i.kind === 'beacon') {
        it.sprite = this.add.sprite(c.x, c.y - 4, 'fx2', 'beacon').setDepth(c.y + 4)
        this.glow(c.x, c.y - 6, 0x3ef0ff, 0.4)
      }
      // A pod that already opened has nothing more to say.
      if (i.kind === 'pod' && arbiterDefeated(save)) continue
      this.interactables.push(it)
    }

    for (const p of this.area.pickups) {
      if (save.world.collected.includes(p.id)) continue
      const c = center(p.x, p.y)
      const glow = this.glow(c.x, c.y, p.item === 'credits' ? 0xffb347 : p.item === 'echo_log' ? 0xff3ea5 : 0x3ef0ff, 0.45)
      const sprite = this.add.image(c.x, c.y - 2, 'icons', p.item).setDepth(c.y + 5)
      if (!useGame.getState().settings.reducedMotion) this.tweens.add({ targets: sprite, y: c.y - 5, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' })
      this.pickups.push({ def: p, sprite, glow })
    }

    for (const e of this.area.enemies) if (!save.world.defeated.includes(e.id)) this.spawnEnemy(e)

    const b = this.area.boss
    if (b?.kind === 'warden') {
      const w = new Warden(this, b.x * TILE, b.y * TILE)
      w.collider = this.physics.add.collider(w, this.objects)
      if (wardenDefeated(save)) {
        // The wreck stays in the arena as a reminder.
        w.state = 'dead'
        w.setFrame('dead')
        w.body.enable = false
      } else this.boss = w
    } else if (b?.kind === 'arbiter') {
      const a = new Arbiter(this, b.x * TILE, b.y * TILE)
      if (arbiterDefeated(save)) a.setDefeated()
      else this.boss = a
    }
  }

  private glow(x: number, y: number, tint: number, alpha: number) {
    const g = this.add.image(x, y, 'fx', 'glow').setTint(tint).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(4)
    if (!useGame.getState().settings.reducedMotion)
      this.tweens.add({ targets: g, alpha: alpha * 0.45, yoyo: true, repeat: -1, duration: 900 + Math.random() * 900, ease: 'Sine.easeInOut' })
    return g
  }

  private addVent(x: number, y: number) {
    const steam = this.add.sprite((x + 0.5) * TILE, y * TILE + 2, 'fx2', 'steam-0').setDepth((y + 1) * TILE + 12).setVisible(false)
    // Neighbouring vents are out of step, so there is always a way through.
    this.vents.push({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE, offset: ((x * 7 + y * 13) % 5) * 640, steam, hurtAt: 0 })
  }

  /** Lights, drifting particles: the world breathes even when nothing happens. */
  private ambience() {
    const rows = this.area.rows
    const glows: Partial<Record<TileKind, [number, number, number]>> = {
      lamp: [0x3ef0ff, 0.7, 1.6], crystal: [0x3ef0ff, 0.55, 1.3], window: [0x3ef0ff, 0.25, 1], spire: [0x3ef0ff, 0.3, 1],
      stack: [0xff7a3a, 0.4, 1.4], vent: [0xff7a3a, 0.25, 1], console: [0xff3ea5, 0.3, 1], lift: [0x3ef0ff, 0.5, 1.3],
      terminal: [0xff3ea5, 0.35, 1], ring: [0x3ef0ff, 0.12, 1],
    }
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const g = glows[kindAt(this.area, x, y)!]
        if (g) this.glow((x + 0.5) * TILE, (y + 0.5) * TILE, g[0], g[1]).setScale(g[2])
      }
    })
    const W = rows[0]!.length * TILE
    const H = rows.length * TILE
    const look: Record<string, { tint: number[]; freq: number; speedY: [number, number] }> = {
      nova7: { tint: [0x3ef0ff, 0x1aa6c4], freq: 160, speedY: [-7, -2] },
      wilds: { tint: [0x3ef0ff, 0xff3ea5, 0x59f39a, 0xb07ae0], freq: 70, speedY: [-7, -2] },
      // Embers and ash rising from the dead town.
      frontier: { tint: [0xff7a3a, 0xffb347, 0x8a3a22, 0xa9b8d8], freq: 55, speedY: [-14, -5] },
      spire1: { tint: [0xff3ea5, 0x3ef0ff], freq: 140, speedY: [-5, -1] },
      spire2: { tint: [0xff3ea5, 0x3ef0ff], freq: 140, speedY: [-5, -1] },
      chamber: { tint: [0xff3ea5, 0x3ef0ff, 0xf4f8ff], freq: 45, speedY: [-10, -3] },
    }
    const l = look[this.area.id]!
    this.add
      .particles(0, 0, 'fx', {
        frame: 'px',
        x: { min: 0, max: W },
        y: { min: 0, max: H },
        lifespan: 6000,
        speedY: { min: l.speedY[0], max: l.speedY[1] },
        speedX: { min: -4, max: 4 },
        alpha: { start: 0.8, end: 0 },
        scale: { start: 1, end: 0.5 },
        tint: l.tint,
        frequency: l.freq,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(800)
  }

  // ---------- Input ----------

  private setupInput() {
    const kb = this.input.keyboard!
    this.keys = kb.addKeys({
      up: 'W', up2: 'UP', up3: 'Z', down: 'S', down2: 'DOWN', left: 'A', left2: 'LEFT', left3: 'Q', right: 'D', right2: 'RIGHT',
      melee: 'J', ranged: 'K', dash: 'SPACE', interact: 'E', heal: 'ONE', energy: 'TWO',
    }) as Record<string, Phaser.Input.Keyboard.Key>
    // Actions are queued on key-down, so even a very quick tap (down and up in the same frame) is never lost.
    const actions = { J: 'melee', K: 'ranged', SPACE: 'dash', E: 'interact', ONE: 'heal', TWO: 'energy' } as const
    for (const [key, action] of Object.entries(actions))
      kb.on(`keydown-${key}`, (e: KeyboardEvent) => {
        if (!e.repeat) this.pressed.add(action)
      })
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      if (p.wasTouch || isBlocked(useGame.getState())) return
      if (p.rightButtonDown()) this.pointerQueue = { melee: false, ranged: true, aim: { x: p.worldX, y: p.worldY } }
      else this.pointerQueue = { melee: true, ranged: false, aim: null }
    })
  }

  private readControls(time: number): Controls & { interact: boolean; heal: boolean; energy: boolean } {
    const k = this.keys
    const down = (...names: string[]) => names.some((n) => k[n]!.isDown)
    const just = (action: string) => this.pressed.has(action)
    const x = (down('right', 'right2') ? 1 : 0) - (down('left', 'left2', 'left3') ? 1 : 0) + touch.x
    const y = (down('down', 'down2') ? 1 : 0) - (down('up', 'up2', 'up3') ? 1 : 0) + touch.y
    const q = this.pointerQueue
    this.pointerQueue = { melee: false, ranged: false, aim: null }
    const c = {
      x: Phaser.Math.Clamp(x, -1, 1),
      y: Phaser.Math.Clamp(y, -1, 1),
      melee: just('melee') || q.melee || takeTouch('melee'),
      ranged: just('ranged') || q.ranged || takeTouch('ranged'),
      dash: just('dash') || takeTouch('dash'),
      aim: q.aim,
      interact: just('interact') || takeTouch('interact'),
      heal: just('heal') || takeTouch('heal'),
      energy: just('energy'),
    }
    this.pressed.clear()
    if (time < this.quietUntil) (c.melee = c.ranged = c.dash = c.interact = c.heal = c.energy = false)
    return c
  }

  // ---------- Frame ----------

  override update(time: number, delta: number) {
    const st = useGame.getState()
    // Menus and conversations freeze physics and AI; animations and particles keep running.
    if (this.leaving || isBlocked(st)) {
      if (!this.physics.world.isPaused) this.physics.world.pause()
      this.readControls(time)
      this.wasBlocked = true
      return
    }
    if (this.wasBlocked) {
      this.wasBlocked = false
      this.physics.world.resume()
      // Keys used to close a menu must not trigger an action in the game.
      this.quietUntil = time + 150
    }
    live.playTime += delta / 1000
    const c = this.readControls(time)
    this.player.tick(c, time)
    if (c.heal) this.quickUse('healing_cell')
    if (c.energy) this.quickUse('energy_cell')

    for (const e of this.enemies) e.tick(time, this.player)
    this.enemies = this.enemies.filter((e) => !e.dead)
    this.boss?.tick(time, this.player)
    this.updateShots(time)
    this.updateVents(time)
    this.regen(time)

    if (!this.player.dead) {
      this.player.setDepth(this.player.feetY + 10)
      live.x = this.player.feetX
      live.y = this.player.feetY
      this.collectPickups(time)
      this.updateInteraction(c.interact)
      this.checkZones(time)
      this.checkExit(c.y)
    }
    if (time >= this.waterAt && this.waterTiles.length) {
      this.waterAt = time + 600
      const first = this.tileset.first.water!
      for (const t of this.waterTiles) t.index = t.index === first ? first + 1 : first
    }
  }

  /** Steam vents: quiet, then hissing puffs (the warning), then a scalding burst. */
  private updateVents(time: number) {
    for (const v of this.vents) {
      const phase = (time + v.offset) % VENT_CYCLE
      if (phase < VENT_WARN) {
        v.steam.setVisible(false)
        continue
      }
      const near = Phaser.Math.Distance.Between(this.player.feetX, this.player.feetY, v.x, v.y)
      if (phase < VENT_BURST) {
        v.steam.setVisible(true).setFrame('steam-0').setAlpha(Math.floor(time / 90) % 2 ? 0.55 : 0.25)
        continue
      }
      const f = Math.min(2, Math.floor((phase - VENT_BURST) / 140))
      v.steam.setVisible(true).setAlpha(0.9).setFrame(`steam-${f}`)
      if (phase - VENT_BURST < 30 && near < 120) sfx('dash')
      if (near < 11 && time >= v.hurtAt) (v.hurtAt = time + 700), this.hurtPlayer(9, v.x, v.y + 6)
    }
  }

  private regen(time: number) {
    if (time < this.regenAt) return
    this.regenAt = time + 250
    const st = useGame.getState()
    const max = statsOf(st.save).maxEnergy
    if (st.save.player.energy >= max) return
    this.regenAcc += statsOf(st.save).regen / 4
    const gain = Math.floor(this.regenAcc)
    if (!gain) return
    this.regenAcc -= gain
    st.update((s) => ({ ...s, player: { ...s.player, energy: Math.min(max, s.player.energy + gain) } }))
  }

  private quickUse(id: 'healing_cell' | 'energy_cell') {
    const st = useGame.getState()
    const before = st.save.player
    if (!st.useItem(id)) return sfx('empty')
    const after = useGame.getState().save.player
    sfx('heal')
    const gain = id === 'healing_cell' ? after.hp - before.hp : after.energy - before.energy
    this.fx.number(this.player.x, this.player.y - 12, `+${gain}`, id === 'healing_cell' ? '#59f39a' : '#3ef0ff')
  }

  // ---------- Combat ----------

  private bossBox(): Phaser.Geom.Rectangle | null {
    const b = this.boss
    if (!b || b.state === 'dormant' || b.state === 'dead' || b.state === 'dying') return null
    return b instanceof Warden ? new Phaser.Geom.Rectangle(b.x - 16, b.y - 20, 32, 42) : new Phaser.Geom.Rectangle(b.x - 14, b.y - 16, 28, 30)
  }

  /** Deals damage to a machine, showing what its shield (if any) absorbed. */
  private strike(e: Enemy, raw: number, fromX: number, fromY: number, color: string, time: number) {
    if (e.dormant()) return void e.hit(0, fromX, fromY, time)
    const full = damage(raw, e.def)
    const dmg = e.mitigate(full, fromX, fromY)
    if (dmg < full) (this.fx.spark(e.x, e.y - 2, 0xffb347, 8), sfx('empty'))
    else this.fx.spark(e.x, e.y, 0x3ef0ff)
    this.fx.number(e.x, e.y - 8, `${dmg}`, dmg < full ? '#ffb347' : color)
    e.hit(dmg, fromX, fromY, time)
  }

  private strikeBoss(raw: number, color: string, at: { x: number; y: number }, time: number) {
    const b = this.boss!
    const full = damage(raw, b.def)
    const dmg = b instanceof Arbiter ? b.mitigate(full) : full
    if (dmg < full) (this.fx.spark(at.x, at.y, 0xff3ea5, 8), sfx('empty'))
    else this.fx.spark(at.x, at.y, 0x3ef0ff, 8)
    this.fx.number(b.x, b.y - 22, `${dmg}`, dmg < full ? '#ff3ea5' : color)
    b.hit(dmg, time)
  }

  playerMelee(facing: Facing) {
    const [fx, fy] = FACING_VEC[facing]
    const cx = this.player.feetX + fx * 12
    const cy = this.player.feetY - 3 + fy * 12
    const box = fx ? new Phaser.Geom.Rectangle(cx - 10, cy - 9, 20, 18) : new Phaser.Geom.Rectangle(cx - 9, cy - 10, 18, 20)
    this.fx.slash(this.player.x + fx * 8, this.player.y + fy * 8 + 1, facing)
    sfx('slash')
    const atk = statsOf(useGame.getState().save).attack
    let landed = false
    const time = this.time.now
    for (const e of [...this.enemies]) {
      if (e.dead || !Phaser.Geom.Intersects.RectangleToRectangle(box, bodyRect(e.body))) continue
      landed = true
      this.strike(e, atk, this.player.feetX, this.player.feetY, '#f4f8ff', time)
    }
    const bb = this.bossBox()
    if (bb && Phaser.Geom.Intersects.RectangleToRectangle(box, bb)) {
      landed = true
      this.strikeBoss(atk, '#f4f8ff', { x: box.centerX, y: box.centerY }, time)
    }
    for (const t of this.objects.getTilesWithinWorldXY(box.x, box.y, box.width, box.height)) this.breakWall(t)
    if (landed) (sfx('hit'), this.fx.shake(60, 0.003))
  }

  /** Returns false when there was nothing to fire (no blaster equipped, or not enough energy). */
  playerFire(facing: Facing, aim: { x: number; y: number } | null): boolean {
    const st = useGame.getState()
    const weapon = st.save.inventory.equipped.ranged
    const spread = weapon ? SPREAD_WEAPONS[weapon] : undefined
    const cost = spread?.cost ?? PLAYER.rangedCost
    if (!weapon || st.save.player.energy < cost) {
      sfx('empty')
      this.fx.number(this.player.x, this.player.y - 12, '!', '#ff4d5e')
      return false
    }
    st.update((s) => ({ ...s, player: { ...s.player, energy: s.player.energy - cost } }))
    const [fx, fy] = FACING_VEC[facing]
    const ox = this.player.feetX + fx * 8
    const oy = this.player.feetY - 5 + fy * 6
    const a = aim ? Math.atan2(aim.y - oy, aim.x - ox) : Math.atan2(fy, fx)
    const bolts = spread?.bolts ?? 1
    const dmg = statsOf(st.save).ranged
    for (let i = 0; i < bolts; i++) {
      const angle = a + (i - (bolts - 1) / 2) * (spread?.spread ?? 0)
      const shot = this.shots.get(ox, oy, 'fx', 'plasma-0') as Phaser.Physics.Arcade.Sprite | null
      if (!shot) break
      shot.enableBody(true, ox, oy, true, true)
      shot.setDepth(oy + 20).play('fx-plasma')
      ;(shot.body as Phaser.Physics.Arcade.Body).setSize(6, 6).setAllowGravity(false)
      shot.setVelocity(Math.cos(angle) * 220, Math.sin(angle) * 220)
      // The scattergun's bolts fade quickly: a close-range weapon.
      shot.setData('until', this.time.now + (spread ? 420 : 900)).setData('dmg', dmg)
    }
    sfx(spread ? 'missile' : 'blaster')
    return true
  }

  foeShot(x: number, y: number, tx: number, ty: number, dmg: number) {
    this.foeShotAngle(x, y, Math.atan2(ty - y, tx - x), 125, dmg, 'bolt')
  }

  foeShotAngle(x: number, y: number, angle: number, speed: number, dmg: number, style: 'bolt' | 'mbolt' = 'mbolt') {
    const tex = style === 'bolt' ? 'fx' : 'fx2'
    const shot = this.foeShots.get(x, y, tex, `${style}-0`) as Phaser.Physics.Arcade.Sprite | null
    if (!shot) return
    shot.setTexture(tex, `${style}-0`)
    shot.enableBody(true, x, y, true, true)
    shot.setDepth(y + 20).play(`fx-${style}`)
    ;(shot.body as Phaser.Physics.Arcade.Body).setSize(5, 5).setAllowGravity(false)
    shot.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
    shot.setData('until', this.time.now + (style === 'bolt' ? 2400 : 4200)).setData('dmg', dmg)
  }

  private killShot(s: Phaser.Physics.Arcade.Sprite, spark = false) {
    if (!s.active) return
    if (spark) this.fx.spark(s.x, s.y, s.frame.name.startsWith('bolt') ? 0xff4d5e : s.frame.name.startsWith('mbolt') ? 0xff3ea5 : 0x3ef0ff, 4)
    s.disableBody(true, true)
  }

  private updateShots(time: number) {
    for (const s of this.shots.getMatching('active', true) as Phaser.Physics.Arcade.Sprite[]) {
      if (time > (s.getData('until') as number)) {
        this.killShot(s)
        continue
      }
      const r = s.getBounds()
      const raw = s.getData('dmg') as number
      const target = this.enemies.find((e) => !e.dead && Phaser.Geom.Intersects.RectangleToRectangle(r, bodyRect(e.body)))
      if (target) {
        this.strike(target, raw, s.x, s.y, '#3ef0ff', time)
        sfx('hit')
        this.killShot(s, true)
        continue
      }
      const bb = this.bossBox()
      if (bb && Phaser.Geom.Intersects.RectangleToRectangle(r, bb)) {
        this.strikeBoss(raw, '#3ef0ff', { x: s.x, y: s.y }, time)
        sfx('hit')
        this.killShot(s, true)
      }
    }
    for (const s of this.foeShots.getMatching('active', true) as Phaser.Physics.Arcade.Sprite[]) {
      if (time > (s.getData('until') as number)) {
        this.killShot(s)
        continue
      }
      if (!this.player.dead && Phaser.Geom.Intersects.RectangleToRectangle(s.getBounds(), bodyRect(this.player.body))) {
        this.hurtPlayer(s.getData('dmg') as number, s.x, s.y)
        this.killShot(s, true)
      }
    }
  }

  hurtPlayer(raw: number, fromX: number, fromY: number) {
    const time = this.time.now
    if (this.player.dead || time < this.player.invulnUntil) return
    const st = useGame.getState()
    const dmg = damage(raw, statsOf(st.save).defense)
    const hp = Math.max(0, st.save.player.hp - dmg)
    st.update((s) => ({ ...s, player: { ...s.player, hp } }))
    this.fx.number(this.player.x, this.player.y - 12, `-${dmg}`, '#ff4d5e')
    this.player.hurt(time, fromX, fromY)
    sfx('hurt')
    this.fx.shake(130, 0.006)
    if (hp > 0) return
    this.player.die()
    playMusic(null)
    sfx('death')
    this.time.delayedCall(1700, () => useGame.getState().setGameOver(true))
  }

  onEnemyKilled(e: Machine) {
    // Machines summoned by a boss give nothing: no farming the fight.
    if (e.summoned) return
    const st = useGame.getState()
    const res = grantOnce(st.save, 'defeated', e.spawn.id, enemyReward(e.spawn.kind, e.spawn.drop))
    if (!res.granted) return
    const reward = enemyReward(e.spawn.kind, e.spawn.drop)
    this.fx.number(e.x, e.y - 16, `+${reward.xp} XP`, '#59f39a')
    this.time.delayedCall(250, () => this.fx.number(e.x, e.y - 8, `+${reward.credits}¢`, '#ffb347'))
    const notices: Notice[] = e.spawn.drop ? [{ key: 'notice.item', params: { item: e.spawn.drop.item, amount: e.spawn.drop.amount }, kind: 'item' }] : []
    if (res.levelUp) notices.push({ key: 'notice.levelUp', params: { level: res.levelUp }, kind: 'level' })
    st.apply({ save: res.save, notices }, false)
    if (e.spawn.guard) st.apply(onGuardDefeated(useGame.getState().save))
  }

  // ---------- Bosses ----------

  summonCount() {
    return this.enemies.filter((e) => e.summoned && !e.dead).length
  }

  summonPhantoms(x: number, y: number) {
    for (const dx of [-1, 1]) {
      const spawn: EnemySpawn = { id: `summon_${++this.summons}`, kind: 'phantom', x: x / TILE + dx * 3 - 0.5, y: y / TILE - 0.5 }
      const m = this.spawnEnemy(spawn)
      m.summoned = true
      this.fx.shockwave(m.x, m.y, 18, 0xff3ea5)
    }
    sfx('zap')
  }

  clearSummons() {
    for (const e of this.enemies) if (e.summoned && !e.dead) e.hit(9999, e.x, e.y - 1, this.time.now)
  }

  private startFight(time: number) {
    const b = this.boss
    if (!b || this.fightActive) return
    this.fightActive = true
    this.refreshDynamic()
    sfx('door')
    const arbiter = b instanceof Arbiter
    playMusic((arbiter ? 'arbiter' : 'boss') satisfies Track)
    b.wake(time)
    useGame.getState().notify({ key: arbiter ? 'notice.arbiterName' : 'notice.bossName', kind: 'info' })
  }

  onWardenDefeated() {
    const st = useGame.getState()
    this.fightActive = false
    this.boss = null
    st.setBoss(null)
    st.apply(wardenOutcome(useGame.getState().save))
    this.refreshDynamic()
    sfx('door')
    playMusic('wilds')
  }

  onArbiterDefeated() {
    const st = useGame.getState()
    this.fightActive = false
    this.boss = null
    st.setBoss(null)
    st.apply(arbiterOutcome(useGame.getState().save))
    this.refreshDynamic()
    sfx('door')
    playMusic('chamber')
    // The pod opens: Rook steps out.
    const pod = this.interactables.find((i) => i.kind === 'pod')
    if (pod) {
      pod.sprite?.destroy()
      this.interactables = this.interactables.filter((i) => i !== pod)
      this.fx.shockwave(pod.x, pod.y - 8, 24, 0x3ef0ff)
    }
    const rook = this.area.npcs.find((n) => n.id === 'rook')
    if (rook && npcVisible('rook', this.area.id, useGame.getState().save)) this.spawnNpc('rook', rook.x, rook.y)
  }

  // ---------- Pickups, conversations, zones, exits ----------

  private collectPickups(time: number) {
    for (const p of this.pickups) {
      if (!p.sprite.active || Phaser.Math.Distance.Between(this.player.feetX, this.player.feetY, p.sprite.x, p.sprite.y + 2) > 11) continue
      const st = useGame.getState()
      const item = p.def.item
      if (item !== 'credits' && count(st.save.inventory, item) >= ITEMS[item].max) {
        if (time > this.fullWarnAt) (this.fullWarnAt = time + 2500), st.notify({ key: 'notice.full', params: { item }, kind: 'info' })
        continue
      }
      const res = grantOnce(st.save, 'collected', p.def.id, item === 'credits' ? { credits: p.def.amount } : { items: { [item]: p.def.amount } })
      if (!res.granted) continue
      let save = res.save
      const slot = item !== 'credits' ? ITEMS[item].slot : undefined
      // New equipment goes straight into an empty slot.
      if (slot && !save.inventory.equipped[slot]) save = { ...save, inventory: equip(save.inventory, item as ItemId) ?? save.inventory }
      st.apply({ save, notices: [{ key: item === 'credits' ? 'notice.credits' : 'notice.item', params: { item, amount: p.def.amount }, kind: 'item' }] }, false)
      if (item === 'spire_keycard') st.apply(onKeycard(useGame.getState().save))
      if (item === 'echo_log') {
        st.apply(onLogPicked(useGame.getState().save))
        st.openDialogue({ speaker: 'archive', text: `log.${p.def.id}` })
      }
      sfx('pickup')
      this.fx.spark(p.sprite.x, p.sprite.y, item === 'credits' ? 0xffb347 : 0x3ef0ff, 8)
      p.sprite.destroy()
      p.glow.destroy()
    }
    this.pickups = this.pickups.filter((p) => p.sprite.active)
  }

  private updateInteraction(pressed: boolean) {
    const st = useGame.getState()
    const save = st.save
    let best: Interactable | null = null
    let bestD = 22
    for (const it of this.interactables) {
      if (it.kind === 'arenaGate' && arenaOpen(save)) continue
      if (it.kind === 'device' && !it.sprite?.active && save.inventory.items.transmission_device) continue
      if (it.kind === 'beacon' && !beaconVisible(this.area.id, save)) continue
      const d = Phaser.Math.Distance.Between(this.player.feetX, this.player.feetY, it.x, it.y)
      if (d < bestD) (best = it), (bestD = d)
    }
    st.setCanInteract(best !== null)
    if (!best) return void this.prompt.setVisible(false)
    const lift = best.kind === 'npc' ? 22 : best.kind === 'pod' ? 30 : 18
    this.prompt.setVisible(true).setPosition(Math.round(best.x), Math.round(best.y - lift - (Math.floor(this.time.now / 300) % 2)))
    if (!pressed) return
    sfx('ui')
    switch (best.kind) {
      case 'npc': {
        const s = best.sprite!
        const dx = this.player.feetX - best.x
        const dy = this.player.feetY - best.y
        const dir = Math.abs(dx) > Math.abs(dy) ? 'side' : dy > 0 ? 'down' : 'up'
        s.setFlipX(dir === 'side' && dx < 0).play(`${best.id}-${dir}-idle`)
        st.openDialogue(talk(best.id as NpcId, save))
        break
      }
      case 'bench':
        st.openPanel('bench')
        break
      case 'device': {
        const o = onDevice(save)
        st.apply(o)
        st.openDialogue({ speaker: 'archive', text: o.message })
        if (useGame.getState().save.inventory.items.transmission_device) best.sprite?.destroy()
        break
      }
      case 'arenaGate':
        st.openDialogue({ speaker: 'archive', text: 'msg.gateSealed' })
        break
      case 'spireGate':
        st.openDialogue(spireGate(save))
        break
      case 'pylon': {
        const o = onPylon(save, best.id ?? '')
        st.apply(o)
        if (o.message === 'msg.pylonActivated' || o.message === 'msg.powerRestored') (sfx('charge'), this.fx.shockwave(best.x, best.y - 6, 22, 0x3ef0ff))
        st.openDialogue({ speaker: 'archive', text: o.message })
        break
      }
      case 'terminal': {
        const o = onTerminal(save)
        st.apply(o)
        sfx('door')
        st.openDialogue({ speaker: 'archive', text: o.message })
        break
      }
      case 'beacon':
        st.openDialogue(beaconScript(this.area.id))
        break
      case 'pod':
        st.openDialogue({ speaker: 'archive', text: 'msg.podSealed' })
        break
    }
  }

  private checkZones(time: number) {
    const st = useGame.getState()
    const { outpost, arena } = this.area.zones
    const px = this.player.feetX
    const py = this.player.feetY
    if (outpost && questStep(st.save, 'lost_transmission') === 'explore_wilds' && inZone(outpost, px, py)) st.apply(onReachOutpost(st.save))
    const canFight = this.area.id !== 'wilds' || arenaOpen(st.save)
    if (arena && this.boss?.state === 'dormant' && canFight && inZone(arena, px, py)) this.startFight(time)
  }

  /** Leaving takes a deliberate step toward the exit: being knocked onto it is not enough. */
  private checkExit(inputY: number) {
    const exit = exitAt(this.area, Math.floor(this.player.feetX / TILE), Math.floor(this.player.feetY / TILE))
    if (!exit || this.leaving || this.time.now < this.exitsFrom) return
    if (exit.dir === 'down' ? inputY < 0.3 : inputY > -0.3) return
    this.leaving = true
    this.player.setVelocity(0, 0)
    sfx('door')
    this.cameras.main.fadeOut(300, 7, 10, 22)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // Arriving somewhere new is a checkpoint (the store saves and rebuilds the world there).
      useGame.getState().travel(exit.to, exit.entry)
    })
  }
}
