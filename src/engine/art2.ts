// Chapter 2 pixel art: the Ashen Frontier, the Relay Spire and the Signal Chamber, their machines and the Arbiter.
// Drawn in code like the rest (no image files). The Spire's look is deliberately unlike Nova-7: pale ceramic, magenta light.
import { C, ellipse, hash, makeCanvas, p, r, sheet, speckle, type Ctx, type Sheet } from './pixels.ts'

const A = {
  ash1: '#2a2527', ash2: '#3a3436', ash3: '#4d4547', ember: '#ff7a3a', emberD: '#8a3a22',
  rust1: '#3f2620', rust2: '#5a3a2e', rust3: '#7a4e3a', rust4: '#9a6a4a', road1: '#232227', road2: '#2e2d33', road3: '#3d3c44',
  ivory1: '#4a5470', ivory2: '#9aa6bf', ivory3: '#c8d0e0', ivory4: '#e8edf6', floor1: '#0e1324', floor2: '#141a2e', floor3: '#1f2944',
  violet1: '#120b22', violet2: '#1a1230', violet3: '#2b1d4a', violet4: '#4a2f7a',
}

type TileDraw = (c: Ctx, v: number) => void
export const CH2_TILES: Record<string, { n: number; draw: TileDraw; transparent?: boolean }> = {}
const tile = (name: string, n: number, draw: TileDraw, transparent = false) => (CH2_TILES[name] = { n, draw, transparent })
const draw = (name: string, c: Ctx, v = 0) => CH2_TILES[name]!.draw(c, v)

// ---------- Ashen Frontier ----------

tile('ash', 4, (c, v) => {
  r(c, 0, 0, 16, 16, A.ash2)
  speckle(c, 600 + v, [A.ash1, A.ash3, A.ash1], 0.22)
  if (v === 3) (r(c, 4, 9, 5, 1, A.ash1), r(c, 5, 10, 3, 1, A.ash1))
})
tile('cinder', 2, (c, v) => {
  draw('ash', c, v)
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(hash(i, v, 61) * 14) + 1
    const y = Math.floor(hash(v, i, 62) * 14) + 1
    p(c, x, y, i ? A.emberD : A.ember)
  }
})
tile('road', 3, (c, v) => {
  r(c, 0, 0, 16, 16, A.road2)
  speckle(c, 620 + v, [A.road1, A.road3], 0.14)
  if (v === 1) for (let i = 0; i < 7; i++) p(c, 2 + i, 5 + Math.floor(i / 2), A.road1)
  if (v === 2) (r(c, 7, 2, 2, 4, '#6b5a2a'), r(c, 7, 10, 2, 4, '#6b5a2a'))
})
tile('rust', 3, (c, v) => {
  r(c, 0, 0, 16, 16, A.rust2)
  r(c, 0, 0, 16, 1, A.rust1)
  r(c, 0, 0, 1, 16, A.rust1)
  r(c, 0, 8, 16, 1, A.rust1)
  for (const [x, y] of [[2, 2], [13, 2], [2, 10], [13, 10]] as const) p(c, x, y, A.rust4)
  speckle(c, 640 + v, [A.rust1, A.rust3], 0.12)
})
tile('scrap', 3, (c, v) => {
  r(c, 0, 0, 16, 16, A.rust2)
  for (let x = 0; x < 16; x += 3) r(c, x, 0, 1, 12, A.rust1)
  r(c, 0, 0, 16, 2, A.rust4)
  r(c, 0, 12, 16, 4, A.rust1)
  speckle(c, 660 + v, [A.rust3, A.ash1], 0.08, 0, 2, 16, 10)
  if (v === 1) (r(c, 9, 0, 4, 3, A.ash1), p(c, 11, 3, A.rust3))
})
tile('tank', 2, (c, v) => {
  ellipse(c, 8, 13, 7, 2.5, 'rgba(0,0,0,0.4)')
  ellipse(c, 8, 8, 7, 6.5, '#3b4450')
  ellipse(c, 7.5, 7.5, 6, 5.5, '#55606e')
  ellipse(c, 6, 5.5, 2.5, 1.8, '#8a96a6')
  r(c, 2, 9, 12, 1, v ? C.amberD : A.rust3)
  p(c, 11, 4, A.rust4)
}, true)
tile('stack', 1, (c) => {
  r(c, 0, 0, 16, 16, A.ash2)
  ellipse(c, 8, 8, 7.5, 7.5, A.rust1)
  ellipse(c, 8, 8, 6.5, 6.5, '#5c3b34')
  ellipse(c, 8, 8, 4, 4, A.ash1)
  ellipse(c, 8, 8, 2.5, 2.5, A.emberD)
  p(c, 8, 8, A.ember)
})
tile('pipeline', 1, (c) => {
  draw('ash', c, 0)
  for (const y of [3, 9]) (r(c, 0, y, 16, 4, '#4f5866'), r(c, 0, y, 16, 1, '#7a8494'), r(c, 0, y + 3, 16, 1, '#2f3540'))
  r(c, 6, 2, 2, 12, A.rust3)
})
tile('vent', 1, (c) => {
  r(c, 0, 0, 16, 16, A.road2)
  r(c, 2, 2, 12, 12, A.road1)
  for (let y = 3; y < 14; y += 2) r(c, 3, y, 10, 1, '#4a3a34')
  ellipse(c, 8, 8, 3, 3, 'rgba(255,122,58,0.35)')
})
tile('cracked', 1, (c) => {
  r(c, 0, 0, 16, 16, '#5a5a62')
  r(c, 0, 0, 16, 2, '#7a7a84')
  r(c, 0, 13, 16, 3, '#3a3a42')
  speckle(c, 680, ['#4a4a52', '#6a6a74'], 0.15, 0, 2, 16, 11)
  // A clear crack: something can break through here.
  for (const [x, y] of [[7, 2], [8, 3], [8, 4], [7, 5], [6, 6], [7, 7], [8, 8], [9, 9], [8, 10], [7, 11], [10, 5], [11, 4]] as const) p(c, x, y, '#1a1a20')
  p(c, 9, 7, C.amber)
})
tile('rubble', 1, (c) => {
  draw('ash', c, 1)
  for (const [x, y, w] of [[2, 3, 3], [10, 2, 2], [5, 10, 4], [12, 11, 2], [8, 6, 2]] as const) (r(c, x, y, w, 2, '#5a5a62'), r(c, x, y, w, 1, '#7a7a84'))
})
tile('pylon', 2, (c, v) => {
  ellipse(c, 8, 13.5, 6, 2, 'rgba(0,0,0,0.4)')
  r(c, 5, 10, 6, 4, '#3b4450')
  r(c, 6, 2, 4, 9, '#55606e')
  r(c, 6, 2, 1, 9, '#8a96a6')
  for (const y of [3, 5, 7]) r(c, 5, y, 6, 1, v ? C.cyan : '#2f3540')
  ellipse(c, 8, 2, 2.5, 1.5, v ? C.cyan : C.redD)
  p(c, 8, 1, v ? C.white : C.red)
}, true)
tile('cable', 2, (c, v) => {
  draw('ash', c, 2)
  r(c, 0, 7, 16, 3, '#15151b')
  r(c, 0, 8, 16, 1, v ? C.cyan : '#2b2b34')
  if (v) for (let x = 1; x < 16; x += 5) p(c, x, 7, C.cyanD)
})
tile('blastdoor', 1, (c) => {
  r(c, 0, 0, 16, 16, '#3b4450')
  r(c, 0, 0, 16, 2, '#6a7686')
  for (let i = 0; i < 4; i++) (r(c, i * 4, 4 + (i % 2), 3, 2, C.amber), r(c, i * 4 + 1, 9 - (i % 2), 3, 2, C.void))
  r(c, 0, 13, 16, 3, '#20252e')
  r(c, 7, 11, 2, 2, C.red)
})
tile('blastopen', 1, (c) => {
  draw('road', c, 0)
  r(c, 0, 0, 2, 16, '#3b4450')
  r(c, 14, 0, 2, 16, '#3b4450')
  p(c, 1, 2, C.green)
  p(c, 14, 2, C.green)
})

// ---------- The Relay Spire ----------

tile('spirefloor', 3, (c, v) => {
  r(c, 0, 0, 16, 16, A.floor2)
  r(c, 0, 0, 16, 1, A.floor1)
  r(c, 0, 0, 1, 16, A.floor1)
  r(c, 1, 1, 15, 1, A.floor3)
  speckle(c, 700 + v, [A.floor1, A.floor3], 0.05, 1, 2, 15, 14)
  if (v === 1) (p(c, 4, 4, '#3a4a7a'), p(c, 5, 4, '#2a3560'))
  if (v === 2) r(c, 10, 11, 3, 1, A.floor3)
})
tile('conduit', 2, (c, v) => {
  draw('spirefloor', c, 0)
  const col = v ? C.magentaD : C.cyanDD
  r(c, 0, 8, 16, 1, col)
  r(c, v ? 4 : 11, 8, 1, 8, col)
  p(c, v ? 4 : 11, 8, v ? C.magenta : C.cyan)
})
tile('spirewall', 2, (c, v) => {
  r(c, 0, 0, 16, 16, A.ivory2)
  r(c, 0, 0, 16, 3, A.ivory3)
  r(c, 0, 0, 16, 1, A.ivory4)
  r(c, 0, 12, 16, 4, A.ivory1)
  r(c, 0, 11, 16, 1, '#6a7590')
  r(c, 7, 3, 1, 8, '#8a96b0')
  r(c, 2, 6, 3, 1, v ? C.magenta : C.magentaD)
  r(c, 11, 6, 3, 1, v ? C.magentaD : C.magenta)
})
tile('console', 1, (c) => {
  draw('spirewall', c, 0)
  r(c, 3, 4, 10, 6, A.violet1)
  r(c, 4, 5, 8, 4, A.violet3)
  r(c, 4, 5, 5, 1, C.magenta)
  r(c, 4, 7, 3, 1, C.cyan)
  p(c, 11, 8, C.green)
})
tile('pillar', 1, (c) => {
  ellipse(c, 8, 13, 6, 2.5, 'rgba(0,0,0,0.4)')
  ellipse(c, 8, 8, 6.5, 6.5, A.ivory1)
  ellipse(c, 8, 7.5, 5.5, 5.5, A.ivory2)
  ellipse(c, 7, 6.5, 3, 3, A.ivory3)
  for (let a = 0; a < 6.3; a += 0.25) p(c, Math.round(8 + Math.cos(a) * 4.5), Math.round(7.5 + Math.sin(a) * 4.5), C.cyanD)
}, true)
tile('void', 1, (c) => {
  r(c, 0, 0, 16, 16, '#04050c')
  speckle(c, 720, [A.violet3, '#0a0c1a'], 0.06)
  p(c, 5, 9, A.violet4)
})
const barrier = (c: Ctx, color: string, dark: string) => {
  draw('spirefloor', c, 0)
  r(c, 0, 0, 2, 16, A.ivory1)
  r(c, 14, 0, 2, 16, A.ivory1)
  for (const x of [4, 8, 12]) (r(c, x - 1, 0, 3, 16, dark), r(c, x, 0, 1, 16, color))
}
tile('barrierA', 1, (c) => barrier(c, C.cyan, C.cyanDD))
tile('barrierB', 1, (c) => barrier(c, C.magenta, C.magentaD))
tile('barrieroff', 1, (c) => {
  draw('spirefloor', c, 0)
  r(c, 0, 0, 2, 16, A.ivory1)
  r(c, 14, 0, 2, 16, A.ivory1)
  for (const y of [2, 13]) (p(c, 1, y, '#3a4a7a'), p(c, 14, y, '#3a4a7a'))
})
tile('keydoor', 1, (c) => {
  r(c, 0, 0, 16, 16, A.ivory2)
  r(c, 0, 0, 16, 2, A.ivory4)
  r(c, 7, 0, 2, 16, A.ivory1)
  r(c, 0, 13, 16, 3, A.ivory1)
  r(c, 11, 6, 3, 4, A.violet1)
  r(c, 12, 7, 1, 2, C.red)
})
tile('keydooropen', 1, (c) => {
  draw('spirefloor', c, 0)
  r(c, 0, 0, 2, 16, A.ivory2)
  r(c, 14, 0, 2, 16, A.ivory2)
  p(c, 15, 7, C.green)
})
tile('terminal', 2, (c, v) => {
  r(c, 0, 0, 16, 16, A.floor2)
  ellipse(c, 8, 13.5, 6, 2, 'rgba(0,0,0,0.4)')
  r(c, 3, 3, 10, 10, A.ivory1)
  r(c, 3, 3, 10, 1, A.ivory3)
  r(c, 4, 4, 8, 6, A.violet1)
  const col = v ? C.magenta : C.cyan
  // A big letter on screen: A or B, the barrier that is currently down.
  if (v) (r(c, 6, 5, 1, 4, col), r(c, 7, 5, 2, 1, col), r(c, 7, 7, 2, 1, col), r(c, 7, 8, 2, 1, col), p(c, 9, 6, col))
  else (r(c, 6, 6, 1, 3, col), r(c, 9, 6, 1, 3, col), r(c, 7, 5, 2, 1, col), r(c, 7, 7, 2, 1, col))
  r(c, 5, 11, 6, 1, col)
})

// ---------- The Signal Chamber ----------

tile('chamberfloor', 3, (c, v) => {
  r(c, 0, 0, 16, 16, A.violet2)
  r(c, 0, 0, 16, 1, A.violet1)
  r(c, 0, 0, 1, 16, A.violet1)
  speckle(c, 740 + v, [A.violet1, A.violet3], 0.08, 1, 1, 15, 15)
  if (v === 1) (p(c, 0, 8, C.magentaD), p(c, 8, 0, C.magentaD))
})
tile('ring', 1, (c) => {
  draw('chamberfloor', c, 0)
  ellipse(c, 8, 8, 5, 5, C.cyanDD)
  ellipse(c, 8, 8, 3.5, 3.5, C.cyanD)
  ellipse(c, 8, 8, 2, 2, C.cyan)
  p(c, 7, 7, C.white)
})
tile('seal', 1, (c) => {
  draw('chamberfloor', c, 0)
  for (const y of [3, 7, 11]) (r(c, 0, y - 1, 16, 3, C.magentaD), r(c, 0, y, 16, 1, C.magenta))
})
tile('sealopen', 1, (c) => draw('chamberfloor', c, 2))
tile('lift', 1, (c) => {
  r(c, 0, 0, 16, 16, A.floor1)
  ellipse(c, 8, 8, 7, 7, A.ivory1)
  ellipse(c, 8, 8, 6, 6, A.floor2)
  for (let a = 0; a < 6.3; a += 0.3) p(c, Math.round(8 + Math.cos(a) * 5), Math.round(8 + Math.sin(a) * 5), C.cyan)
  r(c, 7, 4, 2, 8, C.cyanD)
  r(c, 5, 6, 6, 1, C.cyanD)
})

// ---------- Machines ----------

/** Phantom Drone: a fast, flanking manta of violet glass. */
function drawPhantom(c: Ctx, flap: number, mode: 'idle' | 'warn' | 'dash', broken = 0) {
  ellipse(c, 8, 15, 3.5, 1, 'rgba(0,0,0,0.3)')
  if (broken) {
    const s = broken * 2
    r(c, 3 - s, 6, 4, 2, A.violet4)
    r(c, 9 + s, 7 + s / 2, 4, 2, A.violet3)
    if (broken < 3) ellipse(c, 8, 7, 1 + broken, 1 + broken, broken === 1 ? C.magenta : C.white)
    return
  }
  const wing = mode === 'dash' ? 2 : 5 + flap
  const glow = mode === 'warn' ? C.white : C.magenta
  for (let i = 0; i < wing; i++) {
    p(c, 8 - 2 - i, 6 + Math.floor(i / 2), A.violet4)
    p(c, 8 + 1 + i, 6 + Math.floor(i / 2), A.violet4)
    p(c, 8 - 2 - i, 5 + Math.floor(i / 2), glow)
    p(c, 8 + 1 + i, 5 + Math.floor(i / 2), glow)
  }
  ellipse(c, 8, 7, 3, mode === 'dash' ? 4 : 3, A.violet3)
  ellipse(c, 8, 6.5, 2, 2, A.violet4)
  r(c, 7, 6, 2, 2, mode === 'warn' ? C.white : C.magenta)
  p(c, 7, 6, C.white)
  if (mode === 'dash') (r(c, 7, 10, 2, 4, 'rgba(255,62,165,0.6)'), p(c, 7, 14, C.magentaD))
  else r(c, 7, 10, 2, 1 + flap, 'rgba(255,62,165,0.5)')
}

export function phantomSheet(): Sheet {
  return sheet(16, [
    ['hover-0', (c) => drawPhantom(c, 0, 'idle')],
    ['hover-1', (c) => drawPhantom(c, 1, 'idle')],
    ['hover-2', (c) => drawPhantom(c, 2, 'idle')],
    ['hover-3', (c) => drawPhantom(c, 1, 'idle')],
    ['warn-0', (c) => drawPhantom(c, 2, 'warn')],
    ['warn-1', (c) => drawPhantom(c, 0, 'warn')],
    ['dash', (c) => drawPhantom(c, 0, 'dash')],
    ...[1, 2, 3, 4].map((b, i) => [`death-${i}`, (c: Ctx) => drawPhantom(c, 0, 'idle', b)] as [string, (c: Ctx) => void]),
  ])
}

/** Heavy Sentinel (20 x 20): a slow walker behind a tower shield. Hit it from behind. */
function drawHeavy(c: Ctx, dir: 'down' | 'up' | 'side', bob: number, slam: boolean, broken = 0) {
  ellipse(c, 10, 18.5, 7, 1.8, 'rgba(0,0,0,0.45)')
  if (broken) {
    r(c, 4, 9 + broken, 12, 8 - broken, '#2f3540')
    p(c, 7, 9 + broken, C.amber)
    p(c, 12, 8 + broken, C.red)
    if (broken < 3) ellipse(c, 10, 10, 2 + broken * 2, 2 + broken * 2, broken === 1 ? C.amber : C.red)
    return
  }
  const y = bob
  // Legs
  r(c, 5, 14, 3, 4, '#2f3540')
  r(c, 12, 14, 3, 4, '#2f3540')
  // Body and head
  r(c, 4, 5 + y, 12, 10, '#3b4450')
  r(c, 5, 5 + y, 10, 9, '#55606e')
  r(c, 5, 5 + y, 10, 1, '#8a96a6')
  ellipse(c, 10, 4 + y, 4, 3, '#3b4450')
  const shield = slam ? C.amber : '#a08a5a'
  const edge = slam ? C.white : C.amberD
  if (dir === 'down') {
    r(c, 6, 3 + y, 8, 1, C.amber)
    r(c, 2, 11 + y, 16, 6, edge)
    r(c, 3, 11 + y, 14, 5, shield)
    r(c, 9, 12 + y, 2, 3, A.rust1)
  } else if (dir === 'up') {
    r(c, 2, 1 + y, 16, 6, edge)
    r(c, 3, 1 + y, 14, 5, shield)
    // The exposed back: a glowing power core, the weak spot.
    ellipse(c, 10, 11 + y, 2.5, 2.5, C.cyanD)
    p(c, 10, 11 + y, C.cyan)
  } else {
    r(c, 8, 3 + y, 6, 1, C.amber)
    r(c, 15, 3 + y, 4, 14, edge)
    r(c, 15, 4 + y, 3, 12, shield)
    ellipse(c, 5, 10 + y, 1.5, 2, C.cyanD)
  }
}

export function heavySheet(): Sheet {
  const draws: [string, (c: Ctx) => void][] = []
  for (const dir of ['down', 'up', 'side'] as const) {
    draws.push([`${dir}-0`, (c) => drawHeavy(c, dir, 0, false)])
    draws.push([`${dir}-1`, (c) => drawHeavy(c, dir, 1, false)])
    draws.push([`${dir}-slam`, (c) => drawHeavy(c, dir, 0, true)])
  }
  for (let i = 0; i < 4; i++) draws.push([`death-${i}`, (c) => drawHeavy(c, 'down', 0, false, i + 1)])
  return sheet(20, draws)
}

/** Spire Technician: a spindly repair unit that patches up the other machines and runs from Kael. */
function drawTech(c: Ctx, step: number, repair: boolean, broken = 0) {
  ellipse(c, 8, 15, 4, 1.2, 'rgba(0,0,0,0.35)')
  if (broken) {
    r(c, 4, 10 + broken, 8, 4 - Math.min(3, broken), A.ivory1)
    p(c, 6, 9 + broken, C.green)
    if (broken < 3) ellipse(c, 8, 9, 1 + broken, 1 + broken, broken === 1 ? C.green : C.white)
    return
  }
  r(c, 5 + step, 11, 1, 4, A.ivory1)
  r(c, 10 - step, 11, 1, 4, A.ivory1)
  r(c, 4, 6, 8, 6, A.ivory2)
  r(c, 4, 6, 8, 1, A.ivory4)
  r(c, 6, 8, 4, 2, A.violet1)
  p(c, 7, 8, C.green)
  ellipse(c, 8, 4, 3, 2.5, A.ivory3)
  r(c, 6, 4, 4, 1, C.green)
  // Repair arm
  if (repair) (r(c, 12, 7, 3, 1, A.ivory1), p(c, 15, 7, C.green), p(c, 15, 6, C.white))
  else r(c, 12, 8, 1, 3, A.ivory1)
  r(c, 3, 8, 1, 3, A.ivory1)
}

export function technicianSheet(): Sheet {
  return sheet(16, [
    ['walk-0', (c) => drawTech(c, 0, false)],
    ['walk-1', (c) => drawTech(c, 1, false)],
    ['repair-0', (c) => drawTech(c, 0, true)],
    ['repair-1', (c) => drawTech(c, 1, true)],
    ...[1, 2, 3, 4].map((b, i) => [`death-${i}`, (c: Ctx) => drawTech(c, 0, false, b)] as [string, (c: Ctx) => void]),
  ])
}

/** The Arbiter (48 x 48): OVERLORD's warden of the Spire. A core inside a shell of plates that opens when it attacks. */
function drawArbiter(c: Ctx, o: { open: number; core: string; eye: string; dead?: boolean; pulse?: number }) {
  ellipse(c, 24, 45, 12, 2.5, 'rgba(0,0,0,0.45)')
  const plate = o.dead ? '#3a3448' : A.ivory2
  const plateL = o.dead ? '#4a4458' : A.ivory4
  const plateD = o.dead ? '#26222e' : A.ivory1
  // Halo
  if (!o.dead) for (let a = 0; a < 6.3; a += 0.12) p(c, Math.round(24 + Math.cos(a) * 21), Math.round(22 + Math.sin(a) * 19), (o.pulse ?? 0) % 2 ? C.magenta : C.magentaD)
  // Core
  ellipse(c, 24, 22, 9, 9, o.dead ? '#1a1622' : A.violet1)
  ellipse(c, 24, 22, 7, 7, o.core)
  ellipse(c, 24, 22, 3.5, 3.5, o.eye)
  if (!o.dead) p(c, 22, 20, C.white)
  else for (const [x, y] of [[20, 18], [27, 24], [23, 26]] as const) r(c, x, y, 2, 1, '#000')
  // Six shell plates around the core, pushed outward by `open` pixels.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2
    const d = 11 + o.open
    const cx = Math.round(24 + Math.cos(a) * d)
    const cy = Math.round(22 + Math.sin(a) * d * 0.9)
    r(c, cx - 4, cy - 3, 8, 6, plateD)
    r(c, cx - 3, cy - 3, 6, 5, plate)
    r(c, cx - 3, cy - 3, 6, 1, plateL)
    p(c, cx, cy, o.dead ? '#26222e' : C.magenta)
  }
  // Lower spine
  r(c, 22, 32 + Math.min(o.open, 3), 4, 8, plateD)
  r(c, 23, 32 + Math.min(o.open, 3), 2, 7, plate)
}

export function arbiterSheet(): Sheet {
  return sheet(48, [
    ['shell-0', (c) => drawArbiter(c, { open: 0, core: A.violet3, eye: C.magentaD, pulse: 0 })],
    ['shell-1', (c) => drawArbiter(c, { open: 0, core: A.violet3, eye: C.magenta, pulse: 1 })],
    ['charge', (c) => drawArbiter(c, { open: 1, core: C.magentaD, eye: C.white, pulse: 1 })],
    ['open-0', (c) => drawArbiter(c, { open: 5, core: C.cyanD, eye: C.cyan, pulse: 0 })],
    ['open-1', (c) => drawArbiter(c, { open: 6, core: C.cyanD, eye: C.white, pulse: 1 })],
    ['hurt', (c) => drawArbiter(c, { open: 5, core: C.white, eye: C.white, pulse: 1 })],
    ['dead', (c) => drawArbiter(c, { open: 7, core: '#1a1622', eye: '#26222e', dead: true })],
  ])
}

// ---------- Effects ----------

export function fx2Sheet(): Sheet {
  const [cv, ctx] = makeCanvas(256, 32)
  const frames: Sheet['frames'] = []
  let x = 0
  const add = (name: string, w: number, h: number, d: (c: Ctx) => void) => {
    ctx.save()
    ctx.translate(x, 0)
    d(ctx)
    ctx.restore()
    frames.push({ name, x, y: 0, w, h })
    x += w
  }
  for (let f = 0; f < 3; f++)
    add(`steam-${f}`, 16, 24, (c) => {
      const rad = 3 + f * 1.5
      ellipse(c, 8, 18 - f * 4, rad, rad, 'rgba(230,236,245,0.75)')
      ellipse(c, 6, 20 - f * 3, rad * 0.7, rad * 0.7, 'rgba(200,208,224,0.7)')
      ellipse(c, 10, 21 - f * 2, rad * 0.6, rad * 0.6, 'rgba(255,255,255,0.8)')
    })
  add('puff', 8, 8, (c) => (ellipse(c, 4, 5, 2.5, 2.5, 'rgba(200,208,224,0.6)'), p(c, 3, 4, C.white)))
  for (let f = 0; f < 2; f++)
    add(`mbolt-${f}`, 8, 8, (c) => (ellipse(c, 4, 4, 3 - f * 0.5, 3 - f * 0.5, C.magentaD), ellipse(c, 4, 4, 1.8, 1.8, C.magenta), p(c, 4, 4, C.white)))
  add('node', 10, 10, (c) => (ellipse(c, 5, 5, 4.5, 4.5, A.ivory1), ellipse(c, 5, 5, 3.5, 3.5, A.ivory3), ellipse(c, 5, 5, 1.8, 1.8, C.magenta)))
  add('pod', 16, 24, (c) => {
    ellipse(c, 8, 22, 7, 1.8, 'rgba(0,0,0,0.45)')
    r(c, 2, 2, 12, 20, A.ivory1)
    r(c, 3, 3, 10, 18, 'rgba(62,240,255,0.35)')
    r(c, 3, 3, 10, 1, A.ivory4)
    // A silhouette inside: someone is in there.
    ellipse(c, 8, 8, 2, 2, '#1a2a3a')
    r(c, 6, 10, 4, 8, '#1a2a3a')
    r(c, 2, 20, 12, 2, A.ivory2)
    p(c, 8, 1, C.magenta)
  })
  add('beacon', 16, 16, (c) => {
    ellipse(c, 8, 12, 7, 3.5, A.ivory1)
    ellipse(c, 8, 11.5, 6, 2.8, A.floor2)
    for (let a = 0; a < 6.3; a += 0.4) p(c, Math.round(8 + Math.cos(a) * 5), Math.round(11.5 + Math.sin(a) * 2.3), C.cyan)
    r(c, 7, 2, 2, 9, A.ivory2)
    ellipse(c, 8, 2, 2, 2, C.cyan)
    p(c, 8, 1, C.white)
  })
  return { canvas: cv, frames }
}

// ---------- Item icons ----------

export const CH2_ICONS: Record<'spire_alloy' | 'echo_log' | 'spire_keycard' | 'ion_scattergun' | 'resonance_blade' | 'phase_core', (c: Ctx) => void> = {
  spire_alloy: (c) => {
    for (let i = 0; i < 4; i++) r(c, 3 + i, 9 - i, 10 - i, 4, i === 3 ? A.ivory4 : i ? A.ivory3 : A.ivory1)
    r(c, 3, 12, 10, 1, A.ivory1)
    p(c, 10, 7, C.magenta)
    p(c, 6, 10, C.magentaD)
  },
  echo_log: (c) => {
    r(c, 3, 4, 10, 9, A.violet1)
    r(c, 4, 5, 8, 7, A.violet3)
    for (let x = 0; x < 6; x++) p(c, 5 + x, 8 + Math.round(Math.sin(x * 1.3) * 2), C.cyan)
    r(c, 6, 2, 4, 2, A.ivory2)
  },
  spire_keycard: (c) => {
    r(c, 2, 4, 12, 9, A.ivory1)
    r(c, 3, 5, 10, 7, A.ivory3)
    r(c, 4, 6, 3, 3, C.amber)
    r(c, 8, 7, 4, 1, C.magenta)
    r(c, 8, 9, 3, 1, A.ivory1)
  },
  ion_scattergun: (c) => {
    r(c, 2, 6, 10, 5, C.s4)
    r(c, 2, 6, 10, 1, C.s6)
    for (const y of [5, 8, 11]) (r(c, 12, y, 3, 1, C.cyanD), p(c, 15, y, C.cyan))
    r(c, 3, 11, 3, 4, C.s3)
    r(c, 7, 8, 3, 1, C.magenta)
  },
  resonance_blade: (c) => {
    for (let i = 0; i < 10; i++) (p(c, 4 + i, 12 - i, C.p4), p(c, 5 + i, 12 - i, C.white))
    p(c, 13, 1, C.magenta)
    p(c, 15, 3, C.magenta)
    p(c, 14, 2, C.cyan)
    r(c, 1, 12, 4, 2, A.ivory2)
    r(c, 2, 11, 2, 4, C.magentaD)
  },
  phase_core: (c) => {
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2
      r(c, Math.round(7 + Math.cos(ang) * 5), Math.round(7 + Math.sin(ang) * 5), 2, 2, A.ivory2)
    }
    ellipse(c, 8, 8, 4, 4, A.violet3)
    ellipse(c, 8, 8, 2.5, 2.5, C.cyan)
    p(c, 7, 7, C.white)
    p(c, 10, 9, C.magenta)
  },
}
