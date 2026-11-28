// Pixel-art primitives shared by every drawing module: palette, canvases, pixels, ellipses, sprite sheets.

export type Ctx = CanvasRenderingContext2D

export const C = {
  void: '#070a16', night: '#0d1226', s1: '#1b2238', s2: '#262f4a', s3: '#36415f', s4: '#4c5a7e', s5: '#6b7aa1', s6: '#a9b8d8',
  cyan: '#3ef0ff', cyanD: '#1aa6c4', cyanDD: '#0f5f7a', magenta: '#ff3ea5', magentaD: '#a21a6b', amber: '#ffb347', amberD: '#c26a12',
  red: '#ff4d5e', redD: '#a3182b', green: '#59f39a', greenD: '#1f9e5c', white: '#f4f8ff',
  g1: '#0f2c25', g2: '#163f33', g3: '#215a46', g4: '#33805f', l1: '#0b2224', l2: '#123a38', l3: '#1d5a52', l4: '#2f8a74',
  d1: '#33241d', d2: '#4d3929', d3: '#6c5139', w1: '#0b1f48', w2: '#143670', w3: '#2456a8', foam: '#7fd4ff',
  r1: '#25283a', r2: '#3f455c', r3: '#666d88', u1: '#25232c', u2: '#38364a', u3: '#544f65', rust: '#86472a', moss: '#2b6a45',
  p1: '#25163d', p2: '#46296a', p3: '#7a4ab0', p4: '#b07ae0',
} as const

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  return [cv, ctx]
}

export const r = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  c.fillStyle = col
  c.fillRect(x, y, w, h)
}
export const p = (c: Ctx, x: number, y: number, col: string) => r(c, x, y, 1, 1, col)
/** Deterministic noise in [0, 1). */
export const hash = (x: number, y: number, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
/** Filled ellipse, pixel by pixel. */
export const ellipse = (c: Ctx, cx: number, cy: number, rx: number, ry: number, col: string) => {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x + 0.5 - cx) / rx
      const dy = (y + 0.5 - cy) / ry
      if (dx * dx + dy * dy <= 1) p(c, x, y, col)
    }
}
export const speckle = (c: Ctx, seed: number, cols: string[], density: number, x0 = 0, y0 = 0, w = 16, h = 16) => {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) if (hash(x, y, seed) < density) p(c, x, y, cols[Math.floor(hash(y, x, seed + 1) * cols.length)]!)
}

export interface Sheet {
  canvas: HTMLCanvasElement
  frames: { name: string; x: number; y: number; w: number; h: number }[]
}

export function sheet(size: number, draws: [string, (c: Ctx) => void][], height = size): Sheet {
  const [cv, ctx] = makeCanvas(size * draws.length, height)
  const frames = draws.map(([name, draw], i) => {
    ctx.save()
    ctx.translate(i * size, 0)
    draw(ctx)
    ctx.restore()
    return { name, x: i * size, y: 0, w: size, h: height }
  })
  return { canvas: cv, frames }
}
