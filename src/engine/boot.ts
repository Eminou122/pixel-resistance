// Creates the Phaser game: turns the code-drawn art into textures and animations, then starts the world and the HUD.
import Phaser from 'phaser'
import type { NpcId } from '../game/data.ts'
import { DIRS, LOOKS, buildTileset, droneSheet, fxSheet, humanoidSheet, iconSheet, sentinelSheet, wardenSheet, type Sheet } from './art.ts'
import { arbiterSheet, fx2Sheet, heavySheet, phantomSheet, technicianSheet } from './art2.ts'
import { HudScene } from './hud.ts'
import { WorldScene } from './world.ts'

export const VIEW_W = 384
export const VIEW_H = 216
export const CHARACTERS: readonly ('kael' | NpcId)[] = ['kael', 'commander', 'juno', 'tamsin', 'rook', 'moss']

function addSheet(scene: Phaser.Scene, key: string, sheet: Sheet) {
  const tex = scene.textures.addCanvas(key, sheet.canvas)!
  for (const f of sheet.frames) tex.add(f.name, 0, f.x, f.y, f.w, f.h)
}

function anim(scene: Phaser.Scene, key: string, tex: string, frames: string[], frameRate: number, repeat = -1) {
  if (!scene.anims.exists(key)) scene.anims.create({ key, frames: frames.map((frame) => ({ key: tex, frame })), frameRate, repeat })
}

const range = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}-${i}`)

class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  create() {
    const tileset = buildTileset()
    this.textures.addCanvas('tiles', tileset.canvas)
    this.registry.set('tileset', tileset)

    for (const who of CHARACTERS) {
      addSheet(this, who, humanoidSheet(LOOKS[who]))
      for (const dir of DIRS) {
        anim(this, `${who}-${dir}-idle`, who, range(`${dir}-idle`, 2), 2)
        anim(this, `${who}-${dir}-walk`, who, range(`${dir}-walk`, 4), 9)
        anim(this, `${who}-${dir}-attack`, who, range(`${dir}-attack`, 2), 14, 0)
      }
      anim(this, `${who}-death`, who, range('death', 4), 5, 0)
    }
    addSheet(this, 'drone', droneSheet())
    anim(this, 'drone-hover', 'drone', range('hover', 4), 8)
    anim(this, 'drone-attack', 'drone', range('attack', 2), 12)
    anim(this, 'drone-death', 'drone', range('death', 4), 12, 0)
    addSheet(this, 'sentinel', sentinelSheet())
    anim(this, 'sentinel-idle', 'sentinel', range('idle', 4), 4)
    anim(this, 'sentinel-charge', 'sentinel', range('charge', 2), 10)
    anim(this, 'sentinel-death', 'sentinel', range('death', 4), 10, 0)
    addSheet(this, 'warden', wardenSheet())
    anim(this, 'warden-idle', 'warden', ['idle-0', 'idle-1'], 2)
    addSheet(this, 'fx', fxSheet())
    anim(this, 'fx-slash', 'fx', range('slash', 4), 28, 0)
    anim(this, 'fx-plasma', 'fx', range('plasma', 2), 12)
    anim(this, 'fx-bolt', 'fx', range('bolt', 2), 12)
    anim(this, 'fx-boom', 'fx', range('boom', 5), 16, 0)
    anim(this, 'fx-marker', 'fx', range('marker', 2), 8)
    addSheet(this, 'icons', iconSheet())
    // Chapter 2
    addSheet(this, 'phantom', phantomSheet())
    anim(this, 'phantom-hover', 'phantom', range('hover', 4), 10)
    anim(this, 'phantom-warn', 'phantom', range('warn', 2), 14)
    anim(this, 'phantom-death', 'phantom', range('death', 4), 12, 0)
    addSheet(this, 'heavy', heavySheet())
    anim(this, 'heavy-death', 'heavy', range('death', 4), 8, 0)
    addSheet(this, 'technician', technicianSheet())
    anim(this, 'technician-walk', 'technician', range('walk', 2), 6)
    anim(this, 'technician-repair', 'technician', range('repair', 2), 8)
    anim(this, 'technician-death', 'technician', range('death', 4), 10, 0)
    addSheet(this, 'arbiter', arbiterSheet())
    anim(this, 'arbiter-shell', 'arbiter', range('shell', 2), 3)
    anim(this, 'arbiter-open', 'arbiter', range('open', 2), 6)
    addSheet(this, 'fx2', fx2Sheet())
    anim(this, 'fx-mbolt', 'fx2', range('mbolt', 2), 12)

    // Dark edges around the screen: gives the scenes depth without hiding the play area.
    const vignette = this.textures.createCanvas('vignette', VIEW_W, VIEW_H)!
    const ctx = vignette.getContext()
    const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.45, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.62)
    g.addColorStop(0, 'rgba(7,10,22,0)')
    g.addColorStop(1, 'rgba(7,10,22,0.55)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
    vignette.refresh()

    this.scene.start('world')
    this.scene.launch('hud')
  }
}

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VIEW_W,
    height: VIEW_H,
    backgroundColor: '#070a16',
    pixelArt: true,
    roundPixels: true,
    banner: false,
    disableContextMenu: true,
    physics: { default: 'arcade', arcade: { debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { gamepad: false },
    audio: { noAudio: true },
    scene: [BootScene, WorldScene, HudScene],
  })
}
