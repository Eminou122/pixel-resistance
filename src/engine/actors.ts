// Kael, the machines and the Iron Warden: movement, state-machine AI and attacks.
import Phaser from 'phaser'
import { ENEMIES, PLAYER } from '../game/data.ts'
import { TILE, type EnemySpawn } from '../game/maps.ts'
import { guardsAwake } from '../game/story.ts'
import { useGame } from '../game/store.ts'
import { sfx } from './audio.ts'
import type { WorldScene } from './world.ts'

export type Facing = 'down' | 'up' | 'left' | 'right'
export const FACING_VEC: Record<Facing, readonly [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }
export const facingOf = (x: number, y: number): Facing =>
  Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : y > 0 ? 'down' : 'up'

export interface Controls {
  x: number
  y: number
  melee: boolean
  ranged: boolean
  dash: boolean
  /** World point to shoot at (mouse), or null to shoot where Kael faces. */
  aim: { x: number; y: number } | null
}

export const bodyRect = (b: Phaser.Physics.Arcade.Body) => new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height)
const overlaps = (a: Phaser.Physics.Arcade.Body, b: Phaser.Physics.Arcade.Body) =>
  Phaser.Geom.Intersects.RectangleToRectangle(bodyRect(a), bodyRect(b))

/** Sprites are drawn from their centre; gameplay positions are the feet. */
export const FEET = 4

// ---------- Kael ----------

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body
  facing: Facing = 'down'
  dead = false
  invulnUntil = 0
  private dashUntil = 0
  private dashReady = 0
  private meleeReady = 0
  private rangedReady = 0
  private attackUntil = 0
  private knockUntil = 0
  private ghostAt = 0
  private dashDir: [number, number] = [0, 1]

  constructor(scene: WorldScene, feetX: number, feetY: number) {
    super(scene, feetX, feetY - FEET, 'kael', 'down-idle-0')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setSize(10, 6).setOffset(3, 9)
    this.play('kael-down-idle')
  }

  get feetX() {
    return this.body.center.x
  }
  get feetY() {
    return this.body.center.y
  }
  /** Cooldown progress in [0, 1] for the HUD. */
  dashCharge(time: number) {
    return Phaser.Math.Clamp(1 - (this.dashReady - time) / PLAYER.dashCooldown, 0, 1)
  }

  private animate(state: 'idle' | 'walk' | 'attack') {
    const dir = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing
    this.setFlipX(this.facing === 'left')
    this.play(`kael-${dir}-${state}`, true)
  }

  tick(c: Controls, time: number) {
    if (this.dead) return
    const world = this.scene as WorldScene
    if (time < this.dashUntil) {
      this.setVelocity(this.dashDir[0] * PLAYER.dashSpeed, this.dashDir[1] * PLAYER.dashSpeed)
      if (time >= this.ghostAt) (world.fx.ghost(this), (this.ghostAt = time + 30))
      return
    }
    if (time < this.knockUntil) return

    let { x, y } = c
    const len = Math.hypot(x, y)
    // Normalised: moving diagonally is never faster than moving straight.
    if (len > 1) (x /= len), (y /= len)
    const moving = len > 0.2
    const attacking = time < this.attackUntil
    if (moving && !attacking) this.facing = facingOf(x, y)
    const speed = PLAYER.speed * (attacking ? 0.35 : 1)
    this.setVelocity(moving ? x * speed : 0, moving ? y * speed : 0)

    if (c.dash && time >= this.dashReady) {
      const [dx, dy] = moving ? [x / Math.hypot(x, y), y / Math.hypot(x, y)] : FACING_VEC[this.facing]
      this.dashDir = [dx, dy]
      this.dashUntil = time + PLAYER.dashTime
      this.dashReady = time + PLAYER.dashCooldown
      this.invulnUntil = Math.max(this.invulnUntil, time + PLAYER.dashTime + 80)
      sfx('dash')
      world.fx.ghost(this)
      return
    }
    if (c.melee && time >= this.meleeReady) {
      this.meleeReady = time + PLAYER.meleeCooldown
      this.attackUntil = time + 220
      world.playerMelee(this.facing)
      this.animate('attack')
    } else if (c.ranged && time >= this.rangedReady) {
      this.rangedReady = time + PLAYER.rangedCooldown
      if (c.aim) this.facing = facingOf(c.aim.x - this.feetX, c.aim.y - this.feetY)
      if (world.playerFire(this.facing, c.aim)) (this.attackUntil = time + 160), this.animate('attack')
    }
    if (time >= this.attackUntil) this.animate(moving ? 'walk' : 'idle')
    // Blink while recovering from a hit.
    this.setAlpha(time < this.invulnUntil && time > this.dashUntil + 80 ? (Math.floor(time / 70) % 2 ? 0.35 : 1) : 1)
  }

  hurt(time: number, fromX: number, fromY: number) {
    this.invulnUntil = time + PLAYER.hurtInvulnerability
    this.knockUntil = time + 140
    const a = Math.atan2(this.feetY - fromY, this.feetX - fromX)
    this.setVelocity(Math.cos(a) * 150, Math.sin(a) * 150)
    const dir = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing
    this.anims.stop()
    this.setFrame(`${dir}-hurt`)
    this.setTint(0xff4d5e)
    this.scene.time.delayedCall(140, () => this.active && this.clearTint())
  }

  die() {
    this.dead = true
    this.setVelocity(0, 0)
    this.setAlpha(1)
    this.body.enable = false
    this.setFlipX(false)
    this.play('kael-death')
  }
}

// ---------- Machines ----------

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body
  readonly spawn: EnemySpawn
  hp: number
  readonly maxHp: number
  readonly def: number
  readonly atk: number
  dead = false
  protected mode = 'idle'
  protected until = 0
  protected knockUntil = 0
  protected seenAt = -99999
  protected lastSeen = { x: 0, y: 0 }
  protected readonly home: { x: number; y: number }
  private losAt = 0
  private losCache = false
  private barUntil = 0
  private readonly bar: Phaser.GameObjects.Graphics
  private readonly shield: Phaser.GameObjects.Image | null
  collider: Phaser.Physics.Arcade.Collider | null = null

  constructor(scene: WorldScene, spawn: EnemySpawn, texture: string, frame: string) {
    super(scene, (spawn.x + 0.5) * TILE, (spawn.y + 0.5) * TILE - FEET, texture, frame)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.spawn = spawn
    const s = ENEMIES[spawn.kind]
    this.hp = this.maxHp = s.hp
    this.def = s.defense
    this.atk = s.attack
    this.home = { x: this.x, y: this.y }
    this.bar = scene.add.graphics().setDepth(900)
    this.shield = spawn.guard ? scene.add.image(this.x, this.y, 'fx', 'shield').setDepth(901).setAlpha(0.8) : null
  }

  protected get world() {
    return this.scene as WorldScene
  }
  dormant() {
    return !!this.spawn.guard && !guardsAwake(useGame.getState().save)
  }

  /** Can this machine see Kael? Walls block sight (checked a few times per second). */
  protected sees(p: Player, range: number, time: number) {
    if (p.dead || Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y) > range) return false
    if (time >= this.losAt) {
      this.losCache = this.world.hasLOS(this.x, this.y, p.x, p.y)
      this.losAt = time + 150
    }
    if (this.losCache) (this.seenAt = time), (this.lastSeen = { x: p.x, y: p.y })
    return this.losCache
  }

  protected moveToward(x: number, y: number, speed: number) {
    const a = Math.atan2(y - this.y, x - this.x)
    if (Phaser.Math.Distance.Between(this.x, this.y, x, y) < 2) this.setVelocity(0, 0)
    else this.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed)
  }

  protected touches(p: Player) {
    return !p.dead && overlaps(this.body, p.body)
  }

  /** Returns true when the hit destroys the machine. */
  hit(amount: number, fromX: number, fromY: number, time: number): boolean {
    if (this.dead) return false
    if (this.dormant()) {
      this.world.fx.spark(this.x, this.y, 0xff3ea5)
      sfx('empty')
      return false
    }
    this.hp -= amount
    this.barUntil = time + 2500
    this.setTintFill(0xffffff)
    this.scene.time.delayedCall(70, () => this.active && this.clearTint())
    const a = Math.atan2(this.y - fromY, this.x - fromX)
    this.setVelocity(Math.cos(a) * 150, Math.sin(a) * 150)
    this.knockUntil = time + 140
    if (this.hp > 0) return false
    this.die()
    return true
  }

  private die() {
    this.dead = true
    this.setVelocity(0, 0)
    this.body.enable = false
    this.collider?.destroy()
    this.bar.destroy()
    this.shield?.destroy()
    this.play(`${this.texture.key}-death`)
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.destroy())
    sfx('explode')
    this.world.fx.boom(this.x, this.y)
    this.world.onEnemyKilled(this)
  }

  private drawBar(time: number) {
    this.bar.clear()
    if (time > this.barUntil) return
    const x = Math.round(this.x - 8)
    const y = Math.round(this.y - 12)
    this.bar.fillStyle(0x070a16, 1).fillRect(x - 1, y - 1, 18, 4)
    this.bar.fillStyle(0xff4d5e, 1).fillRect(x, y, Math.max(1, Math.round((16 * this.hp) / this.maxHp)), 2)
  }

  protected abstract think(time: number, p: Player): void

  tick(time: number, p: Player) {
    if (this.dead) return
    this.setDepth(this.y + 10)
    this.shield?.setPosition(this.x, this.y).setVisible(this.dormant())
    this.drawBar(time)
    if (time < this.knockUntil) return
    if (this.dormant()) return void this.setVelocity(0, 0)
    this.think(time, p)
  }
}

export class Drone extends Enemy {
  private target: { x: number; y: number }
  private lunge = 0
  private struck = false

  constructor(scene: WorldScene, spawn: EnemySpawn) {
    super(scene, spawn, 'drone', 'hover-0')
    this.body.setSize(10, 8).setOffset(3, 6)
    this.target = spawn.patrol ? { x: (spawn.patrol[0] + 0.5) * TILE, y: (spawn.patrol[1] + 0.5) * TILE - FEET } : this.home
    this.play('drone-hover')
  }

  protected think(time: number, p: Player) {
    const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y)
    switch (this.mode) {
      case 'idle':
        this.moveToward(this.target.x, this.target.y, 36)
        if (Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 3)
          this.target = this.target === this.home && this.spawn.patrol ? { x: (this.spawn.patrol[0] + 0.5) * TILE, y: (this.spawn.patrol[1] + 0.5) * TILE - FEET } : this.home
        if (this.sees(p, 92, time)) (this.mode = 'chase'), sfx('zap')
        break
      case 'chase': {
        const sees = this.sees(p, 128, time)
        if (!sees && time - this.seenAt > 1600) {
          this.mode = 'return'
          break
        }
        this.moveToward(this.lastSeen.x, this.lastSeen.y, 66)
        if (sees && d < 22) {
          this.mode = 'windup'
          this.until = time + 340
          this.lunge = Math.atan2(p.y - this.y, p.x - this.x)
          this.play('drone-attack')
        }
        break
      }
      case 'windup':
        // Telegraph: the drone freezes and its eye flares before it lunges.
        this.setVelocity(0, 0)
        if (time >= this.until) {
          this.mode = 'strike'
          this.until = time + 210
          this.struck = false
          this.setVelocity(Math.cos(this.lunge) * 175, Math.sin(this.lunge) * 175)
        }
        break
      case 'strike':
        if (!this.struck && this.touches(p)) (this.struck = true), this.world.hurtPlayer(this.atk, this.x, this.y)
        if (time >= this.until || !this.body.blocked.none) (this.mode = 'recover'), (this.until = time + 520), this.setVelocity(0, 0)
        break
      case 'recover':
        if (time >= this.until) (this.mode = 'chase'), this.play('drone-hover')
        break
      case 'return':
        this.moveToward(this.home.x, this.home.y, 44)
        if (this.sees(p, 92, time)) this.mode = 'chase'
        else if (Phaser.Math.Distance.Between(this.x, this.y, this.home.x, this.home.y) < 3) (this.mode = 'idle'), (this.target = this.home)
        break
    }
  }
}

export class Sentinel extends Enemy {
  private nextShot = 0

  constructor(scene: WorldScene, spawn: EnemySpawn) {
    super(scene, spawn, 'sentinel', 'idle-0')
    this.body.setSize(12, 8).setOffset(2, 7)
    this.body.setMass(4)
    this.play('sentinel-idle')
  }

  protected think(time: number, p: Player) {
    const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y)
    const sees = this.sees(p, 150, time)
    switch (this.mode) {
      case 'idle':
        this.setVelocity(0, 0)
        if (sees) (this.mode = 'aim'), (this.nextShot = time + 450)
        break
      case 'aim':
        if (!sees && time - this.seenAt > 1400) {
          this.mode = 'idle'
          this.setVelocity(0, 0)
          break
        }
        // Keeps its distance: backs off when Kael closes in, creeps forward when he is far.
        if (d < 56) this.moveToward(this.x * 2 - p.x, this.y * 2 - p.y, 30)
        else if (d > 118) this.moveToward(this.lastSeen.x, this.lastSeen.y, 24)
        else this.setVelocity(0, 0)
        if (sees && time >= this.nextShot) {
          this.mode = 'charge'
          this.until = time + 560
          this.setVelocity(0, 0)
          this.play('sentinel-charge')
        }
        break
      case 'charge':
        this.setVelocity(0, 0)
        if (time >= this.until) {
          this.world.foeShot(this.x, this.y - 4, p.x, p.y, this.atk)
          sfx('zap')
          this.nextShot = time + 1350
          this.mode = 'aim'
          this.play('sentinel-idle')
        }
        break
    }
  }
}

export type Machine = Enemy

// ---------- The Iron Warden ----------

type WardenState = 'dormant' | 'intro' | 'idle' | 'missiles' | 'laserWarn' | 'laser' | 'chargeWarn' | 'charging' | 'stunned' | 'dying' | 'dead'
const PATTERNS = ['missiles', 'laser', 'charge'] as const

export class Warden extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body
  hp = ENEMIES.warden.hp
  readonly maxHp = ENEMIES.warden.hp
  readonly def = ENEMIES.warden.defense
  state: WardenState = 'dormant'
  private until = 0
  private queue: (typeof PATTERNS)[number][] = []
  private last: (typeof PATTERNS)[number] | null = null
  private markers: Phaser.GameObjects.Sprite[] = []
  private readonly beam: Phaser.GameObjects.Graphics
  private beamFrom = 0
  private beamSweep = 0
  private beamDur = 0
  private chargeDir = 0
  private chargesLeft = 0
  private chargeHit = false
  private contactAt = 0
  collider: Phaser.Physics.Arcade.Collider | null = null

  constructor(scene: WorldScene, x: number, y: number) {
    super(scene, x, y, 'warden', 'idle-0')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setSize(30, 14).setOffset(9, 31)
    this.body.pushable = false
    this.beam = scene.add.graphics().setDepth(950).setBlendMode(Phaser.BlendModes.ADD)
    this.setDepth(this.y + 10)
  }

  private get world() {
    return this.scene as WorldScene
  }
  get phase2() {
    return this.hp <= this.maxHp / 2
  }
  get eye() {
    return { x: this.x, y: this.y - 15 }
  }

  wake(time: number) {
    if (this.state !== 'dormant') return
    this.state = 'intro'
    this.until = time + 1400
    this.setFrame('telegraph')
    sfx('charge')
    this.world.fx.shake(500, 0.008)
    useGame.getState().setBoss({ hp: this.hp, max: this.maxHp })
  }

  private nextPattern(time: number) {
    if (!this.queue.length) this.queue = Phaser.Utils.Array.Shuffle([...PATTERNS])
    let pick = this.queue.shift()!
    if (pick === this.last && this.queue.length) (this.queue.push(pick), (pick = this.queue.shift()!))
    this.last = pick
    const p = this.world.player
    if (pick === 'missiles') {
      // Telegraph: target rings appear on the ground before the missiles land.
      const n = this.phase2 ? 5 : 3
      const zone = this.world.arenaBounds()
      for (let i = 0; i < n; i++) {
        const x = Phaser.Math.Clamp(p.feetX + (i ? Phaser.Math.Between(-40, 40) : 0), zone.x + 8, zone.right - 8)
        const y = Phaser.Math.Clamp(p.feetY + (i ? Phaser.Math.Between(-32, 32) : 0), zone.y + 8, zone.bottom - 8)
        this.markers.push(this.scene.add.sprite(x, y, 'fx', 'marker-0').play('fx-marker').setDepth(3))
      }
      this.state = 'missiles'
      this.until = time + (this.phase2 ? 760 : 980)
      this.setFrame('telegraph')
      sfx('missile')
    } else if (pick === 'laser') {
      const side = Math.random() < 0.5 ? -1 : 1
      const toPlayer = Math.atan2(p.feetY - this.eye.y, p.feetX - this.eye.x)
      this.beamFrom = toPlayer - side * 1.15
      this.beamSweep = side * 2.3
      this.beamDur = this.phase2 ? 1050 : 1450
      this.state = 'laserWarn'
      this.until = time + 720
      this.setFrame('laser')
      sfx('charge')
    } else {
      this.chargesLeft = this.phase2 ? 2 : 1
      this.prepareCharge(time, 680)
    }
  }

  private prepareCharge(time: number, warn: number) {
    const p = this.world.player
    this.chargeDir = Math.atan2(p.feetY - this.body.center.y, p.feetX - this.body.center.x)
    this.state = 'chargeWarn'
    this.until = time + warn
    this.setFrame('charge')
    this.setTint(0xff7a7a)
    sfx('charge')
  }

  /** End point of the laser: it stops at the first wall or pillar. */
  private beamEnd(angle: number) {
    const { x, y } = this.eye
    for (let d = 8; d < 300; d += 4) {
      const px = x + Math.cos(angle) * d
      const py = y + Math.sin(angle) * d
      if (this.world.solidAt(px, py)) return { x: px, y: py }
    }
    return { x: x + Math.cos(angle) * 300, y: y + Math.sin(angle) * 300 }
  }

  tick(time: number, p: Player) {
    if (this.state === 'dormant' || this.state === 'dead') return
    this.setDepth(this.y + 10)
    if (this.state === 'dying') return

    if (this.state !== 'charging' && !p.dead && overlaps(this.body, p.body) && time >= this.contactAt) {
      this.contactAt = time + 600
      this.world.hurtPlayer(10, this.x, this.y + 10)
    }

    switch (this.state) {
      case 'intro':
        if (time >= this.until) this.recover(time, 300)
        break
      case 'idle':
        this.setVelocity(0, 0)
        if (time >= this.until) this.nextPattern(time)
        break
      case 'missiles':
        if (time < this.until) break
        for (const m of this.markers) {
          this.world.fx.boom(m.x, m.y, true)
          if (Phaser.Math.Distance.Between(p.feetX, p.feetY, m.x, m.y) < 15) this.world.hurtPlayer(17, m.x, m.y)
          m.destroy()
        }
        this.markers = []
        sfx('explode')
        this.world.fx.shake(180, 0.006)
        this.recover(time, 700)
        break
      case 'laserWarn': {
        const end = this.beamEnd(this.beamFrom)
        this.beam.clear().lineStyle(1, 0xff4d5e, 0.5 + 0.5 * Math.sin(time / 40)).lineBetween(this.eye.x, this.eye.y, end.x, end.y)
        if (time >= this.until) (this.state = 'laser'), (this.until = time + this.beamDur), sfx('laser')
        break
      }
      case 'laser': {
        const t = 1 - (this.until - time) / this.beamDur
        const angle = this.beamFrom + this.beamSweep * Phaser.Math.Clamp(t, 0, 1)
        const end = this.beamEnd(angle)
        this.beam.clear().lineStyle(6, 0x1aa6c4, 0.8).lineBetween(this.eye.x, this.eye.y, end.x, end.y)
        this.beam.lineStyle(2, 0xf4f8ff, 1).lineBetween(this.eye.x, this.eye.y, end.x, end.y)
        const line = new Phaser.Geom.Line(this.eye.x, this.eye.y, end.x, end.y)
        if (distToSegment(p.feetX, p.feetY - 3, line) < 7) this.world.hurtPlayer(14, end.x, end.y)
        if (time >= this.until) (this.beam.clear(), this.recover(time, 650))
        break
      }
      case 'chargeWarn':
        this.setVelocity(0, 0)
        this.setTint(Math.floor(time / 80) % 2 ? 0xff7a7a : 0xffffff)
        if (time >= this.until) {
          this.clearTint()
          this.state = 'charging'
          this.until = time + 1200
          this.chargeHit = false
          this.setVelocity(Math.cos(this.chargeDir) * 230, Math.sin(this.chargeDir) * 230)
        }
        break
      case 'charging':
        if (!this.chargeHit && !p.dead && overlaps(this.body, p.body)) (this.chargeHit = true), this.world.hurtPlayer(21, this.x, this.y)
        if (!this.body.blocked.none) {
          // Slamming into a wall leaves the Warden stunned: the best moment to strike.
          this.setVelocity(0, 0)
          this.state = 'stunned'
          this.until = time + 1400
          this.setFrame('stagger')
          sfx('explode')
          this.world.fx.shake(260, 0.012)
          this.world.fx.boom(this.x + Math.cos(this.chargeDir) * 18, this.y + 10 + Math.sin(this.chargeDir) * 10)
          this.chargesLeft = 0
        } else if (time >= this.until) {
          this.setVelocity(0, 0)
          if (--this.chargesLeft > 0) this.prepareCharge(time, 360)
          else this.recover(time, 600)
        }
        break
      case 'stunned':
        if (time >= this.until) this.recover(time, 200)
        break
    }
  }

  private recover(time: number, wait: number) {
    this.state = 'idle'
    this.until = time + wait + (this.phase2 ? 0 : 350)
    this.clearTint()
    this.play('warden-idle', true)
  }

  hit(amount: number, time: number): boolean {
    if (this.state === 'dormant' || this.state === 'dying' || this.state === 'dead') return false
    this.hp = Math.max(0, this.hp - amount)
    this.setTintFill(0xffffff)
    this.scene.time.delayedCall(60, () => this.active && this.state !== 'chargeWarn' && this.clearTint())
    useGame.getState().setBoss({ hp: this.hp, max: this.maxHp })
    if (this.hp > 0) return false
    this.die(time)
    return true
  }

  private die(_time: number) {
    this.state = 'dying'
    this.setVelocity(0, 0)
    this.beam.clear()
    this.markers.forEach((m) => m.destroy())
    this.markers = []
    this.anims.stop()
    this.setFrame('stagger')
    for (let i = 0; i < 9; i++)
      this.scene.time.delayedCall(i * 190, () => {
        this.world.fx.boom(this.x + Phaser.Math.Between(-18, 18), this.y + Phaser.Math.Between(-16, 18), i % 3 === 0)
        sfx('explode')
        this.world.fx.shake(150, 0.01)
      })
    this.scene.time.delayedCall(1800, () => {
      this.state = 'dead'
      this.setFrame('dead')
      this.clearTint()
      this.body.enable = false
      this.collider?.destroy()
      this.world.onWardenDefeated()
    })
  }
}

function distToSegment(px: number, py: number, l: Phaser.Geom.Line) {
  const dx = l.x2 - l.x1
  const dy = l.y2 - l.y1
  const t = Phaser.Math.Clamp(((px - l.x1) * dx + (py - l.y1) * dy) / (dx * dx + dy * dy || 1), 0, 1)
  return Math.hypot(px - (l.x1 + t * dx), py - (l.y1 + t * dy))
}
