// Tile maps and placements for each area. Pure data + helpers, shared by the engine, the save validator and the tests.
import type { AreaId, ItemId, NpcId } from './data.ts'

export const TILE = 16

export type TileKind =
  // Nova-7
  | 'floor' | 'grate' | 'neon' | 'wall' | 'window' | 'door' | 'roof' | 'crate' | 'machine' | 'lamp' | 'fence' | 'planter'
  // Forgotten Wilds
  | 'grass' | 'glowgrass' | 'path' | 'water' | 'bridge' | 'thicket' | 'fakethicket' | 'tree' | 'rock' | 'crystal'
  | 'ruinfloor' | 'ruinwall' | 'gate' | 'spire'
  // shared
  | 'exit'

/** Tiles that block walking (and projectiles). */
export const SOLID: ReadonlySet<TileKind> = new Set<TileKind>([
  'wall', 'window', 'door', 'roof', 'crate', 'machine', 'lamp', 'fence', 'planter',
  'thicket', 'tree', 'rock', 'crystal', 'ruinwall', 'gate', 'spire',
])
/** Tiles that block walking but not projectiles or line of sight. */
export const LIQUID: ReadonlySet<TileKind> = new Set<TileKind>(['water'])
/** Drawn on the object layer, above the ground. */
export const OVERLAY: ReadonlySet<TileKind> = new Set<TileKind>([...SOLID, 'fakethicket'])

export interface Pickup { id: string; item: ItemId | 'credits'; amount: number; x: number; y: number }
export interface EnemySpawn { id: string; kind: 'drone' | 'sentinel'; x: number; y: number; patrol?: [number, number]; guard?: boolean; drop?: { item: ItemId; amount: number } }
export type InteractKind = 'bench' | 'device' | 'arenaGate' | 'spireGate'
export interface Zone { x: number; y: number; w: number; h: number }

export interface AreaDef {
  id: AreaId
  rows: readonly string[]
  legend: Readonly<Record<string, TileKind>>
  /** Ground drawn under object-layer tiles. */
  baseGround: TileKind
  /** Entry points, in tiles: where the player appears when arriving from another area. */
  entries: Readonly<Record<string, { x: number; y: number }>>
  /** Where a walking player leaves to, by exit tile. */
  exitTo: AreaId
  npcs: readonly { id: NpcId; x: number; y: number }[]
  pickups: readonly Pickup[]
  enemies: readonly EnemySpawn[]
  interactables: readonly { kind: InteractKind; x: number; y: number }[]
  zones: Readonly<Record<string, Zone>>
  boss?: { x: number; y: number }
}

// ---------- Nova-7 (hand-drawn, 32 x 22) ----------

const NOVA7_ROWS = [
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'Xg.........RRRRRRRRRR.........gX',
  'X..L.......RRRRRRRRRR.......L..X',
  'X..........RRRRRRRRRR..........X',
  'XRRRRRRR...#WW#DD#WW#...RRRRRRRX',
  'XRRRRRRR.......==.......RRRRRRRX',
  'XRRRRRRR.......==.......RRRRRRRX',
  'X#W#D#W#..C....==....C..#W#D#W#X',
  'X..............==..............X',
  'X.g...........L==L...........g.X',
  'X..............==..............X',
  'X==============================X',
  'X,,............==............,,X',
  'X..CC....g.....==.....g....CC..X',
  'X..CC..........==..........PP..X',
  'X..............==..........PP..X',
  'X.L............==............L.X',
  'X......C.......==.......C......X',
  'X..g.....,,....==....,,.....g..X',
  'X.............L==L.............X',
  'X..............==..............X',
  'XXXXXXXXXXXXXX>>>>XXXXXXXXXXXXXX',
]

const NOVA7: AreaDef = {
  id: 'nova7',
  rows: NOVA7_ROWS,
  legend: {
    'X': 'fence', '.': 'floor', ',': 'grate', '=': 'neon', '#': 'wall', 'W': 'window', 'D': 'door', 'R': 'roof',
    'C': 'crate', 'P': 'machine', 'L': 'lamp', 'g': 'planter', '>': 'exit',
  },
  baseGround: 'floor',
  entries: { start: { x: 15, y: 13 }, wilds: { x: 15, y: 19 } },
  exitTo: 'wilds',
  npcs: [
    { id: 'commander', x: 13, y: 6 },
    { id: 'juno', x: 5, y: 9 },
    { id: 'tamsin', x: 26, y: 9 },
  ],
  pickups: [
    { id: 'n_credits', item: 'credits', amount: 10, x: 5, y: 18 },
    { id: 'n_heal', item: 'healing_cell', amount: 1, x: 29, y: 17 },
  ],
  enemies: [],
  interactables: [{ kind: 'bench', x: 7, y: 9 }],
  zones: {},
}

// ---------- The Forgotten Wilds (built from shapes, 48 x 36) ----------

function buildWilds(): string[] {
  const W = 48
  const H = 36
  const g: string[][] = Array.from({ length: H }, () => Array<string>(W).fill('.'))
  const set = (x: number, y: number, c: string) => {
    const row = g[y]
    if (row && x >= 0 && x < W) row[x] = c
  }
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, c)
  }
  const frame = (x: number, y: number, w: number, h: number, c: string) => {
    for (let xx = x; xx < x + w; xx++) (set(xx, y, c), set(xx, y + h - 1, c))
    for (let yy = y; yy < y + h; yy++) (set(x, yy, c), set(x + w - 1, yy, c))
  }
  const points = (pts: readonly [number, number][], c: string) => pts.forEach(([x, y]) => set(x, y, c))

  // Bioluminescent grass, scattered with a fixed pattern (same map every time).
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x * 7 + y * 13 + x * y) % 11 === 0) set(x, y, ',')

  frame(0, 0, W, H, 'h')
  // Thick edges so the wilds feel overgrown rather than fenced.
  points([[1, 1], [2, 1], [1, 2], [46, 1], [45, 1], [46, 2], [1, 11], [1, 12], [46, 10], [46, 11], [46, 12], [46, 20], [46, 21], [45, 21]], 'h')

  // Trees and rocks.
  points([[3, 2], [6, 1], [18, 2], [19, 4], [28, 2], [2, 9], [5, 11], [17, 13], [19, 18], [26, 15], [27, 19], [12, 20], [16, 16], [29, 13], [3, 12], [20, 21], [28, 22], [14, 22], [33, 22], [12, 17], [10, 15], [11, 19]], 'T')
  points([[21, 7], [27, 5], [14, 15], [24, 17], [8, 12], [31, 9], [44, 12]], 'r')

  // Crystal field (north-east).
  points([[31, 3], [33, 5], [36, 2], [38, 6], [41, 3], [43, 7], [45, 4], [40, 8], [34, 8]], 'c')

  // Pond with a bridge.
  rect(8, 3, 9, 6, '~')
  points([[8, 3], [16, 3], [8, 8], [16, 8]], '.')
  rect(8, 6, 9, 1, 'b')

  // Paths.
  rect(22, 1, 4, 3, ':')
  rect(23, 4, 2, 7, ':')
  rect(10, 10, 31, 2, ':')
  rect(30, 12, 2, 6, ':')
  rect(36, 12, 2, 1, ':')
  rect(23, 12, 2, 12, ':')

  // Hidden grove (west): sealed by thicket, entered through one fake bush.
  frame(0, 13, 10, 9, 'h')
  rect(1, 14, 8, 7, '.')
  points([[2, 15], [7, 15], [4, 19], [2, 20]], ',')
  set(9, 17, 'f')
  points([[10, 17], [11, 17], [12, 17], [13, 17]], ',')

  // Ruined outpost (east), where the transmission device lies.
  frame(32, 13, 13, 9, 'M')
  rect(33, 14, 11, 7, 'm')
  points([[36, 13], [37, 13], [32, 16], [32, 17]], 'm')
  points([[35, 18], [36, 18], [40, 15], [41, 15]], 'M')
  points([[34, 20], [43, 14]], 'r')

  // South: dense forest around the Iron Warden's arena.
  rect(1, 22, 13, 13, 'h')
  rect(34, 22, 13, 13, 'h')
  points([[4, 24], [8, 27], [11, 31], [38, 25], [42, 29], [36, 32]], 'T')
  frame(14, 24, 20, 11, 'M')
  rect(15, 25, 18, 9, 'm')
  rect(22, 24, 4, 1, 'G')
  rect(22, 34, 4, 1, 'S')
  points([[18, 27], [29, 27], [18, 31], [29, 31]], 'M')

  rect(22, 0, 4, 1, '<')
  return g.map((row) => row.join(''))
}

const WILDS: AreaDef = {
  id: 'wilds',
  rows: buildWilds(),
  legend: {
    '.': 'grass', ',': 'glowgrass', ':': 'path', '~': 'water', 'b': 'bridge', 'h': 'thicket', 'f': 'fakethicket',
    'T': 'tree', 'r': 'rock', 'c': 'crystal', 'm': 'ruinfloor', 'M': 'ruinwall', 'G': 'gate', 'S': 'spire', '<': 'exit',
  },
  baseGround: 'grass',
  entries: { nova7: { x: 23, y: 2 } },
  exitTo: 'nova7',
  npcs: [],
  pickups: [
    { id: 'w_credits_pond', item: 'credits', amount: 15, x: 5, y: 6 },
    { id: 'w_heal_1', item: 'healing_cell', amount: 1, x: 13, y: 13 },
    { id: 'w_comp_1', item: 'components', amount: 2, x: 28, y: 7 },
    { id: 'w_comp_2', item: 'components', amount: 2, x: 42, y: 10 },
    { id: 'w_energy_1', item: 'energy_cell', amount: 1, x: 44, y: 2 },
    { id: 'w_comp_3', item: 'components', amount: 2, x: 38, y: 19 },
    { id: 'w_heal_2', item: 'healing_cell', amount: 1, x: 27, y: 23 },
    { id: 'w_amp', item: 'signal_amplifier', amount: 1, x: 3, y: 17 },
    { id: 'w_grove_credits', item: 'credits', amount: 40, x: 6, y: 15 },
    { id: 'w_grove_heal', item: 'healing_cell', amount: 1, x: 6, y: 19 },
  ],
  enemies: [
    { id: 'drone_1', kind: 'drone', x: 25, y: 8, patrol: [31, 8] },
    { id: 'drone_2', kind: 'drone', x: 33, y: 3, patrol: [40, 4], drop: { item: 'components', amount: 1 } },
    { id: 'drone_3', kind: 'drone', x: 14, y: 12, patrol: [20, 12], drop: { item: 'healing_cell', amount: 1 } },
    { id: 'drone_4', kind: 'drone', x: 21, y: 16, patrol: [21, 21] },
    { id: 'sentinel_3', kind: 'sentinel', x: 44, y: 5, drop: { item: 'components', amount: 2 } },
    { id: 'guard_sentinel_1', kind: 'sentinel', x: 35, y: 15, guard: true },
    { id: 'guard_sentinel_2', kind: 'sentinel', x: 42, y: 19, guard: true },
    { id: 'guard_drone', kind: 'drone', x: 39, y: 16, patrol: [39, 20], guard: true, drop: { item: 'components', amount: 2 } },
  ],
  interactables: [
    { kind: 'device', x: 38, y: 17 },
    { kind: 'arenaGate', x: 23, y: 23 },
    { kind: 'spireGate', x: 23, y: 33 },
  ],
  zones: {
    outpost: { x: 31, y: 12, w: 15, h: 11 },
    arena: { x: 15, y: 26, w: 18, h: 8 },
  },
  boss: { x: 23.5, y: 29 },
}

export const AREAS: Record<AreaId, AreaDef> = { nova7: NOVA7, wilds: WILDS }

export const kindAt = (area: AreaDef, tx: number, ty: number): TileKind | undefined => {
  const c = area.rows[ty]?.[tx]
  return c === undefined ? undefined : area.legend[c]
}

export const walkable = (area: AreaDef, tx: number, ty: number): boolean => {
  const k = kindAt(area, tx, ty)
  return k !== undefined && !SOLID.has(k) && !LIQUID.has(k)
}

/** Is a pixel position (the player's feet) standing on a walkable tile? */
export const walkableAt = (area: AreaDef, px: number, py: number): boolean =>
  walkable(area, Math.floor(px / TILE), Math.floor(py / TILE))

export const inZone = (z: Zone, px: number, py: number) =>
  px >= z.x * TILE && px < (z.x + z.w) * TILE && py >= z.y * TILE && py < (z.y + z.h) * TILE

/** Tiles reachable on foot from a start tile (breadth-first). Gates count as open when `openGates` is set. */
export function reachable(area: AreaDef, start: { x: number; y: number }, openGates = false): Set<string> {
  const seen = new Set<string>([`${start.x},${start.y}`])
  const queue = [start]
  while (queue.length) {
    const { x, y } = queue.shift()!
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx
      const ny = y + dy
      const key = `${nx},${ny}`
      if (seen.has(key)) continue
      const ok = walkable(area, nx, ny) || (openGates && kindAt(area, nx, ny) === 'gate')
      if (ok) (seen.add(key), queue.push({ x: nx, y: ny }))
    }
  }
  return seen
}
