// The playable world: tile map, collisions, camera, combat, pickups, conversations, quest triggers and area changes.
import Phaser from 'phaser'
import { ITEMS, type ItemId, type NpcId } from '../game/data.ts'
import { AREAS, LIQUID, OVERLAY, SOLID, TILE, inZone, kindAt, type AreaDef, type InteractKind, type Pickup } from '../game/maps.ts'
import { count, damage, enemyReward, equip, grantOnce, statsOf } from '../game/state.ts'
import { isBlocked, live, useGame } from '../game/store.ts'
import {
  arenaOpen, onDevice, onEnterArea, onGuardDefeated, onReachOutpost, onWardenDefeated as wardenOutcome, questStep, spireMessage, talk,
  wardenDefeated, type Notice,
} from '../game/story.ts'
import type { Tileset } from './art.ts'
import { variantFor } from './art.ts'
import { playMusic, sfx } from './audio.ts'
import { Drone, FACING_VEC, FEET, Player, Sentinel, Warden, bodyRect, type Controls, type Facing, type Machine } from './actors.ts'
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
  id?: NpcId
  x: number
  y: number
  sprite?: Phaser.GameObjects.Sprite
}

const AREA_MUSIC = { nova7: 'colony', wilds: 'wilds' } as const

export class WorldScene extends Phaser.Scene {
  area!: AreaDef
  player!: Player
  fx!: Fx
  private objects!: Phaser.Tilemaps.TilemapLayer
  private ground!: Phaser.Tilemaps.TilemapLayer
  private tileset!: Tileset
  private enemies: Machine[] = []
  private warden: Warden | null = null
  private pickups: { def: Pickup; sprite: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image }[] = []
  private interactables: Interactable[] = []
  private shots!: Phaser.Physics.Arcade.Group
  private foeShots!: Phaser.Physics.Arcade.Group
  private prompt!: Phaser.GameObjects.Image
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private pointerQueue: { melee: boolean; ranged: boolean; aim: { x: number; y: number } | null } = { melee: false, ranged: false, aim: null }
  private waterTiles: Phaser.Tilemaps.Tile[] = []
  private gateTiles: { x: number; y: number }[] = []
  private fightActive = false
  private leaving = false
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

  create() {
    const st = useGame.getState()
    this.area = AREAS[st.save.world.area]
    this.enemies = []
    this.warden = null
    this.pickups = []
    this.interactables = []
    this.waterTiles = []
    this.gateTiles = []
    this.fightActive = false
    this.leaving = false
    this.regenAcc = 0
    this.wasBlocked = false
    this.tileset = this.registry.get('tileset') as Tileset

    this.buildMap()
    this.fx = new Fx(this)
    this.player = new Player(this, live.x, live.y)
    this.physics.add.collider(this.player, this.objects)
    this.physics.add.collider(this.player, this.ground)
    this.spawnWorld()

    this.shots = this.physics.add.group({ maxSize: 24, allowGravity: false })
    this.foeShots = this.physics.add.group({ maxSize: 40, allowGravity: false })
    this.physics.add.collider(this.shots, this.objects, (s) => this.killShot(s as Phaser.Physics.Arcade.Sprite, true))
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
    playMusic(AREA_MUSIC[this.area.id])
    st.setBoss(null)
    st.notify({ key: 'notice.area', params: { area: this.area.id }, kind: 'info' })
    if (this.area.id === 'wilds') st.apply(onEnterArea(useGame.getState().save, 'wilds'))
    this.refreshGates()

    this.unsubs = [
      useGame.subscribe((s, prev) => {
        if (s.epoch !== prev.epoch) this.scene.restart()
        else if (s.save.quests !== prev.save.quests) this.refreshGates()
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
    if (kind === 'exit') return first + (this.area.id === 'nova7' ? 0 : 1)
    if (kind === 'water') return first
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
          if (kind === 'gate') this.gateTiles.push({ x, y })
        } else {
          const t = this.ground.putTileAt(this.tileIndex(kind, x, y, row, rows[y - 1], rows[y + 1]), x, y)
          if (kind === 'water') this.waterTiles.push(t)
        }
      }
    }
    const indices = (kinds: Iterable<string>) => [...kinds].flatMap((k) => (this.tileset.first[k] === undefined ? [] : Array.from({ length: this.tileset.count[k]! }, (_, i) => this.tileset.first[k]! + i)))
    this.objects.setCollision(indices(SOLID))
    this.ground.setCollision(indices(LIQUID))
  }

  /** Opens the arena gate once the second quest begins; closes it during the fight. */
  private refreshGates() {
    if (!this.gateTiles.length) return
    const open = arenaOpen(useGame.getState().save) && !this.fightActive
    const index = this.tileset.first[open ? 'gateopen' : 'gate']!
    for (const { x, y } of this.gateTiles) {
      const t = this.objects.putTileAt(index, x, y)
      t.setCollision(!open)
    }
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

  private spawnWorld() {
    const save = useGame.getState().save
    const center = (x: number, y: number) => ({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE })

    for (const n of this.area.npcs) {
      const c = center(n.x, n.y)
      const s = this.physics.add.staticSprite(c.x, c.y - FEET, n.id, 'down-idle-0').setDepth(c.y + 10)
      s.play(`${n.id}-down-idle`)
      ;(s.body as Phaser.Physics.Arcade.StaticBody).setSize(10, 6).setOffset(3, 9)
      this.physics.add.collider(this.player, s)
      this.interactables.push({ kind: 'npc', id: n.id, x: c.x, y: c.y, sprite: s })
    }

    for (const i of this.area.interactables) {
      const c = center(i.x, i.y)
      const it: Interactable = { kind: i.kind, x: c.x, y: c.y }
      if (i.kind === 'bench' || (i.kind === 'device' && !save.inventory.items.transmission_device)) {
        const s = this.physics.add.staticSprite(c.x, c.y - FEET, 'fx', i.kind).setDepth(c.y + 10)
        ;(s.body as Phaser.Physics.Arcade.StaticBody).setSize(14, 8).setOffset(1, 7)
        this.physics.add.collider(this.player, s)
        it.sprite = s
        if (i.kind === 'device') this.glow(c.x, c.y - 6, 0x3ef0ff, 0.5)
      }
      this.interactables.push(it)
    }

    for (const p of this.area.pickups) {
      if (save.world.collected.includes(p.id)) continue
      const c = center(p.x, p.y)
      const glow = this.glow(c.x, c.y, p.item === 'credits' ? 0xffb347 : 0x3ef0ff, 0.45)
      const sprite = this.add.image(c.x, c.y - 2, 'icons', p.item).setDepth(c.y + 5)
      if (!useGame.getState().settings.reducedMotion) this.tweens.add({ targets: sprite, y: c.y - 5, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' })
      this.pickups.push({ def: p, sprite, glow })
    }

    for (const e of this.area.enemies) {
      if (save.world.defeated.includes(e.id)) continue
      const m = e.kind === 'drone' ? new Drone(this, e) : new Sentinel(this, e)
      m.collider = this.physics.add.collider(m, [this.objects, this.ground])
      this.enemies.push(m)
    }

    if (this.area.boss) {
      const w = new Warden(this, this.area.boss.x * TILE, this.area.boss.y * TILE)
      w.collider = this.physics.add.collider(w, this.objects)
      if (wardenDefeated(save)) {
        // The wreck stays in the arena as a reminder.
        w.state = 'dead'
        w.setFrame('dead')
        w.body.enable = false
      } else this.warden = w
    }
  }

  private glow(x: number, y: number, tint: number, alpha: number) {
    const g = this.add.image(x, y, 'fx', 'glow').setTint(tint).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(4)
    if (!useGame.getState().settings.reducedMotion)
      this.tweens.add({ targets: g, alpha: alpha * 0.45, yoyo: true, repeat: -1, duration: 900 + Math.random() * 900, ease: 'Sine.easeInOut' })
    return g
  }

  /** Lights, drifting particles: the world breathes even when nothing happens. */
  private ambience() {
    const rows = this.area.rows
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const k = kindAt(this.area, x, y)
        if (k === 'lamp') this.glow((x + 0.5) * TILE, (y + 0.25) * TILE, 0x3ef0ff, 0.7).setScale(1.6)
        if (k === 'crystal') this.glow((x + 0.5) * TILE, (y + 0.5) * TILE, 0x3ef0ff, 0.55).setScale(1.3)
        if (k === 'window') this.glow((x + 0.5) * TILE, (y + 0.5) * TILE, 0x3ef0ff, 0.25)
        if (k === 'spire') this.glow((x + 0.5) * TILE, (y + 0.5) * TILE, 0x3ef0ff, 0.3)
      }
    })
    const W = rows[0]!.length * TILE
    const H = rows.length * TILE
    const wilds = this.area.id === 'wilds'
    this.add
      .particles(0, 0, 'fx', {
        frame: 'px',
        x: { min: 0, max: W },
        y: { min: 0, max: H },
        lifespan: wilds ? 7000 : 5000,
        speedY: { min: -7, max: -2 },
        speedX: { min: -4, max: 4 },
        alpha: { start: 0.8, end: 0 },
        scale: { start: 1, end: 0.5 },
        tint: wilds ? [0x3ef0ff, 0xff3ea5, 0x59f39a, 0xb07ae0] : [0x3ef0ff, 0x1aa6c4],
        frequency: wilds ? 70 : 160,
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
    this.warden?.tick(time, this.player)
    this.updateShots(time)
    this.regen(time)

    if (!this.player.dead) {
      this.player.setDepth(this.player.feetY + 10)
      live.x = this.player.feetX
      live.y = this.player.feetY
      this.collectPickups(time)
      this.updateInteraction(c.interact)
      this.checkZones(time)
      this.checkExit()
    }
    if (time >= this.waterAt && this.waterTiles.length) {
      this.waterAt = time + 600
      const first = this.tileset.first.water!
      for (const t of this.waterTiles) t.index = t.index === first ? first + 1 : first
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

  playerMelee(facing: Facing) {
    const [fx, fy] = FACING_VEC[facing]
    const cx = this.player.feetX + fx * 12
    const cy = this.player.feetY - 3 + fy * 12
    const box = fx ? new Phaser.Geom.Rectangle(cx - 10, cy - 9, 20, 18) : new Phaser.Geom.Rectangle(cx - 9, cy - 10, 18, 20)
    this.fx.slash(this.player.x + fx * 8, this.player.y + fy * 8 + 1, facing)
    sfx('slash')
    const st = useGame.getState()
    const atk = statsOf(st.save).attack
    let landed = false
    const time = this.time.now
    for (const e of this.enemies) {
      if (e.dead || !Phaser.Geom.Intersects.RectangleToRectangle(box, bodyRect(e.body))) continue
      landed = true
      if (e.dormant()) {
        e.hit(0, this.player.x, this.player.y, time)
        continue
      }
      const dmg = damage(atk, e.def)
      this.fx.number(e.x, e.y - 8, `${dmg}`, '#f4f8ff')
      this.fx.spark(e.x, e.y, 0x3ef0ff)
      e.hit(dmg, this.player.feetX, this.player.feetY, time)
    }
    const w = this.warden
    if (w && w.state !== 'dormant' && Phaser.Geom.Intersects.RectangleToRectangle(box, new Phaser.Geom.Rectangle(w.x - 16, w.y - 20, 32, 42))) {
      landed = true
      const dmg = damage(atk, w.def)
      this.fx.number(w.x, w.y - 22, `${dmg}`, '#f4f8ff')
      this.fx.spark(box.centerX, box.centerY, 0x3ef0ff, 8)
      w.hit(dmg, time)
    }
    if (landed) (sfx('hit'), this.fx.shake(60, 0.003))
  }

  /** Returns false when there was not enough energy. */
  playerFire(facing: Facing, aim: { x: number; y: number } | null): boolean {
    const st = useGame.getState()
    const cost = 8
    if (st.save.player.energy < cost) {
      sfx('empty')
      this.fx.number(this.player.x, this.player.y - 12, '!', '#ff4d5e')
      return false
    }
    st.update((s) => ({ ...s, player: { ...s.player, energy: s.player.energy - cost } }))
    const [fx, fy] = FACING_VEC[facing]
    const ox = this.player.feetX + fx * 8
    const oy = this.player.feetY - 5 + fy * 6
    const a = aim ? Math.atan2(aim.y - oy, aim.x - ox) : Math.atan2(fy, fx)
    const shot = this.shots.get(ox, oy, 'fx', 'plasma-0') as Phaser.Physics.Arcade.Sprite | null
    if (!shot) return true
    shot.enableBody(true, ox, oy, true, true)
    shot.setDepth(oy + 20).play('fx-plasma')
    ;(shot.body as Phaser.Physics.Arcade.Body).setSize(6, 6).setAllowGravity(false)
    shot.setVelocity(Math.cos(a) * 220, Math.sin(a) * 220)
    shot.setData('until', this.time.now + 900).setData('dmg', statsOf(st.save).ranged)
    sfx('blaster')
    return true
  }

  foeShot(x: number, y: number, tx: number, ty: number, dmg: number) {
    const shot = this.foeShots.get(x, y, 'fx', 'bolt-0') as Phaser.Physics.Arcade.Sprite | null
    if (!shot) return
    shot.enableBody(true, x, y, true, true)
    shot.setDepth(y + 20).play('fx-bolt')
    ;(shot.body as Phaser.Physics.Arcade.Body).setSize(5, 5).setAllowGravity(false)
    const a = Math.atan2(ty - y, tx - x)
    shot.setVelocity(Math.cos(a) * 125, Math.sin(a) * 125)
    shot.setData('until', this.time.now + 2400).setData('dmg', dmg)
  }

  private killShot(s: Phaser.Physics.Arcade.Sprite, spark = false) {
    if (!s.active) return
    if (spark) this.fx.spark(s.x, s.y, s.texture.key === 'fx' && s.frame.name.startsWith('bolt') ? 0xff4d5e : 0x3ef0ff, 4)
    s.disableBody(true, true)
  }

  private updateShots(time: number) {
    for (const s of this.shots.getMatching('active', true) as Phaser.Physics.Arcade.Sprite[]) {
      if (time > (s.getData('until') as number)) {
        this.killShot(s)
        continue
      }
      const r = s.getBounds()
      const dmgBase = s.getData('dmg') as number
      const target = this.enemies.find((e) => !e.dead && Phaser.Geom.Intersects.RectangleToRectangle(r, bodyRect(e.body)))
      if (target) {
        if (target.dormant()) target.hit(0, s.x, s.y, time)
        else {
          const dmg = damage(dmgBase, target.def)
          this.fx.number(target.x, target.y - 8, `${dmg}`, '#3ef0ff')
          target.hit(dmg, s.x, s.y, time)
          sfx('hit')
        }
        this.killShot(s, true)
        continue
      }
      const w = this.warden
      if (w && w.state !== 'dormant' && w.state !== 'dead' && Phaser.Geom.Intersects.RectangleToRectangle(r, new Phaser.Geom.Rectangle(w.x - 16, w.y - 20, 32, 42))) {
        const dmg = damage(dmgBase, w.def)
        this.fx.number(w.x, w.y - 22, `${dmg}`, '#3ef0ff')
        w.hit(dmg, time)
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

  // ---------- Boss ----------

  private startFight(time: number) {
    if (!this.warden || this.fightActive) return
    this.fightActive = true
    this.refreshGates()
    sfx('door')
    playMusic('boss')
    this.warden.wake(time)
    useGame.getState().notify({ key: 'notice.bossName', kind: 'info' })
  }

  onWardenDefeated() {
    const st = useGame.getState()
    this.fightActive = false
    this.warden = null
    st.setBoss(null)
    st.apply(wardenOutcome(useGame.getState().save))
    this.refreshGates()
    sfx('door')
    playMusic('wilds')
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
      const d = Phaser.Math.Distance.Between(this.player.feetX, this.player.feetY, it.x, it.y)
      if (d < bestD) (best = it), (bestD = d)
    }
    st.setCanInteract(best !== null)
    if (!best) return void this.prompt.setVisible(false)
    this.prompt.setVisible(true).setPosition(Math.round(best.x), Math.round(best.y - (best.kind === 'npc' ? 22 : 18) - (Math.floor(this.time.now / 300) % 2)))
    if (!pressed) return
    sfx('ui')
    switch (best.kind) {
      case 'npc': {
        const s = best.sprite!
        const dx = this.player.feetX - best.x
        const dy = this.player.feetY - best.y
        const dir = Math.abs(dx) > Math.abs(dy) ? 'side' : dy > 0 ? 'down' : 'up'
        s.setFlipX(dir === 'side' && dx < 0).play(`${best.id}-${dir}-idle`)
        st.openDialogue(talk(best.id!, save))
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
        st.openDialogue({ speaker: 'archive', text: spireMessage(save) })
        break
    }
  }

  private checkZones(time: number) {
    const st = useGame.getState()
    const { outpost, arena } = this.area.zones
    const px = this.player.feetX
    const py = this.player.feetY
    if (outpost && questStep(st.save, 'lost_transmission') === 'explore_wilds' && inZone(outpost, px, py)) st.apply(onReachOutpost(st.save))
    if (arena && this.warden && this.warden.state === 'dormant' && arenaOpen(st.save) && inZone(arena, px, py)) this.startFight(time)
  }

  private checkExit() {
    const k = kindAt(this.area, Math.floor(this.player.feetX / TILE), Math.floor(this.player.feetY / TILE))
    if (k !== 'exit' || this.leaving) return
    this.leaving = true
    this.player.setVelocity(0, 0)
    sfx('door')
    this.cameras.main.fadeOut(300, 7, 10, 22)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const to = this.area.exitTo
      const entry = AREAS[to].entries[this.area.id]!
      const st = useGame.getState()
      live.x = (entry.x + 0.5) * TILE
      live.y = (entry.y + 0.5) * TILE
      st.update((s) => ({ ...s, world: { ...s.world, area: to, x: live.x, y: live.y } }))
      // Arriving somewhere new is a checkpoint.
      useGame.getState().saveNow()
      this.scene.restart()
    })
  }
}

