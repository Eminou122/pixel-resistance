// Tile maps and placements for each area. Pure data + helpers, shared by the engine, the save validator and the tests.
import type { AreaId, ItemId, NpcId } from './data.ts'

export const TILE = 16

export type TileKind =
  // Nova-7
  | 'floor' | 'grate' | 'neon' | 'wall' | 'window' | 'door' | 'roof' | 'crate' | 'machine' | 'lamp' | 'fence' | 'planter'
  // Forgotten Wilds
  | 'grass' | 'glowgrass' | 'path' | 'water' | 'bridge' | 'thicket' | 'fakethicket' | 'tree' | 'rock' | 'crystal'
  | 'ruinfloor' | 'ruinwall' | 'gate' | 'spire'
  // Ashen Frontier
  | 'ash' | 'cinder' | 'road' | 'rust' | 'scrap' | 'tank' | 'stack' | 'pipeline' | 'vent' | 'cracked' | 'pylon' | 'cable' | 'blastdoor'
  // Relay Spire and Signal Chamber
  | 'spirefloor' | 'conduit' | 'spirewall' | 'console' | 'pillar' | 'void' | 'barrierA' | 'barrierB' | 'keydoor' | 'terminal'
  | 'chamberfloor' | 'ring' | 'seal'
  // shared
  | 'exit' | 'lift'

/** Tiles that block walking (and projectiles). */
export const SOLID: ReadonlySet<TileKind> = new Set<TileKind>([
  'wall', 'window', 'door', 'roof', 'crate', 'machine', 'lamp', 'fence', 'planter',
  'thicket', 'tree', 'rock', 'crystal', 'ruinwall', 'gate', 'spire',
  'scrap', 'tank', 'stack', 'pipeline', 'cracked', 'pylon', 'blastdoor',
  'spirewall', 'console', 'pillar', 'barrierA', 'barrierB', 'keydoor', 'terminal', 'seal',
])
/** Tiles that block walking but not projectiles or line of sight. */
export const LIQUID: ReadonlySet<TileKind> = new Set<TileKind>(['water', 'void'])
/** Drawn on the object layer, above the ground. */
export const OVERLAY: ReadonlySet<TileKind> = new Set<TileKind>([...SOLID, 'fakethicket'])
/** Solid tiles the game can open: doors, barriers, breakable walls. */
export const DOORS: ReadonlySet<TileKind> = new Set<TileKind>(['gate', 'blastdoor', 'barrierA', 'barrierB', 'keydoor', 'cracked', 'seal'])

export interface Pickup { id: string; item: ItemId | 'credits'; amount: number; x: number; y: number }
export type MachineKind = 'drone' | 'sentinel' | 'phantom' | 'heavy' | 'technician'
export interface EnemySpawn { id: string; kind: MachineKind; x: number; y: number; patrol?: [number, number]; guard?: boolean; drop?: { item: ItemId; amount: number } }
export type InteractKind = 'bench' | 'device' | 'arenaGate' | 'spireGate' | 'pylon' | 'terminal' | 'beacon' | 'pod'
export interface Zone { x: number; y: number; w: number; h: number }
export interface Exit { to: AreaId; entry: string; dir: 'up' | 'down' }

export interface AreaDef {
  id: AreaId
  rows: readonly string[]
  legend: Readonly<Record<string, TileKind>>
  /** Ground drawn under object-layer tiles. */
  baseGround: TileKind
  /** Entry points, in tiles: where the player appears when arriving (keyed by where they come from). */
  entries: Readonly<Record<string, { x: number; y: number }>>
  /** Walking onto one of these tiles (by map character) leads to another area. */
  exits: Readonly<Record<string, Exit>>
  npcs: readonly { id: NpcId; x: number; y: number }[]
  pickups: readonly Pickup[]
  enemies: readonly EnemySpawn[]
  interactables: readonly { kind: InteractKind; x: number; y: number; id?: string }[]
  zones: Readonly<Record<string, Zone>>
  boss?: { x: number; y: number; kind: 'warden' | 'arbiter' }
  music: 'colony' | 'wilds' | 'frontier' | 'spire' | 'chamber'
}

/** A grid editor for building maps from shapes. */
function grid(W: number, H: number, fill: string) {
  const g: string[][] = Array.from({ length: H }, () => Array<string>(W).fill(fill))
  const set = (x: number, y: number, c: string) => {
    const row = g[y]
    if (row && x >= 0 && x < W) row[x] = c
  }
  return {
    set,
    rect: (x: number, y: number, w: number, h: number, c: string) => {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, c)
    },
    frame: (x: number, y: number, w: number, h: number, c: string) => {
      for (let xx = x; xx < x + w; xx++) (set(xx, y, c), set(xx, y + h - 1, c))
      for (let yy = y; yy < y + h; yy++) (set(x, yy, c), set(x + w - 1, yy, c))
    },
    points: (pts: readonly [number, number][], c: string) => pts.forEach(([x, y]) => set(x, y, c)),
    scatter: (c: string, on: string, mod: number) => {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y]![x] === on && (x * 7 + y * 13 + x * y) % mod === 0) set(x, y, c)
    },
    rows: () => g.map((r) => r.join('')),
  }
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
  entries: { start: { x: 15, y: 13 }, wilds: { x: 15, y: 19 }, beacon: { x: 20, y: 18 } },
  exits: { '>': { to: 'wilds', entry: 'nova7', dir: 'down' } },
  npcs: [
    { id: 'commander', x: 13, y: 6 },
    { id: 'juno', x: 5, y: 9 },
    { id: 'tamsin', x: 26, y: 9 },
    // Arrives after Chapter 2's rescue.
    { id: 'rook', x: 24, y: 13 },
  ],
  pickups: [
    { id: 'n_credits', item: 'credits', amount: 10, x: 5, y: 18 },
    { id: 'n_heal', item: 'healing_cell', amount: 1, x: 29, y: 17 },
  ],
  enemies: [],
  interactables: [
    { kind: 'bench', x: 7, y: 9 },
    { kind: 'beacon', x: 20, y: 19 },
  ],
  zones: {},
  music: 'colony',
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
  entries: { nova7: { x: 23, y: 2 }, frontier: { x: 23, y: 32 } },
  exits: { '<': { to: 'nova7', entry: 'wilds', dir: 'up' } },
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
  boss: { x: 23.5, y: 29, kind: 'warden' },
  music: 'wilds',
}

// ---------- The Ashen Frontier (44 x 30): the dead industrial town at the Spire's feet ----------

function buildFrontier(): string[] {
  const m = grid(44, 30, '.')
  m.scatter(',', '.', 9)
  m.frame(0, 0, 44, 30, 'X')
  // The Spire's base and its blast door, powered by three pylons.
  m.rect(12, 0, 20, 4, 'W')
  m.rect(20, 3, 4, 1, 'B')
  m.rect(20, 2, 4, 1, 'E')
  // Cables from the pylons (drawn first, roads and buildings go over them).
  m.rect(3, 12, 17, 1, 'c')
  m.rect(24, 12, 17, 1, 'c')
  m.rect(24, 27, 12, 1, 'c')
  // Roads
  m.rect(20, 4, 4, 25, ':')
  m.rect(3, 13, 38, 3, ':')
  m.rect(20, 29, 4, 1, '<')
  // North-west: a sealed house, opened by breaking its cracked wall.
  m.frame(3, 3, 9, 7, 'X')
  m.rect(4, 4, 7, 5, 'm')
  m.set(7, 9, '#')
  // West: Moss's shelter.
  m.frame(2, 17, 12, 9, 'X')
  m.rect(3, 18, 10, 7, 'm')
  m.points([[13, 21], [13, 22]], 'm')
  m.points([[3, 18], [4, 18]], 'T')
  m.points([[11, 18], [12, 18]], 'P')
  // East: a factory with a hidden store room behind a cracked wall.
  m.frame(30, 17, 12, 8, 'X')
  m.rect(31, 18, 10, 6, 'm')
  m.points([[30, 20], [30, 21]], 'm')
  m.rect(36, 18, 1, 6, 'X')
  m.set(36, 19, '#')
  m.points([[31, 23], [32, 23]], 'T')
  // Smokestacks, tanks, pipes, rubble.
  m.points([[35, 5], [38, 5], [41, 5]], 'S')
  m.points([[34, 9], [35, 9], [40, 9]], 'T')
  m.rect(26, 8, 5, 1, 'P')
  m.points([[16, 9], [9, 11], [27, 11], [16, 20], [26, 24], [4, 27], [39, 27]], 'r')
  // Steam vents across the roads: cross them between bursts.
  m.points([[20, 19], [22, 19], [21, 21], [23, 21], [9, 14], [31, 14], [33, 13]], 'v')
  m.points([[2, 14], [41, 14], [36, 27]], 'Y')
  return m.rows()
}

const FRONTIER: AreaDef = {
  id: 'frontier',
  rows: buildFrontier(),
  legend: {
    '.': 'ash', ',': 'cinder', ':': 'road', 'm': 'rust', 'X': 'scrap', 'T': 'tank', 'S': 'stack', 'P': 'pipeline', 'v': 'vent',
    '#': 'cracked', 'Y': 'pylon', 'c': 'cable', 'W': 'spirewall', 'B': 'blastdoor', 'E': 'exit', '<': 'exit', 'r': 'rock',
  },
  baseGround: 'ash',
  entries: { wilds: { x: 21, y: 25 }, spire1: { x: 21, y: 6 }, beacon: { x: 25, y: 25 } },
  exits: {
    '<': { to: 'wilds', entry: 'frontier', dir: 'down' },
    'E': { to: 'spire1', entry: 'frontier', dir: 'up' },
  },
  npcs: [{ id: 'moss', x: 6, y: 21 }],
  pickups: [
    { id: 'f_log_1', item: 'echo_log', amount: 1, x: 5, y: 5 },
    { id: 'f_credits_house', item: 'credits', amount: 30, x: 9, y: 7 },
    { id: 'f_alloy_store', item: 'spire_alloy', amount: 2, x: 39, y: 20 },
    { id: 'f_log_2', item: 'echo_log', amount: 1, x: 38, y: 22 },
    { id: 'f_heal_1', item: 'healing_cell', amount: 1, x: 16, y: 26 },
    { id: 'f_heal_2', item: 'healing_cell', amount: 1, x: 40, y: 3 },
    { id: 'f_comp_1', item: 'components', amount: 3, x: 28, y: 5 },
    { id: 'f_energy_1', item: 'energy_cell', amount: 1, x: 2, y: 26 },
  ],
  enemies: [
    { id: 'f_phantom_1', kind: 'phantom', x: 12, y: 14, drop: { item: 'components', amount: 1 } },
    { id: 'f_phantom_2', kind: 'phantom', x: 28, y: 10 },
    { id: 'f_phantom_3', kind: 'phantom', x: 15, y: 19 },
    { id: 'f_heavy_1', kind: 'heavy', x: 38, y: 14, drop: { item: 'spire_alloy', amount: 1 } },
    { id: 'f_heavy_2', kind: 'heavy', x: 33, y: 21, drop: { item: 'spire_alloy', amount: 1 } },
    { id: 'f_tech_1', kind: 'technician', x: 34, y: 19, drop: { item: 'spire_alloy', amount: 1 } },
    { id: 'f_drone_1', kind: 'drone', x: 30, y: 10, patrol: [36, 10] },
    { id: 'f_sentinel_1', kind: 'sentinel', x: 17, y: 6, drop: { item: 'healing_cell', amount: 1 } },
  ],
  interactables: [
    { kind: 'pylon', x: 2, y: 14, id: 'pylon_1' },
    { kind: 'pylon', x: 41, y: 14, id: 'pylon_2' },
    { kind: 'pylon', x: 36, y: 27, id: 'pylon_3' },
    { kind: 'beacon', x: 25, y: 26 },
  ],
  zones: {},
  music: 'frontier',
}

// ---------- The Relay Spire, lower floor (32 x 22): the barrier puzzle and the keycard ----------

function buildSpire1(): string[] {
  const m = grid(32, 22, 'W')
  m.rect(12, 15, 8, 6, '.')
  m.rect(14, 21, 4, 1, '<')
  m.rect(9, 8, 14, 7, '.')
  m.rect(12, 11, 2, 2, 'o')
  m.rect(18, 11, 2, 2, 'o')
  // West wing behind barrier A (open by default): the keycard.
  m.rect(3, 10, 6, 2, '.')
  m.rect(2, 3, 6, 7, '.')
  m.points([[8, 10], [8, 11]], 'a')
  m.set(5, 2, '#')
  m.rect(4, 1, 3, 1, '.')
  // East wing behind barrier B: the lift up.
  m.rect(23, 10, 5, 2, '.')
  m.rect(24, 3, 7, 7, '.')
  m.points([[23, 10], [23, 11]], 'b')
  m.rect(26, 2, 2, 1, 'U')
  m.scatter(',', '.', 7)
  // Terminals switch the power between the two barriers. One in each section: nobody gets stuck.
  m.points([[16, 8], [7, 3], [30, 9]], 't')
  m.points([[10, 8], [21, 8], [12, 15], [19, 15]], 'k')
  return m.rows()
}

const SPIRE1: AreaDef = {
  id: 'spire1',
  rows: buildSpire1(),
  legend: {
    '.': 'spirefloor', ',': 'conduit', 'W': 'spirewall', 'k': 'console', 'o': 'void', 'a': 'barrierA', 'b': 'barrierB',
    't': 'terminal', '#': 'cracked', 'U': 'lift', '<': 'exit',
  },
  baseGround: 'spirefloor',
  entries: { frontier: { x: 15, y: 18 }, spire2: { x: 26, y: 5 } },
  exits: {
    '<': { to: 'frontier', entry: 'spire1', dir: 'down' },
    'U': { to: 'spire2', entry: 'spire1', dir: 'up' },
  },
  npcs: [],
  pickups: [
    { id: 's1_keycard', item: 'spire_keycard', amount: 1, x: 3, y: 4 },
    { id: 's1_log', item: 'echo_log', amount: 1, x: 29, y: 4 },
    { id: 's1_heal', item: 'healing_cell', amount: 1, x: 13, y: 18 },
    { id: 's1_comp', item: 'components', amount: 2, x: 18, y: 19 },
    { id: 's1_alloy_cache', item: 'spire_alloy', amount: 1, x: 4, y: 1 },
    { id: 's1_credits_cache', item: 'credits', amount: 45, x: 6, y: 1 },
  ],
  enemies: [
    { id: 's1_tech', kind: 'technician', x: 13, y: 9, drop: { item: 'spire_alloy', amount: 1 } },
    { id: 's1_heavy', kind: 'heavy', x: 19, y: 9, drop: { item: 'spire_alloy', amount: 1 } },
    { id: 's1_phantom_1', kind: 'phantom', x: 5, y: 6 },
    { id: 's1_phantom_2', kind: 'phantom', x: 26, y: 7, drop: { item: 'energy_cell', amount: 1 } },
    { id: 's1_sentinel', kind: 'sentinel', x: 28, y: 5 },
  ],
  interactables: [
    { kind: 'terminal', x: 16, y: 8 },
    { kind: 'terminal', x: 7, y: 3 },
    { kind: 'terminal', x: 30, y: 9 },
  ],
  zones: {},
  music: 'spire',
}

// ---------- The Relay Spire, upper floor (32 x 22): the gallery over the void ----------

function buildSpire2(): string[] {
  const m = grid(32, 22, 'W')
  m.rect(22, 15, 8, 5, '.')
  m.rect(25, 20, 2, 1, 'D')
  m.rect(3, 8, 27, 7, '.')
  m.rect(8, 10, 3, 3, 'o')
  m.rect(16, 9, 3, 2, 'o')
  m.rect(16, 12, 3, 2, 'o')
  m.rect(23, 10, 2, 3, 'o')
  m.points([[6, 9], [6, 13], [13, 9], [13, 13], [20, 9], [20, 13]], 'I')
  // North: the keycard door, then the lift to the Signal Chamber.
  m.rect(14, 3, 4, 5, '.')
  m.rect(14, 5, 4, 1, 'K')
  m.rect(14, 2, 4, 1, 'C')
  // West: the archive room. East: a store room behind a cracked wall.
  m.rect(2, 2, 7, 5, '.')
  m.set(5, 7, '.')
  m.rect(26, 4, 4, 3, '.')
  m.set(28, 7, '#')
  m.scatter(',', '.', 8)
  return m.rows()
}

const SPIRE2: AreaDef = {
  id: 'spire2',
  rows: buildSpire2(),
  legend: {
    '.': 'spirefloor', ',': 'conduit', 'W': 'spirewall', 'o': 'void', 'I': 'pillar', 'K': 'keydoor', 'C': 'lift', 'D': 'lift', '#': 'cracked',
  },
  baseGround: 'spirefloor',
  entries: { spire1: { x: 25, y: 17 }, chamber: { x: 15, y: 4 } },
  exits: {
    'D': { to: 'spire1', entry: 'spire2', dir: 'down' },
    'C': { to: 'chamber', entry: 'spire2', dir: 'up' },
  },
  npcs: [],
  pickups: [
    { id: 's2_log', item: 'echo_log', amount: 1, x: 3, y: 3 },
    { id: 's2_energy', item: 'energy_cell', amount: 1, x: 7, y: 5 },
    { id: 's2_alloy_cache', item: 'spire_alloy', amount: 2, x: 27, y: 5 },
    { id: 's2_heal_cache', item: 'healing_cell', amount: 2, x: 26, y: 5 },
    { id: 's2_comp', item: 'components', amount: 3, x: 11, y: 14 },
  ],
  enemies: [
    { id: 's2_heavy_1', kind: 'heavy', x: 12, y: 11, drop: { item: 'spire_alloy', amount: 1 } },
    { id: 's2_heavy_2', kind: 'heavy', x: 26, y: 9, drop: { item: 'healing_cell', amount: 1 } },
    { id: 's2_phantom_1', kind: 'phantom', x: 21, y: 11 },
    { id: 's2_phantom_2', kind: 'phantom', x: 27, y: 12 },
    { id: 's2_tech', kind: 'technician', x: 4, y: 11, drop: { item: 'spire_alloy', amount: 1 } },
    { id: 's2_sentinel', kind: 'sentinel', x: 10, y: 13 },
  ],
  interactables: [],
  zones: {},
  music: 'spire',
}

// ---------- The Signal Chamber (24 x 18): a platform floating over the void ----------

function buildChamber(): string[] {
  const m = grid(24, 19, 'o')
  m.rect(4, 0, 16, 2, 'W')
  m.points([[7, 1], [16, 1]], 'k')
  m.rect(4, 2, 16, 13, '.')
  m.points([[4, 2], [5, 2], [4, 3], [19, 2], [18, 2], [19, 3], [4, 14], [5, 14], [4, 13], [19, 14], [18, 14], [19, 13]], 'o')
  for (let a = 0; a < Math.PI * 2; a += 0.08) m.set(Math.round(11.5 + Math.cos(a) * 5.5), Math.round(8.5 + Math.sin(a) * 4.2), ',')
  m.rect(11, 15, 2, 1, 'Q')
  m.rect(11, 16, 2, 2, '.')
  m.rect(11, 18, 2, 1, '<')
  return m.rows()
}

const CHAMBER: AreaDef = {
  id: 'chamber',
  rows: buildChamber(),
  legend: { '.': 'chamberfloor', ',': 'ring', 'o': 'void', 'W': 'spirewall', 'k': 'console', 'Q': 'seal', '<': 'exit' },
  baseGround: 'chamberfloor',
  entries: { spire2: { x: 11, y: 16 } },
  exits: { '<': { to: 'spire2', entry: 'chamber', dir: 'down' } },
  npcs: [{ id: 'rook', x: 11, y: 3 }],
  pickups: [],
  enemies: [],
  interactables: [{ kind: 'pod', x: 11, y: 3 }],
  zones: { arena: { x: 4, y: 2, w: 16, h: 13 } },
  boss: { x: 12, y: 8.5, kind: 'arbiter' },
  music: 'chamber',
}

export const AREAS: Record<AreaId, AreaDef> = { nova7: NOVA7, wilds: WILDS, frontier: FRONTIER, spire1: SPIRE1, spire2: SPIRE2, chamber: CHAMBER }

export const kindAt = (area: AreaDef, tx: number, ty: number): TileKind | undefined => {
  const c = area.rows[ty]?.[tx]
  return c === undefined ? undefined : area.legend[c]
}

export const exitAt = (area: AreaDef, tx: number, ty: number): Exit | undefined => {
  const c = area.rows[ty]?.[tx]
  return c === undefined ? undefined : area.exits[c]
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

/** Save id of a breakable wall: broken walls are remembered like collected pickups. */
export const wallId = (area: AreaId, x: number, y: number) => `wall_${area}_${x}_${y}`
export const BREAKABLE_IDS: readonly string[] = Object.values(AREAS).flatMap((a) =>
  a.rows.flatMap((row, y) => [...row].flatMap((c, x) => (a.legend[c] === 'cracked' ? [wallId(a.id, x, y)] : []))),
)

/** Tiles reachable on foot from a start tile (breadth-first). Door tiles listed in `open` count as passable. */
export function reachable(area: AreaDef, start: { x: number; y: number }, open: ReadonlySet<TileKind> = new Set()): Set<string> {
  const seen = new Set<string>([`${start.x},${start.y}`])
  const queue = [start]
  while (queue.length) {
    const { x, y } = queue.shift()!
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx
      const ny = y + dy
      const key = `${nx},${ny}`
      if (seen.has(key)) continue
      const k = kindAt(area, nx, ny)
      const ok = walkable(area, nx, ny) || (k !== undefined && open.has(k))
      if (ok) (seen.add(key), queue.push({ x: nx, y: ny }))
    }
  }
  return seen
}
