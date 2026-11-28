// Original pixel art, drawn in code on canvases (no image files). Used by Phaser for textures and by React for icons.
import type { ItemId, NpcId } from '../game/data.ts'
import type { TileKind } from '../game/maps.ts'
import { C, ellipse, hash, makeCanvas, p, r, sheet, speckle, type Ctx, type Sheet } from './pixels.ts'
import { CH2_ICONS, CH2_TILES } from './art2.ts'

export { C, makeCanvas, type Sheet } from './pixels.ts'

// ---------- Tiles ----------

type TileDraw = (c: Ctx, v: number) => void

const floorBase = (c: Ctx, v: number) => {
  r(c, 0, 0, 16, 16, C.s2)
  r(c, 0, 0, 16, 1, C.s1)
  r(c, 0, 0, 1, 16, C.s1)
  r(c, 1, 1, 15, 1, C.s3)
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]] as const) p(c, x, y, C.s4)
  speckle(c, 10 + v, [C.s1, C.s3], 0.05, 1, 2, 15, 14)
  if (v === 1) for (let y = 6; y <= 9; y += 1) r(c, 4, y, 8, 1, y % 2 ? C.s1 : C.s3)
  if (v === 2) (r(c, 9, 5, 4, 1, C.s3), r(c, 10, 6, 3, 1, C.s1))
  if (v === 3) for (let i = 0; i < 4; i++) (p(c, 11 + i, 15 - i, C.amberD), p(c, 12 + i, 15 - i, C.void))
}

const TILE_DRAW: Record<string, { n: number; draw: TileDraw; transparent?: boolean }> = {
  floor: { n: 4, draw: floorBase },
  grate: {
    n: 2,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.s1)
      for (let i = 1; i < 16; i += 3) (r(c, i, 0, 1, 16, C.s3), r(c, 0, i, 16, 1, C.s3))
      if (v) (p(c, 7, 7, C.cyanDD), p(c, 8, 8, C.cyanDD))
    },
  },
  neon: {
    // 0 horizontal, 1 vertical, 2 crossing
    n: 3,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.s1)
      speckle(c, 30, [C.s2], 0.1)
      if (v !== 1) (r(c, 0, 6, 16, 4, C.cyanDD), r(c, 0, 7, 16, 2, C.cyanD), r(c, 0, 7, 16, 1, C.cyan))
      if (v !== 0) (r(c, 6, 0, 4, 16, C.cyanDD), r(c, 7, 0, 2, 16, C.cyanD), r(c, 7, 0, 1, 16, C.cyan))
      for (let i = 1; i < 16; i += 4) (p(c, i, 2, C.s3), p(c, i, 13, C.s3))
    },
  },
  wall: {
    n: 2,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.s3)
      r(c, 0, 0, 16, 2, C.s4)
      r(c, 0, 2, 16, 1, C.s5)
      r(c, 0, 13, 16, 3, C.s1)
      r(c, 0, 12, 16, 1, C.s2)
      r(c, 7, 3, 1, 9, C.s2)
      if (v) (r(c, 2, 5, 3, 6, C.s2), p(c, 3, 6, C.green), p(c, 3, 8, C.amber))
    },
  },
  window: {
    n: 1,
    draw: (c) => {
      TILE_DRAW.wall!.draw(c, 0)
      r(c, 2, 4, 12, 7, C.s5)
      r(c, 3, 5, 10, 5, C.cyanDD)
      r(c, 3, 5, 10, 2, C.cyanD)
      p(c, 4, 6, C.white)
      p(c, 5, 5, C.cyan)
    },
  },
  door: {
    n: 1,
    draw: (c) => {
      TILE_DRAW.wall!.draw(c, 0)
      r(c, 2, 3, 12, 13, C.s1)
      r(c, 3, 4, 10, 12, C.s2)
      r(c, 7, 4, 2, 12, C.s1)
      r(c, 3, 4, 10, 1, C.amber)
      p(c, 6, 10, C.cyan)
      p(c, 9, 10, C.cyan)
    },
  },
  roof: {
    n: 3,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.s4)
      r(c, 0, 0, 16, 1, C.s5)
      r(c, 0, 15, 16, 1, C.s3)
      r(c, 0, 7, 16, 1, C.s3)
      r(c, 7, 0, 1, 16, C.s3)
      speckle(c, 50 + v, [C.s3, C.s5], 0.04)
      if (v === 1) (r(c, 3, 3, 4, 3, C.s1), r(c, 3, 3, 4, 1, C.s2))
      if (v === 2) (r(c, 9, 9, 5, 5, C.w2), r(c, 9, 9, 5, 1, C.w3), r(c, 11, 9, 1, 5, C.w1), p(c, 12, 4, C.magenta))
    },
  },
  crate: {
    n: 2,
    transparent: true,
    draw: (c, v) => {
      r(c, 1, 1, 14, 14, C.void)
      r(c, 2, 2, 12, 12, v ? C.s4 : C.amberD)
      r(c, 2, 2, 12, 1, v ? C.s5 : C.amber)
      for (let i = 0; i < 10; i++) (p(c, 3 + i, 3 + i, C.s2), p(c, 12 - i, 3 + i, C.s2))
      r(c, 2, 7, 12, 2, v ? C.s3 : C.d3)
    },
  },
  machine: {
    n: 2,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.s1)
      r(c, 1, 1, 14, 14, C.s3)
      r(c, 1, 1, 14, 1, C.s5)
      r(c, 3, 3, 10, 5, C.void)
      r(c, 4, 4, 8, 3, v ? C.greenD : C.cyanDD)
      r(c, 4, 4, v ? 3 : 5, 1, v ? C.green : C.cyan)
      p(c, 4, 11, C.red)
      p(c, 7, 11, C.green)
      p(c, 10, 11, C.amber)
      r(c, 2, 13, 12, 1, C.s2)
    },
  },
  lamp: {
    n: 1,
    transparent: true,
    draw: (c) => {
      ellipse(c, 8, 12, 4, 2.5, C.s1)
      r(c, 7, 4, 2, 9, C.s4)
      r(c, 7, 4, 1, 9, C.s5)
      ellipse(c, 8, 4, 3, 2.5, C.cyanD)
      ellipse(c, 8, 4, 2, 1.5, C.cyan)
      p(c, 7, 3, C.white)
    },
  },
  fence: {
    n: 2,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.void)
      r(c, 0, 0, 3, 16, C.s3)
      r(c, 13, 0, 3, 16, C.s3)
      r(c, 1, 0, 1, 16, C.s5)
      for (const y of [4, 8, 12]) (r(c, 3, y - 1, 10, 3, C.magentaD), r(c, 3, y, 10, 1, C.magenta))
      if (v) p(c, 14, 2, C.red)
    },
  },
  planter: {
    n: 2,
    transparent: true,
    draw: (c, v) => {
      r(c, 1, 8, 14, 7, C.s1)
      r(c, 2, 8, 12, 6, C.s3)
      r(c, 2, 8, 12, 1, C.s5)
      r(c, 3, 9, 10, 2, C.d1)
      const leaf = v ? C.p3 : C.l4
      const dark = v ? C.p2 : C.l3
      ellipse(c, 5, 6, 3, 4, dark)
      ellipse(c, 10, 5, 3, 5, dark)
      ellipse(c, 5, 5, 2, 3, leaf)
      ellipse(c, 10, 4, 2, 3, leaf)
      p(c, 8, 2, C.cyan)
      p(c, 4, 3, C.magenta)
    },
  },
  exit: {
    // 0 points down, 1 points up
    n: 2,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.s1)
      r(c, 0, 0, 16, 1, C.s2)
      for (const oy of [2, 8]) {
        for (let i = 0; i < 5; i++) {
          const y = v ? oy + 4 - i : oy + i
          p(c, 3 + i, y, C.amber)
          p(c, 12 - i, y, C.amber)
          p(c, 3 + i, y + (v ? 1 : -1), C.amberD)
          p(c, 12 - i, y + (v ? 1 : -1), C.amberD)
        }
      }
    },
  },
  grass: {
    n: 4,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.g2)
      speckle(c, 100 + v, [C.g1, C.g3, C.g3], 0.18)
      for (let i = 0; i < 4; i++) {
        const x = Math.floor(hash(i, v, 7) * 14) + 1
        const y = Math.floor(hash(v, i, 9) * 12) + 2
        p(c, x, y, C.g4)
        p(c, x, y + 1, C.g3)
      }
    },
  },
  glowgrass: {
    n: 3,
    draw: (c, v) => {
      TILE_DRAW.grass!.draw(c, v)
      const cols = [C.cyan, C.p4, C.magenta]
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(hash(i, v, 21) * 13) + 1
        const y = Math.floor(hash(v, i, 23) * 13) + 1
        p(c, x, y, cols[(i + v) % 3]!)
        p(c, x, y + 1, C.l3)
      }
    },
  },
  path: {
    n: 3,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.d2)
      speckle(c, 200 + v, [C.d1, C.d3], 0.16)
      ellipse(c, 4 + v * 3, 10 - v, 1.5, 1, C.d3)
    },
  },
  water: {
    // 0 and 1 are the two animation frames
    n: 2,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.w2)
      speckle(c, 300, [C.w1], 0.12)
      for (const y of [3, 9, 14]) for (let x = 0; x < 16; x++) if ((x + v * 3 + y) % 8 < 3) p(c, x, y, C.w3)
      p(c, (5 + v * 6) % 16, 6, C.foam)
      p(c, (11 + v * 5) % 16, 12, C.foam)
    },
  },
  bridge: {
    n: 1,
    draw: (c) => {
      r(c, 0, 0, 16, 16, C.w1)
      for (let x = 0; x < 16; x += 4) (r(c, x, 1, 3, 14, C.d3), r(c, x, 1, 3, 1, C.amberD), r(c, x, 14, 3, 1, C.d1))
      r(c, 0, 2, 16, 1, C.d1)
      r(c, 0, 13, 16, 1, C.d1)
    },
  },
  thicket: {
    n: 3,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.l1)
      for (let i = 0; i < 7; i++) {
        const x = hash(i, v, 40) * 14 + 1
        const y = hash(v, i, 41) * 14 + 1
        ellipse(c, x, y, 3.5, 3, C.l2)
        ellipse(c, x - 0.5, y - 0.8, 2.2, 1.8, C.l3)
        p(c, Math.floor(x - 1), Math.floor(y - 2), C.l4)
      }
    },
  },
  fakethicket: {
    n: 1,
    draw: (c) => {
      TILE_DRAW.thicket!.draw(c, 1)
      // Two faint glints: the only hint that something hides here.
      p(c, 6, 7, C.cyanD)
      p(c, 11, 10, C.cyanDD)
    },
  },
  tree: {
    n: 3,
    transparent: true,
    draw: (c, v) => {
      const [dark, mid, light] = v === 1 ? [C.p1, C.p2, C.p3] : v === 2 ? [C.l1, C.l3, C.l4] : [C.l2, C.l3, C.g4]
      ellipse(c, 8, 13, 6, 2.5, 'rgba(0,0,0,0.35)')
      ellipse(c, 8, 7.5, 7, 6.5, dark)
      ellipse(c, 7.5, 7, 6, 5.5, mid)
      ellipse(c, 6, 5, 3.5, 3, light)
      p(c, 5, 3, C.white)
      p(c, 11, 9, v === 1 ? C.magenta : C.cyan)
    },
  },
  rock: {
    n: 2,
    transparent: true,
    draw: (c, v) => {
      ellipse(c, 8, 12, 6.5, 3, 'rgba(0,0,0,0.35)')
      ellipse(c, 8, 9, 6.5 - v, 5.5, C.r1)
      ellipse(c, 7.5, 8, 5.5 - v, 4.5, C.r2)
      ellipse(c, 6, 6.5, 2.5, 2, C.r3)
      p(c, 10, 10, C.r1)
      if (v) p(c, 9, 6, C.moss)
    },
  },
  crystal: {
    n: 2,
    transparent: true,
    draw: (c, v) => {
      ellipse(c, 8, 13, 6, 2.5, 'rgba(0,0,0,0.35)')
      const shard = (x: number, top: number, w: number) => {
        r(c, x, top, w, 13 - top, C.cyanD)
        r(c, x, top, 1, 13 - top, C.cyan)
        r(c, x + w - 1, top + 1, 1, 12 - top, C.cyanDD)
        p(c, x + Math.floor(w / 2), top - 1, C.white)
      }
      shard(4, 5 + v, 3)
      shard(7, 2, 3)
      shard(10, 6 - v, 2)
    },
  },
  ruinfloor: {
    n: 3,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.u2)
      r(c, 0, 0, 16, 1, C.u1)
      r(c, 0, 0, 1, 16, C.u1)
      speckle(c, 400 + v, [C.u1, C.u3], 0.1)
      if (v === 1) for (let i = 0; i < 6; i++) p(c, 3 + i, 4 + Math.floor(i / 2) * 2, C.u1)
      if (v === 2) (ellipse(c, 11, 11, 3, 2, C.moss), p(c, 10, 10, C.g4))
    },
  },
  ruinwall: {
    n: 2,
    draw: (c, v) => {
      r(c, 0, 0, 16, 16, C.u3)
      r(c, 0, 9, 16, 7, C.u2)
      r(c, 0, 14, 16, 2, C.u1)
      r(c, 0, 9, 16, 1, C.u1)
      speckle(c, 500 + v, [C.u2, C.s5], 0.08, 0, 0, 16, 9)
      if (v) (r(c, 3, 0, 4, 2, C.u1), r(c, 11, 10, 1, 5, C.rust))
      else r(c, 12, 0, 3, 1, C.u1)
    },
  },
  gate: {
    n: 1,
    draw: (c) => {
      TILE_DRAW.ruinfloor!.draw(c, 0)
      r(c, 0, 0, 2, 16, C.s4)
      r(c, 14, 0, 2, 16, C.s4)
      for (const x of [4, 8, 12]) (r(c, x - 1, 0, 3, 16, C.magentaD), r(c, x, 0, 1, 16, C.magenta))
    },
  },
  gateopen: {
    n: 1,
    draw: (c) => {
      TILE_DRAW.ruinfloor!.draw(c, 0)
      r(c, 0, 0, 2, 16, C.s4)
      r(c, 14, 0, 2, 16, C.s4)
      p(c, 1, 2, C.green)
      p(c, 14, 2, C.green)
    },
  },
  spire: {
    n: 1,
    draw: (c) => {
      r(c, 0, 0, 16, 16, C.s3)
      r(c, 0, 0, 16, 2, C.s5)
      r(c, 0, 14, 16, 2, C.s1)
      r(c, 2, 4, 1, 8, C.cyanD)
      r(c, 13, 4, 1, 8, C.cyanD)
      r(c, 2, 7, 12, 1, C.cyanD)
      ellipse(c, 8, 8, 3, 3, C.s1)
      ellipse(c, 8, 8, 2, 2, C.cyan)
    },
  },
}

Object.assign(TILE_DRAW, CH2_TILES)

export interface Tileset {
  canvas: HTMLCanvasElement
  /** First tile index for each kind; the next `count` indices are its variants. */
  first: Record<string, number>
  count: Record<string, number>
  transparent: ReadonlySet<string>
}

/** Every tile kind and its variants, side by side in one image. */
export function buildTileset(): Tileset {
  const kinds = Object.keys(TILE_DRAW)
  const total = kinds.reduce((n, k) => n + TILE_DRAW[k]!.n, 0)
  const [cv, ctx] = makeCanvas(total * 16, 16)
  const first: Record<string, number> = {}
  const count: Record<string, number> = {}
  let i = 0
  for (const k of kinds) {
    const def = TILE_DRAW[k]!
    first[k] = i
    count[k] = def.n
    for (let v = 0; v < def.n; v++, i++) {
      ctx.save()
      ctx.translate(i * 16, 0)
      def.draw(ctx, v)
      ctx.restore()
    }
  }
  return { canvas: cv, first, count, transparent: new Set(kinds.filter((k) => TILE_DRAW[k]!.transparent)) }
}

/** Picks a stable variant for a tile at (x, y). */
export const variantFor = (_kind: TileKind | 'gateopen', x: number, y: number, n: number) => (n <= 1 ? 0 : Math.floor(hash(x, y, 77) * n))

// ---------- Characters ----------

export type Dir = 'down' | 'up' | 'side'
export const DIRS: readonly Dir[] = ['down', 'up', 'side']

export interface Look {
  skin: string
  hair: string
  suit: string
  suitD: string
  accent: string
  boots: string
  visor?: string
  style: 'short' | 'long' | 'hood' | 'goggles'
  coat?: boolean
  pack?: boolean
}

export const LOOKS: Record<'kael' | NpcId, Look> = {
  kael: { skin: '#e9b48a', hair: '#2c2140', suit: '#2b6a86', suitD: '#1a3f55', accent: C.cyan, boots: C.s1, visor: C.cyan, style: 'short', pack: true },
  commander: { skin: '#c98d66', hair: '#d9dde8', suit: '#7a2333', suitD: '#4a1420', accent: C.amber, boots: C.void, style: 'long', coat: true },
  juno: { skin: '#f0c49a', hair: '#e0662c', suit: '#5a6b2e', suitD: '#39461b', accent: C.amber, boots: C.d1, style: 'goggles' },
  tamsin: { skin: '#b9825e', hair: C.p2, suit: C.p2, suitD: C.p1, accent: C.magenta, boots: C.p1, style: 'hood' },
  // Rook: silver crop, long charcoal coat, one magenta lens. Ex-Nexus, and it shows.
  rook: { skin: '#d9a27a', hair: '#cfd6e6', suit: '#2a2d3a', suitD: '#181a24', accent: C.magenta, boots: C.void, visor: C.magenta, style: 'short', coat: true },
  // Moss: an old scavenger in patched brown, goggles pushed up.
  moss: { skin: '#a8714f', hair: '#8a8f7a', suit: '#5a4630', suitD: '#3a2c1e', accent: C.green, boots: C.d1, style: 'goggles' },
}

interface Pose {
  bob: number
  /** -1, 0 or 1: which leg is forward. */
  stride: number
  swing: number
  attack: boolean
  hurt: boolean
}

function drawHumanoid(c: Ctx, look: Look, dir: Dir, pose: Pose) {
  const { bob, stride, swing, attack, hurt } = pose
  const o = hurt ? -1 : 0
  ellipse(c, 8, 14.5, 4.5, 1.6, 'rgba(0,0,0,0.35)')
  // Legs
  const leg = (x: number, lift: number) => {
    r(c, x, 11 + lift, 2, 3 - lift, look.suitD)
    r(c, x, 13, 2, 1, look.boots)
  }
  if (dir === 'side') {
    leg(6 + stride, stride !== 0 ? -0 : 0)
    leg(8 - stride, 0)
  } else {
    leg(5, stride === 1 ? -1 : 0)
    leg(9, stride === -1 ? -1 : 0)
  }
  const y0 = bob + o
  // Torso
  if (dir === 'side') {
    r(c, 5, 7 + y0, 6, 5, look.suit)
    r(c, 5, 7 + y0, 1, 5, look.suitD)
    r(c, 5, 10 + y0, 6, 1, look.suitD)
    if (look.pack) r(c, 3, 7 + y0, 2, 4, C.s4)
  } else {
    r(c, 4, 7 + y0, 8, 5, look.suit)
    r(c, 4, 7 + y0, 1, 5, look.suitD)
    r(c, 11, 7 + y0, 1, 5, look.suitD)
    r(c, 4, 10 + y0, 8, 1, look.suitD)
    if (dir === 'down') (p(c, 7, 8 + y0, look.accent), p(c, 8, 10 + y0, look.accent))
    if (dir === 'up' && look.pack) (r(c, 5, 7 + y0, 6, 4, C.s4), r(c, 5, 7 + y0, 6, 1, C.s5), p(c, 8, 9 + y0, look.accent))
  }
  if (look.coat) {
    if (dir === 'side') r(c, 5, 12, 5, 1, look.suit)
    else (r(c, 4, 12, 2, 1, look.suit), r(c, 10, 12, 2, 1, look.suit))
  }
  // Arms
  if (dir === 'side') {
    if (attack) (r(c, 9, 8 + y0, 4, 2, look.suit), p(c, 13, 8 + y0, look.skin), p(c, 14, 8 + y0, C.cyan))
    else (r(c, 7 + swing, 8 + y0, 2, 3, look.suitD), p(c, 7 + swing, 11 + y0, look.skin))
  } else {
    const ly = dir === 'down' ? swing : -swing
    r(c, 3, 7 + y0 + Math.max(0, ly), 1, 3, look.suit)
    p(c, 3, 10 + y0 + Math.max(0, ly), look.skin)
    if (attack) {
      const ay = dir === 'down' ? 11 : 4
      r(c, 12, Math.min(ay, 8) + y0, 1, 4, look.suit)
      p(c, 12, ay + y0, look.skin)
      p(c, 12, ay + y0 + (dir === 'down' ? 1 : -1), C.cyan)
    } else {
      r(c, 12, 7 + y0 + Math.max(0, -ly), 1, 3, look.suit)
      p(c, 12, 10 + y0 + Math.max(0, -ly), look.skin)
    }
  }
  // Head
  const hy = 1 + y0
  if (dir === 'up') {
    r(c, 5, hy, 6, 6, look.hair)
    r(c, 5, hy + 5, 6, 1, look.suitD)
    if (look.style === 'goggles') r(c, 5, hy + 2, 6, 1, C.amberD)
  } else if (dir === 'down') {
    r(c, 5, hy + 1, 6, 5, look.skin)
    r(c, 5, hy, 6, 2, look.hair)
    p(c, 5, hy + 2, look.hair)
    p(c, 10, hy + 2, look.hair)
    if (look.style === 'long') (r(c, 4, hy + 1, 1, 6, look.hair), r(c, 11, hy + 1, 1, 6, look.hair))
    if (look.style === 'hood') (r(c, 4, hy, 8, 2, look.hair), r(c, 4, hy, 1, 7, look.hair), r(c, 11, hy, 1, 7, look.hair))
    if (look.style === 'goggles') (r(c, 6, hy + 1, 4, 1, C.amber), p(c, 7, hy + 1, C.white))
    if (look.visor) r(c, 5, hy + 3, 6, 1, look.visor)
    else if (hurt) (r(c, 6, hy + 3, 1, 1, C.void), r(c, 9, hy + 3, 1, 1, C.void))
    else (p(c, 6, hy + 3, C.void), p(c, 9, hy + 3, C.void))
    p(c, 7, hy + 5, '#b06a4a')
  } else {
    r(c, 6, hy + 1, 5, 5, look.skin)
    r(c, 5, hy, 6, 2, look.hair)
    r(c, 5, hy + 1, 2, 4, look.hair)
    if (look.style === 'long') r(c, 4, hy + 1, 2, 6, look.hair)
    if (look.style === 'hood') (r(c, 4, hy, 7, 2, look.hair), r(c, 4, hy, 3, 7, look.hair))
    if (look.style === 'goggles') (r(c, 8, hy + 1, 3, 1, C.amber))
    if (look.visor) r(c, 8, hy + 3, 3, 1, look.visor)
    else p(c, 9, hy + 3, C.void)
  }
}

function drawFallen(c: Ctx, look: Look, stage: number) {
  ellipse(c, 8, 13.5, 7, 2, 'rgba(0,0,0,0.35)')
  if (stage === 0) {
    drawHumanoid(c, look, 'down', { bob: 2, stride: 0, swing: 0, attack: false, hurt: true })
    return
  }
  // Lying on the ground, head to the left.
  r(c, 1, 10, 4, 4, look.skin)
  r(c, 1, 10, 4, 1, look.hair)
  r(c, 5, 10, 6, 4, look.suit)
  r(c, 5, 13, 6, 1, look.suitD)
  r(c, 11, 11, 4, 2, look.suitD)
  r(c, 14, 11, 1, 2, look.boots)
  if (look.visor) r(c, 2, 11, 1, 2, stage === 3 ? C.cyanDD : look.visor)
}

/** Frames: `<dir>-idle-0..1`, `<dir>-walk-0..3`, `<dir>-attack-0..1`, `<dir>-hurt`, `death-0..3`. */
export function humanoidSheet(look: Look): Sheet {
  const draws: [string, (c: Ctx) => void][] = []
  const pose = (o: Partial<Pose>): Pose => ({ bob: 0, stride: 0, swing: 0, attack: false, hurt: false, ...o })
  for (const dir of DIRS) {
    draws.push([`${dir}-idle-0`, (c) => drawHumanoid(c, look, dir, pose({}))])
    draws.push([`${dir}-idle-1`, (c) => drawHumanoid(c, look, dir, pose({ bob: 1 }))])
    const walk = [pose({ stride: 1, swing: 1 }), pose({ bob: 1 }), pose({ stride: -1, swing: -1 }), pose({ bob: 1 })]
    walk.forEach((w, i) => draws.push([`${dir}-walk-${i}`, (c) => drawHumanoid(c, look, dir, w)]))
    draws.push([`${dir}-attack-0`, (c) => drawHumanoid(c, look, dir, pose({ attack: true }))])
    draws.push([`${dir}-attack-1`, (c) => drawHumanoid(c, look, dir, pose({ attack: true, bob: 1 }))])
    draws.push([`${dir}-hurt`, (c) => drawHumanoid(c, look, dir, pose({ hurt: true }))])
  }
  for (let i = 0; i < 4; i++) draws.push([`death-${i}`, (c) => drawFallen(c, look, i)])
  return sheet(16, draws)
}

// ---------- Machines ----------

function drawDrone(c: Ctx, bob: number, flame: number, eye: 'idle' | 'alert' | 'attack', broken = 0) {
  ellipse(c, 8, 15, 3.5, 1, 'rgba(0,0,0,0.35)')
  const y = bob
  if (broken) {
    const s = broken * 2
    ellipse(c, 6 - s, 7 + y, 3, 3, C.s3)
    ellipse(c, 10 + s, 8 + y + s / 2, 3, 2.5, C.s2)
    p(c, 8, 7 + y - s, C.amber)
    p(c, 4 - s, 4 + y, C.red)
    if (broken < 3) ellipse(c, 8, 8 + y, 2 + broken, 2 + broken, broken === 1 ? C.amber : C.red)
    return
  }
  r(c, 3, 2 + y, 1, 3, C.s5)
  r(c, 12, 2 + y, 1, 3, C.s5)
  p(c, 3, 1 + y, C.red)
  p(c, 12, 1 + y, C.red)
  r(c, 1, 6 + y, 2, 3, C.s3)
  r(c, 13, 6 + y, 2, 3, C.s3)
  ellipse(c, 8, 7.5 + y, 5.5, 5, C.s2)
  ellipse(c, 7.5, 7 + y, 4.8, 4.3, C.s4)
  ellipse(c, 6.5, 5.5 + y, 2, 1.5, C.s5)
  ellipse(c, 8, 8 + y, 2, 2, eye === 'attack' ? C.white : C.redD)
  ellipse(c, 8, 8 + y, 1.2, 1.2, eye === 'idle' ? C.red : C.white)
  if (eye === 'alert') p(c, 8, 8 + y, C.red)
  r(c, 7, 12 + y, 2, 1 + flame, C.cyan)
  p(c, 7, 13 + y + flame, C.cyanD)
}

export function droneSheet(): Sheet {
  return sheet(16, [
    ['hover-0', (c) => drawDrone(c, 0, 1, 'idle')],
    ['hover-1', (c) => drawDrone(c, 1, 0, 'idle')],
    ['hover-2', (c) => drawDrone(c, 1, 1, 'idle')],
    ['hover-3', (c) => drawDrone(c, 0, 0, 'idle')],
    ['alert', (c) => drawDrone(c, 0, 1, 'alert')],
    ['attack-0', (c) => drawDrone(c, 0, 2, 'attack')],
    ['attack-1', (c) => drawDrone(c, 1, 2, 'attack')],
    ...[1, 2, 3, 4].map((b, i) => [`death-${i}`, (c: Ctx) => drawDrone(c, 0, 0, 'idle', b)] as [string, (c: Ctx) => void]),
  ])
}

function drawSentinel(c: Ctx, scan: number, charge: number, broken = 0) {
  ellipse(c, 8, 14.5, 6, 1.5, 'rgba(0,0,0,0.4)')
  r(c, 2, 11, 2, 4, C.s3)
  r(c, 12, 11, 2, 4, C.s3)
  r(c, 7, 12, 2, 3, C.s3)
  if (broken) {
    r(c, 4, 8 + broken, 8, 4 - Math.min(3, broken), C.s2)
    p(c, 6, 7 + broken, C.amber)
    p(c, 10, 6 + broken, C.red)
    if (broken < 3) ellipse(c, 8, 7, 2 + broken, 2 + broken, broken === 1 ? C.amber : C.red)
    return
  }
  r(c, 3, 6, 10, 6, C.s1)
  r(c, 4, 6, 8, 5, C.s3)
  r(c, 4, 6, 8, 1, C.s5)
  p(c, 5, 9, charge ? C.red : C.amberD)
  p(c, 10, 9, charge ? C.red : C.amberD)
  ellipse(c, 8, 4.5, 4, 3.5, C.s1)
  ellipse(c, 8, 4, 3.4, 3, C.s4)
  r(c, 5, 4, 6, 1, C.void)
  p(c, 5 + scan, 4, charge ? C.white : C.red)
  p(c, 6 + scan, 4, charge === 2 ? C.white : C.red)
  if (charge) ellipse(c, 8, 4, 1.5, 1.5, charge === 2 ? C.white : C.red)
}

export function sentinelSheet(): Sheet {
  return sheet(16, [
    ['idle-0', (c) => drawSentinel(c, 0, 0)],
    ['idle-1', (c) => drawSentinel(c, 2, 0)],
    ['idle-2', (c) => drawSentinel(c, 4, 0)],
    ['idle-3', (c) => drawSentinel(c, 2, 0)],
    ['charge-0', (c) => drawSentinel(c, 2, 1)],
    ['charge-1', (c) => drawSentinel(c, 2, 2)],
    ...[1, 2, 3, 4].map((b, i) => [`death-${i}`, (c: Ctx) => drawSentinel(c, 0, 0, b)] as [string, (c: Ctx) => void]),
  ])
}

function drawWarden(c: Ctx, o: { core: string; eye: string; lean: number; tilt: number; dead?: boolean }) {
  const dark = o.dead ? C.r1 : C.s2
  const mid = o.dead ? C.r2 : C.s3
  const light = o.dead ? C.r3 : C.s4
  const top = o.dead ? C.r3 : C.s5
  ellipse(c, 24, 45, 17, 3, 'rgba(0,0,0,0.45)')
  // Legs
  for (const x of [12, 28]) {
    r(c, x, 32, 8, 12, dark)
    r(c, x + 1, 32, 6, 11, mid)
    r(c, x, 36, 8, 3, light)
    r(c, x - 1, 43, 10, 3, dark)
    r(c, x - 1, 43, 10, 1, light)
  }
  const y = o.lean
  const t = o.tilt
  // Hips and torso
  r(c, 13, 29 + y, 22, 5, dark)
  r(c, 8 + t, 12 + y, 32, 19, dark)
  r(c, 9 + t, 12 + y, 30, 17, mid)
  r(c, 9 + t, 12 + y, 30, 2, top)
  r(c, 12 + t, 16 + y, 8, 10, light)
  r(c, 28 + t, 16 + y, 8, 10, light)
  for (const [x, yy] of [[11, 15], [36, 15], [11, 27], [36, 27]] as const) p(c, x + t, yy + y, C.s6)
  r(c, 22 + t, 14 + y, 4, 14, dark)
  ellipse(c, 24 + t, 22 + y, 5, 5, C.void)
  ellipse(c, 24 + t, 22 + y, 3.8, 3.8, o.core)
  ellipse(c, 23 + t, 21 + y, 1.5, 1.5, C.white)
  // Shoulder missile pods
  for (const x of [1, 37]) {
    r(c, x + t, 9 + y, 10, 13, dark)
    r(c, x + 1 + t, 9 + y, 8, 12, light)
    r(c, x + 1 + t, 9 + y, 8, 1, top)
    for (const yy of [12, 16]) for (const xx of [x + 2, x + 6]) (r(c, xx + t, yy + y, 2, 2, C.void), p(c, xx + t, yy + y, o.dead ? C.r1 : C.red))
  }
  // Arms
  for (const x of [3, 39]) (r(c, x + t, 22 + y, 6, 10, dark), r(c, x + 1 + t, 22 + y, 4, 9, mid), r(c, x + t, 30 + y, 6, 3, light))
  // Head
  r(c, 18 + t, 4 + y, 12, 9, dark)
  r(c, 19 + t, 4 + y, 10, 8, light)
  r(c, 19 + t, 4 + y, 10, 1, top)
  r(c, 20 + t, 8 + y, 8, 2, C.void)
  r(c, 21 + t, 8 + y, 6, 1, o.eye)
  r(c, 23 + t, 1 + y, 2, 3, mid)
  p(c, 23 + t, 0 + y, o.dead ? C.r2 : C.red)
  if (o.dead) for (const [x, yy] of [[14, 18], [30, 24], [20, 10], [33, 14]] as const) r(c, x, yy, 2, 1, C.void)
}

export function wardenSheet(): Sheet {
  return sheet(48, [
    ['idle-0', (c) => drawWarden(c, { core: C.red, eye: C.red, lean: 0, tilt: 0 })],
    ['idle-1', (c) => drawWarden(c, { core: C.redD, eye: C.red, lean: 1, tilt: 0 })],
    ['telegraph', (c) => drawWarden(c, { core: C.white, eye: C.white, lean: 0, tilt: 0 })],
    ['laser', (c) => drawWarden(c, { core: C.amber, eye: C.cyan, lean: 0, tilt: 0 })],
    ['charge', (c) => drawWarden(c, { core: C.amber, eye: C.amber, lean: 2, tilt: 0 })],
    ['stagger', (c) => drawWarden(c, { core: C.redD, eye: C.redD, lean: 2, tilt: 1 })],
    ['dead', (c) => drawWarden(c, { core: C.r1, eye: C.r1, lean: 3, tilt: 1, dead: true })],
  ])
}

// ---------- Effects ----------

export function fxSheet(): Sheet {
  const [cv, ctx] = makeCanvas(400, 32)
  const frames: Sheet['frames'] = []
  let x = 0
  const add = (name: string, w: number, h: number, draw: (c: Ctx) => void) => {
    ctx.save()
    ctx.translate(x, 0)
    draw(ctx)
    ctx.restore()
    frames.push({ name, x, y: 0, w, h })
    x += w
  }
  // Blade slash, facing right; rotated by the engine for other directions.
  for (let f = 0; f < 4; f++)
    add(`slash-${f}`, 24, 24, (c) => {
      const from = -1.3 + f * 0.35
      for (let a = from; a < from + 1.6; a += 0.06) {
        for (let rad = 7; rad <= 11; rad++) {
          const col = rad === 11 ? C.white : rad >= 9 ? C.cyan : C.cyanDD
          if (f === 3 && rad > 9) continue
          p(c, Math.round(12 + Math.cos(a) * rad), Math.round(12 + Math.sin(a) * rad), col)
        }
      }
    })
  for (let f = 0; f < 2; f++)
    add(`plasma-${f}`, 8, 8, (c) => (ellipse(c, 4, 4, 3.5 - f * 0.5, 3.5 - f * 0.5, C.cyanD), ellipse(c, 4, 4, 2, 2, C.cyan), p(c, 3, 3, C.white)))
  for (let f = 0; f < 2; f++)
    add(`bolt-${f}`, 8, 8, (c) => (ellipse(c, 4, 4, 3 - f * 0.5, 3 - f * 0.5, C.redD), ellipse(c, 4, 4, 1.8, 1.8, C.red), p(c, 4, 4, C.white)))
  for (let f = 0; f < 5; f++)
    add(`boom-${f}`, 24, 24, (c) => {
      const rad = 3 + f * 2.2
      if (f < 4) ellipse(c, 12, 12, rad, rad, f < 2 ? C.amber : C.red)
      if (f < 3) ellipse(c, 12, 12, rad * 0.6, rad * 0.6, f === 0 ? C.white : C.amber)
      if (f >= 2) for (let i = 0; i < 8; i++) p(c, Math.round(12 + Math.cos(i) * (rad + 1)), Math.round(12 + Math.sin(i) * (rad + 1)), C.s4)
    })
  for (let f = 0; f < 2; f++)
    add(`marker-${f}`, 16, 16, (c) => {
      const col = f ? C.red : C.redD
      for (let a = 0; a < 6.3; a += 0.15) p(c, Math.round(8 + Math.cos(a) * 6.5), Math.round(8 + Math.sin(a) * 6.5), col)
      r(c, 7, 2, 2, 3, col)
      r(c, 7, 11, 2, 3, col)
      r(c, 2, 7, 3, 2, col)
      r(c, 11, 7, 3, 2, col)
    })
  add('glow', 32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(0.4, 'rgba(255,255,255,0.35)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    c.fillStyle = g
    c.fillRect(0, 0, 32, 32)
  })
  add('shield', 20, 20, (c) => {
    for (let a = 0; a < 6.3; a += 0.1) p(c, Math.round(10 + Math.cos(a) * 9), Math.round(10 + Math.sin(a) * 9), C.magenta)
    for (let a = 0.3; a < 6.3; a += 1.05) p(c, Math.round(10 + Math.cos(a) * 6), Math.round(10 + Math.sin(a) * 6), C.magentaD)
  })
  add('prompt', 9, 9, (c) => {
    r(c, 0, 0, 9, 9, C.void)
    r(c, 1, 1, 7, 7, C.white)
    r(c, 3, 2, 3, 1, C.void)
    r(c, 3, 2, 1, 5, C.void)
    r(c, 3, 4, 2, 1, C.void)
    r(c, 3, 6, 3, 1, C.void)
  })
  add('px', 2, 2, (c) => r(c, 0, 0, 2, 2, C.white))
  add('beam', 4, 4, (c) => r(c, 0, 0, 4, 4, C.white))
  add('shadow', 12, 4, (c) => ellipse(c, 6, 2, 6, 2, 'rgba(0,0,0,0.4)'))
  add('bench', 16, 16, (c) => {
    r(c, 0, 4, 16, 10, C.s1)
    r(c, 1, 4, 14, 8, C.s4)
    r(c, 1, 4, 14, 1, C.s6)
    r(c, 3, 6, 4, 3, C.cyanDD)
    r(c, 3, 6, 4, 1, C.cyan)
    r(c, 9, 6, 2, 2, C.amber)
    r(c, 12, 7, 2, 2, C.s2)
    r(c, 2, 12, 2, 3, C.s2)
    r(c, 12, 12, 2, 3, C.s2)
  })
  add('device', 16, 16, (c) => {
    ellipse(c, 8, 14, 6, 1.5, 'rgba(0,0,0,0.4)')
    r(c, 3, 7, 10, 7, C.s1)
    r(c, 4, 7, 8, 6, C.s3)
    r(c, 4, 7, 8, 1, C.s5)
    r(c, 5, 9, 3, 2, C.cyan)
    p(c, 10, 9, C.amber)
    r(c, 10, 2, 1, 5, C.s5)
    p(c, 10, 1, C.cyan)
    r(c, 5, 11, 6, 1, C.s2)
  })
  return { canvas: cv, frames }
}

// ---------- Item icons (16 x 16) ----------

const ICONS: Record<ItemId | 'credits', (c: Ctx) => void> = {
  ...CH2_ICONS,
  credits: (c) => {
    ellipse(c, 8, 8, 6, 6, C.amberD)
    ellipse(c, 8, 7.5, 5, 5, C.amber)
    r(c, 7, 4, 2, 8, C.amberD)
    r(c, 5, 6, 6, 1, C.amberD)
    r(c, 5, 9, 6, 1, C.amberD)
    p(c, 5, 4, C.white)
  },
  healing_cell: (c) => {
    r(c, 4, 2, 8, 12, C.void)
    r(c, 5, 3, 6, 10, C.greenD)
    r(c, 5, 3, 6, 2, C.s5)
    r(c, 5, 11, 6, 2, C.s5)
    r(c, 7, 6, 2, 4, C.white)
    r(c, 6, 7, 4, 2, C.white)
    p(c, 5, 5, C.green)
  },
  energy_cell: (c) => {
    r(c, 6, 1, 4, 2, C.s5)
    r(c, 4, 3, 8, 12, C.void)
    r(c, 5, 4, 6, 10, C.cyanDD)
    r(c, 5, 9, 6, 5, C.cyanD)
    r(c, 8, 5, 2, 2, C.white)
    r(c, 7, 7, 2, 2, C.white)
    r(c, 6, 9, 2, 2, C.white)
  },
  components: (c) => {
    ellipse(c, 7, 8, 5, 5, C.s3)
    for (const [x, y] of [[7, 2], [7, 13], [1, 8], [12, 8], [3, 4], [11, 4], [3, 12], [11, 12]] as const) r(c, x, y, 2, 2, C.s4)
    ellipse(c, 7, 8, 2, 2, C.s1)
    r(c, 11, 10, 4, 2, C.amber)
    r(c, 13, 9, 1, 4, C.amberD)
  },
  transmission_device: (c) => {
    r(c, 2, 6, 12, 8, C.s1)
    r(c, 3, 6, 10, 7, C.s3)
    r(c, 4, 8, 4, 3, C.cyan)
    ellipse(c, 11, 9.5, 1.5, 1.5, C.amber)
    r(c, 11, 1, 1, 5, C.s5)
    p(c, 11, 0, C.cyan)
  },
  pulse_blade: (c) => {
    for (let i = 0; i < 8; i++) (p(c, 6 + i, 9 - i, C.cyan), p(c, 7 + i, 9 - i, C.cyanD))
    r(c, 3, 10, 4, 2, C.s5)
    r(c, 2, 12, 3, 2, C.s3)
    p(c, 13, 2, C.white)
  },
  arc_blade: (c) => {
    for (let i = 0; i < 11; i++) (p(c, 4 + i, 11 - i, C.magenta), p(c, 5 + i, 11 - i, C.p4))
    for (const [x, y] of [[8, 5], [10, 6], [12, 3]] as const) p(c, x, y, C.cyan)
    r(c, 1, 12, 4, 2, C.s5)
    r(c, 2, 11, 2, 4, C.amberD)
  },
  plasma_blaster: (c) => {
    r(c, 2, 5, 11, 4, C.s4)
    r(c, 2, 5, 11, 1, C.s6)
    r(c, 13, 6, 2, 2, C.cyan)
    r(c, 4, 9, 3, 5, C.s3)
    r(c, 8, 6, 3, 2, C.cyanD)
  },
  basic_armor: (c) => {
    r(c, 3, 2, 10, 12, C.s1)
    r(c, 4, 3, 8, 10, C.s4)
    r(c, 4, 3, 8, 1, C.s6)
    r(c, 7, 4, 2, 8, C.cyanD)
    r(c, 2, 3, 2, 4, C.s3)
    r(c, 12, 3, 2, 4, C.s3)
  },
  warden_plating: (c) => {
    r(c, 2, 1, 12, 14, C.s1)
    r(c, 3, 2, 10, 12, C.s3)
    r(c, 3, 2, 10, 2, C.s5)
    ellipse(c, 8, 8.5, 2.5, 2.5, C.red)
    p(c, 7, 7, C.white)
    r(c, 3, 12, 10, 1, C.s2)
  },
  signal_amplifier: (c) => {
    r(c, 4, 9, 8, 5, C.s1)
    r(c, 5, 10, 6, 3, C.greenD)
    p(c, 6, 11, C.green)
    p(c, 9, 11, C.amber)
    for (let a = -0.9; a < 0.9; a += 0.15) {
      p(c, Math.round(8 + Math.sin(a) * 4), Math.round(7 - Math.cos(a) * 4), C.cyanD)
      p(c, Math.round(8 + Math.sin(a) * 6), Math.round(7 - Math.cos(a) * 6), C.cyan)
    }
  },
}

export function iconCanvas(id: ItemId | 'credits'): HTMLCanvasElement {
  const [cv, ctx] = makeCanvas(16, 16)
  ICONS[id](ctx)
  return cv
}

export function iconSheet(): Sheet {
  return sheet(16, (Object.keys(ICONS) as (ItemId | 'credits')[]).map((id) => [id, ICONS[id]]))
}

const urls = new Map<string, string>()
/** Data URL of an icon or portrait, for <img> in React (cached). */
export function iconUrl(id: ItemId | 'credits'): string {
  if (!urls.has(id)) urls.set(id, iconCanvas(id).toDataURL())
  return urls.get(id)!
}
export function portraitUrl(who: 'kael' | NpcId | 'archive'): string {
  const key = `portrait:${who}`
  if (!urls.has(key)) {
    const [cv, ctx] = makeCanvas(16, 16)
    if (who === 'archive') {
      r(ctx, 0, 0, 16, 16, C.night)
      for (let x = 1; x < 15; x++) p(ctx, x, Math.round(8 + Math.sin(x * 0.9) * (x % 3 === 0 ? 5 : 2)), C.cyan)
    } else drawHumanoid(ctx, LOOKS[who], 'down', { bob: 0, stride: 0, swing: 0, attack: false, hurt: false })
    urls.set(key, cv.toDataURL())
  }
  return urls.get(key)!
}
