// Chapter 2 machines and the Arbiter. Every attack is telegraphed: a flash, a glow, a ring or a line comes first.
import Phaser from 'phaser'
import { ENEMIES } from '../game/data.ts'
import type { EnemySpawn } from '../game/maps.ts'
import { frontalBlock } from '../game/state.ts'
import { useGame } from '../game/store.ts'
import { Enemy, type Player } from './actors.ts'
import { sfx } from './audio.ts'
import type { WorldScene } from './world.ts'

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y)

// ---------- Phantom Drone: circles to Kael's flank, flashes, then dashes through ----------

export class Phantom extends Enemy {
  private orbit = Math.random() < 0.5 ? 1 : -1
  private orbitAngle = 0
  private dashAngle = 0
  private struck = false

  constructor(scene: WorldScene, spawn: EnemySpawn) {
    super(scene, spawn, 'phantom', 'hover-0')
    this.body.setSize(10, 8).setOffset(3, 5)
    this.knockSpeed = 170
    this.play('phantom-hover')
  }

  protected think(time: number, p: Player) {
    switch (this.mode) {
      case 'idle': {
        // Drifts lazily around its post.
        const t = time / 900
        this.moveToward(this.home.x + Math.cos(t) * 10, this.home.y + Math.sin(t) * 6, 30)
        if (this.sees(p, 110, time)) (this.mode = 'circle'), (this.orbitAngle = Math.atan2(this.y - p.y, this.x - p.x)), (this.until = time + 1300 + Math.random() * 600)
        break
      }
      case 'circle': {
        if (!this.sees(p, 170, time) && time - this.seenAt > 1500) {
          this.mode = 'return'
          break
        }
        // Flanking: orbit Kael at a distance, so the dash comes from the side.
        this.orbitAngle += this.orbit * 0.0021 * this.dt
        this.moveToward(p.x + Math.cos(this.orbitAngle) * 54, p.y + Math.sin(this.orbitAngle) * 54, 96)
        if (time >= this.until) {
          this.mode = 'warn'
          this.until = time + 430
          this.dashAngle = Math.atan2(p.y - this.y, p.x - this.x)
          this.setVelocity(0, 0)
          this.play('phantom-warn')
          sfx('zap')
        }
        break
      }
      case 'warn':
        // Telegraph: frozen, flashing white, the dash line is already locked.
        this.setVelocity(0, 0)
        if (time >= this.until) {
          this.mode = 'dash'
          this.until = time + 270
          this.struck = false
          this.anims.stop()
          this.setFrame('dash')
          this.setVelocity(Math.cos(this.dashAngle) * 235, Math.sin(this.dashAngle) * 235)
        }
        break
      case 'dash':
        if (time % 40 < 20) this.world.fx.ghost(this)
        if (!this.struck && this.touches(p)) (this.struck = true), this.world.hurtPlayer(this.atk, this.x, this.y)
        if (time >= this.until || !this.body.blocked.none) {
          // Recovery: slow and translucent, the moment to strike back.
          this.mode = 'recover'
          this.until = time + 700
          this.setVelocity(0, 0)
          this.setAlpha(0.6)
          this.play('phantom-hover')
        }
        break
      case 'recover':
        if (time >= this.until) {
          this.setAlpha(1)
          this.mode = 'circle'
          this.orbit *= -1
          this.until = time + 1200 + Math.random() * 700
        }
        break
      case 'return':
        this.moveToward(this.home.x, this.home.y, 60)
        if (this.sees(p, 110, time)) this.mode = 'circle'
        else if (dist(this, this.home) < 4) this.mode = 'idle'
        break
    }
  }
}

// ---------- Heavy Sentinel: a slow, armoured walker. Its shield blocks from the front ----------

export class Heavy extends Enemy {
  /** Where the shield faces (radians). It turns slowly: get behind it. */
  facing = Math.PI / 2
  private nextSlam = 0
  private nextShot = 0

  constructor(scene: WorldScene, spawn: EnemySpawn) {
    super(scene, spawn, 'heavy', 'down-0')
    this.body.setSize(14, 8).setOffset(3, 11)
    this.body.setMass(8)
    this.knockSpeed = 35
  }

  override mitigate(amount: number, fromX: number, fromY: number): number {
    // Committed to an attack or recovering, it cannot raise the shield.
    if (this.mode === 'recover' || this.mode === 'idle') return amount
    return frontalBlock(this.facing, Math.atan2(fromY - this.y, fromX - this.x)) ? Math.max(1, Math.round(amount * 0.15)) : amount
  }

  private turnToward(p: Player) {
    const want = Math.atan2(p.y - this.y, p.x - this.x)
    const d = Math.atan2(Math.sin(want - this.facing), Math.cos(want - this.facing))
    const step = 0.0017 * this.dt
    this.facing += Phaser.Math.Clamp(d, -step, step)
    return Math.abs(d)
  }

  private pose(time: number, slam = false) {
    const fx = Math.cos(this.facing)
    const fy = Math.sin(this.facing)
    const dir = Math.abs(fx) > Math.abs(fy) ? 'side' : fy > 0 ? 'down' : 'up'
    this.setFlipX(dir === 'side' && fx < 0)
    this.setFrame(`${dir}-${slam ? 'slam' : Math.floor(time / 350) % 2}`)
  }

  protected think(time: number, p: Player) {
    const d = dist(this, p)
    switch (this.mode) {
      case 'idle':
        this.setVelocity(0, 0)
        this.pose(time)
        if (this.sees(p, 120, time)) this.mode = 'advance'
        break
      case 'advance': {
        const sees = this.sees(p, 150, time)
        if (!sees && time - this.seenAt > 2200) {
          this.mode = 'idle'
          break
        }
        const off = this.turnToward(p)
        if (d > 26) this.setVelocity(Math.cos(this.facing) * 26, Math.sin(this.facing) * 26)
        else this.setVelocity(0, 0)
        this.pose(time)
        if (d < 32 && off < 0.6 && time >= this.nextSlam) {
          // Telegraph: the shield flares before the slam.
          this.mode = 'windup'
          this.until = time + 650
          this.setVelocity(0, 0)
          sfx('charge')
        } else if (sees && d > 64 && d < 125 && off < 0.4 && time >= this.nextShot) {
          this.mode = 'aim'
          this.until = time + 500
          this.setVelocity(0, 0)
        }
        break
      }
      case 'windup':
        this.setVelocity(0, 0)
        this.pose(time, Math.floor(time / 90) % 2 === 0)
        if (time >= this.until) {
          this.world.fx.shockwave(this.x, this.y + 6, 36, 0xffb347)
          if (dist(this, p) < 36) this.world.hurtPlayer(this.atk, this.x, this.y)
          sfx('explode')
          this.world.fx.shake(140, 0.006)
          // Recovery: shield lowered for a moment, open from every side.
          this.mode = 'recover'
          this.until = time + 950
          this.nextSlam = time + 2200
          this.pose(time, true)
        }
        break
      case 'aim':
        this.setVelocity(0, 0)
        this.pose(time, Math.floor(time / 120) % 2 === 0)
        if (time >= this.until) {
          this.world.foeShot(this.x, this.y - 2, p.x, p.y, Math.round(this.atk * 0.7))
          sfx('zap')
          this.nextShot = time + 2600
          this.mode = 'advance'
        }
        break
      case 'recover':
        this.setVelocity(0, 0)
        if (time >= this.until) this.mode = 'advance'
        break
    }
  }
}

// ---------- Spire Technician: repairs the other machines, keeps away from Kael ----------

export class Technician extends Enemy {
  private readonly beam: Phaser.GameObjects.Graphics
  private patient: Enemy | null = null
  private repairAt = 0
  private zapAt = 0

  constructor(scene: WorldScene, spawn: EnemySpawn) {
    super(scene, spawn, 'technician', 'walk-0')
    this.body.setSize(8, 6).setOffset(4, 9)
    this.beam = scene.add.graphics().setDepth(905).setBlendMode(Phaser.BlendModes.ADD)
    this.play('technician-walk')
  }

  protected override onDeath() {
    this.beam.destroy()
  }

  protected think(time: number, p: Player) {
    this.beam.clear()
    const d = dist(this, p)
    if (this.touches(p) && time >= this.zapAt) (this.zapAt = time + 900), this.world.hurtPlayer(this.atk, this.x, this.y)
    // Flee when Kael comes close.
    if (d < 64 && this.sees(p, 90, time)) {
      this.moveToward(this.x * 2 - p.x, this.y * 2 - p.y, 52)
      this.play('technician-walk', true)
      this.patient = null
      return
    }
    if (!this.patient || this.patient.dead || !this.patient.hurt) {
      this.patient = this.world.machines.filter((m) => m !== this && !m.dead && m.hurt && dist(m, this) < 110).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] ?? null
    }
    if (!this.patient) {
      this.moveToward(this.home.x, this.home.y, 30)
      if (dist(this, this.home) < 3) this.play('technician-walk', true).anims.pause()
      else this.play('technician-walk', true)
      return
    }
    if (dist(this, this.patient) > 40) {
      this.moveToward(this.patient.x, this.patient.y, 44)
      this.play('technician-walk', true)
      return
    }
    // Repairing: a visible green beam, a heal every 0.9 s. Destroy the technician first.
    this.setVelocity(0, 0)
    this.play('technician-repair', true)
    this.setFlipX(this.patient.x < this.x)
    this.beam.lineStyle(1, 0x59f39a, 0.6 + 0.4 * Math.sin(time / 50)).lineBetween(this.x + (this.flipX ? -6 : 6), this.y - 1, this.patient.x, this.patient.y)
    if (time >= this.repairAt) (this.repairAt = time + 900), this.patient.repair(7, time)
  }
}

// ---------- The Arbiter ----------

type ArbiterState = 'dormant' | 'intro' | 'shell' | 'charge' | 'ring' | 'beamWarn' | 'beam' | 'blinkOut' | 'blinkIn' | 'open' | 'dying' | 'dead'
type Attack = 'ring' | 'beam' | 'blink' | 'summon'

export class Arbiter extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body
  hp = ENEMIES.arbiter.hp
  readonly maxHp = ENEMIES.arbiter.hp
  readonly def = ENEMIES.arbiter.defense
  state: ArbiterState = 'dormant'
  private until = 0
  private queue: Attack[] = []
  private ringsLeft = 0
  private gapAngle = 0
  private beamFrom = 0
  private beamDur = 0
  private marker: Phaser.GameObjects.Sprite | null = null
  private blinkTo = { x: 0, y: 0 }
  private readonly beams: Phaser.GameObjects.Graphics
  private readonly nodes: Phaser.GameObjects.Image[] = []
  private lastPhase = 1

  constructor(scene: WorldScene, x: number, y: number) {
    super(scene, x, y, 'arbiter', 'shell-0')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setSize(20, 20).setOffset(14, 12)
    this.body.pushable = false
    this.body.enable = false
    this.beams = scene.add.graphics().setDepth(950).setBlendMode(Phaser.BlendModes.ADD)
    for (let i = 0; i < 4; i++) this.nodes.push(scene.add.image(x, y, 'fx2', 'node').setDepth(this.y + 11))
    this.setDepth(this.y + 10)
  }

  private get world() {
    return this.scene as WorldScene
  }
  get phase() {
    return this.hp > this.maxHp * 0.6 ? 1 : this.hp > this.maxHp * 0.25 ? 2 : 3
  }
  get core() {
    return { x: this.x, y: this.y - 2 }
  }
  /** Only an open core takes full damage. */
  get exposed() {
    return this.state === 'open'
  }

  wake(time: number) {
    if (this.state !== 'dormant') return
    this.state = 'intro'
    this.until = time + 1600
    this.setFrame('charge')
    sfx('charge')
    this.world.fx.shake(500, 0.008)
    useGame.getState().setBoss({ hp: this.hp, max: this.maxHp, name: 'arbiter' })
  }

  private nextAttack(time: number) {
    if (!this.queue.length) {
      const pool: Attack[] = this.phase === 1 ? ['ring', 'blink', 'ring', 'beam'] : ['ring', 'beam', 'blink', 'summon']
      this.queue = Phaser.Utils.Array.Shuffle(pool)
    }
    let a = this.queue.shift()!
    if (a === 'summon' && this.world.summonCount() >= 2) a = 'ring'
    const p = this.world.player
    if (a === 'ring') {
      this.state = 'charge'
      this.until = time + 750
      this.ringsLeft = this.phase
      this.gapAngle = Math.random() * Math.PI * 2
      this.setFrame('charge')
      sfx('charge')
    } else if (a === 'beam') {
      this.state = 'beamWarn'
      this.until = time + 850
      this.beamFrom = Math.atan2(p.feetY - this.core.y, p.feetX - this.core.x) + Math.PI / 2
      this.beamDur = this.phase === 3 ? 1700 : 2200
      this.setFrame('charge')
      sfx('charge')
    } else if (a === 'blink') {
      this.state = 'blinkOut'
      this.until = time + 420
      const zone = this.world.arenaBounds()
      // Reappears away from Kael, never on top of him.
      let to = { x: 0, y: 0 }
      for (let i = 0; i < 12; i++) {
        to = { x: Phaser.Math.Between(zone.x + 40, zone.right - 40), y: Phaser.Math.Between(zone.y + 40, zone.bottom - 30) }
        if (Phaser.Math.Distance.Between(to.x, to.y, p.feetX, p.feetY) > 80) break
      }
      this.blinkTo = to
      this.scene.tweens.add({ targets: this, alpha: 0.15, duration: 400 })
      sfx('dash')
    } else {
      this.world.summonPhantoms(this.x, this.y)
      this.openUp(time)
    }
  }

  private openUp(time: number) {
    this.state = 'open'
    this.until = time + (this.phase === 1 ? 2300 : this.phase === 2 ? 1900 : 1600)
    this.play('arbiter-open', true)
    sfx('door')
  }

  private fireRing() {
    const n = 16
    const speed = this.phase === 3 ? 88 : 76
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      // A gap of three missing bolts: slip through it, or dash through the ring.
      const off = Math.atan2(Math.sin(a - this.gapAngle), Math.cos(a - this.gapAngle))
      if (Math.abs(off) < (Math.PI * 2 * 1.6) / n) continue
      this.world.foeShotAngle(this.core.x, this.core.y, a, speed, 14)
    }
    sfx('blaster')
  }

  private beamEnd(angle: number) {
    const { x, y } = this.core
    for (let d = 10; d < 260; d += 4) {
      const px = x + Math.cos(angle) * d
      const py = y + Math.sin(angle) * d
      if (this.world.solidAt(px, py)) return { x: px, y: py }
    }
    return { x: x + Math.cos(angle) * 260, y: y + Math.sin(angle) * 260 }
  }

  tick(time: number, p: Player) {
    if (this.state === 'dormant' || this.state === 'dead') return
    this.setDepth(this.y + 10)
    // Four orbiting nodes: pure decoration that makes the shell state readable (they spread out when it opens).
    const spread = this.state === 'open' ? 30 : 22
    this.nodes.forEach((nd, i) => {
      const a = time / 600 + (i * Math.PI) / 2
      nd.setPosition(this.x + Math.cos(a) * spread, this.y - 2 + Math.sin(a) * spread * 0.7).setAlpha(this.alpha).setDepth(this.y + (Math.sin(a) > 0 ? 12 : 8))
    })
    if (this.state === 'dying') return
    if (this.phase !== this.lastPhase) {
      this.lastPhase = this.phase
      this.world.fx.shockwave(this.x, this.y, 60, 0xff3ea5)
      this.world.fx.shake(300, 0.01)
      useGame.getState().notify({ key: 'notice.arbiterPhase', params: { phase: this.phase }, kind: 'info' })
    }

    switch (this.state) {
      case 'intro':
        if (time >= this.until) this.shell(time)
        break
      case 'shell':
        if (time >= this.until) this.nextAttack(time)
        break
      case 'charge':
        if (time >= this.until) {
          this.fireRing()
          if (--this.ringsLeft > 0) {
            this.until = time + 520
            this.gapAngle += 0.7
          } else this.openUp(time)
        }
        break
      case 'beamWarn': {
        // Telegraph: two thin red lines show where the beams will start.
        this.beams.clear()
        for (const k of [0, Math.PI]) {
          const e = this.beamEnd(this.beamFrom + k)
          this.beams.lineStyle(1, 0xff4d5e, 0.5 + 0.5 * Math.sin(time / 40)).lineBetween(this.core.x, this.core.y, e.x, e.y)
        }
        if (time >= this.until) (this.state = 'beam'), (this.until = time + this.beamDur), sfx('laser')
        break
      }
      case 'beam': {
        const t = 1 - (this.until - time) / this.beamDur
        const base = this.beamFrom + Math.PI * Phaser.Math.Clamp(t, 0, 1)
        this.beams.clear()
        for (const k of [0, Math.PI]) {
          const e = this.beamEnd(base + k)
          this.beams.lineStyle(6, 0xa21a6b, 0.8).lineBetween(this.core.x, this.core.y, e.x, e.y)
          this.beams.lineStyle(2, 0xf4f8ff, 1).lineBetween(this.core.x, this.core.y, e.x, e.y)
          if (segDist(p.feetX, p.feetY - 3, this.core, e) < 6) this.world.hurtPlayer(15, e.x, e.y)
        }
        if (time >= this.until) (this.beams.clear(), this.openUp(time))
        break
      }
      case 'blinkOut':
        if (time >= this.until) {
          this.setPosition(this.blinkTo.x, this.blinkTo.y)
          // Telegraph: a ring marks where it lands; the landing sends out a shockwave that far.
          this.marker = this.scene.add.sprite(this.x, this.y + 8, 'fx', 'marker-0').play('fx-marker').setScale(5).setAlpha(0.7).setDepth(3)
          this.state = 'blinkIn'
          this.until = time + 680
        }
        break
      case 'blinkIn':
        if (time >= this.until) {
          this.marker?.destroy()
          this.marker = null
          this.setAlpha(1)
          this.world.fx.shockwave(this.x, this.y + 8, 40, 0xff3ea5)
          if (Phaser.Math.Distance.Between(p.feetX, p.feetY, this.x, this.y + 8) < 40) this.world.hurtPlayer(14, this.x, this.y)
          sfx('explode')
          this.openUp(time)
        }
        break
      case 'open':
        if (time >= this.until) this.shell(time)
        break
    }
  }

  private shell(time: number) {
    this.state = 'shell'
    this.until = time + (this.phase === 1 ? 900 : this.phase === 2 ? 650 : 480)
    this.play('arbiter-shell', true)
  }

  /** Damage actually taken: the closed shell absorbs almost everything. */
  mitigate(amount: number) {
    return this.exposed ? amount : Math.max(1, Math.round(amount * 0.1))
  }

  hit(amount: number, time: number): boolean {
    if (this.state === 'dormant' || this.state === 'dying' || this.state === 'dead' || this.state === 'intro') return false
    this.hp = Math.max(0, this.hp - amount)
    this.setTintFill(this.exposed ? 0xffffff : 0xff3ea5)
    this.scene.time.delayedCall(60, () => this.active && this.clearTint())
    useGame.getState().setBoss({ hp: this.hp, max: this.maxHp, name: 'arbiter' })
    if (this.hp > 0) return false
    this.die(time)
    return true
  }

  private die(_time: number) {
    this.state = 'dying'
    this.beams.clear()
    this.marker?.destroy()
    this.setAlpha(1)
    this.anims.stop()
    this.setFrame('hurt')
    this.world.clearSummons()
    for (let i = 0; i < 10; i++)
      this.scene.time.delayedCall(i * 180, () => {
        this.world.fx.boom(this.x + Phaser.Math.Between(-18, 18), this.y + Phaser.Math.Between(-18, 16), i % 3 === 0)
        sfx('explode')
        this.world.fx.shake(150, 0.01)
      })
    this.scene.time.delayedCall(1900, () => {
      this.state = 'dead'
      this.setFrame('dead')
      this.clearTint()
      this.nodes.forEach((n) => n.destroy())
      this.scene.tweens.add({ targets: this, y: this.y + 6, duration: 600, ease: 'Bounce.easeOut' })
      this.world.onArbiterDefeated()
    })
  }

  /** The wreck, for saves where the Arbiter is already beaten. */
  setDefeated() {
    this.state = 'dead'
    this.setFrame('dead')
    this.setY(this.y + 6)
    this.nodes.forEach((n) => n.destroy())
  }
}

function segDist(px: number, py: number, a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const t = Phaser.Math.Clamp(((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1)
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy))
}
