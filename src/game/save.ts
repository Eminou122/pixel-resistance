// Save slots and settings in LocalStorage. Nothing read back is trusted: every field is checked, clamped or rebuilt.
import {
  AREA_IDS, CREDITS_MAX, FLAGS, ITEMS, ITEM_IDS, QUESTS, QUEST_IDS, SLOTS, XP_MAX,
  type AreaId, type Flag, type ItemId, type QuestId, type Slot,
} from './data.ts'
import { AREAS, TILE, walkableAt } from './maps.ts'
import { SAVE_VERSION, statsFor, type Inventory, type QuestState, type SaveData } from './state.ts'

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const SLOT_COUNT = 3
export const slotKey = (n: number) => `echoes-of-the-last-signal:slot-${n}`
export const SETTINGS_KEY = 'echoes-of-the-last-signal:settings'

export type SlotStatus =
  | { state: 'empty' }
  | { state: 'corrupt' }
  | { state: 'outdated'; version: number }
  | { state: 'ok'; data: SaveData }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const int = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.floor(v))) : fallback
const num = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
const known = <T extends string>(v: unknown, list: readonly T[]): v is T => typeof v === 'string' && (list as readonly string[]).includes(v)
const idList = (v: unknown, allowed: ReadonlySet<string>) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && allowed.has(x)))] : []

const ENEMY_IDS = new Set([...Object.values(AREAS).flatMap((a) => a.enemies.map((e) => e.id)), 'iron_warden'])
const PICKUP_IDS = new Set(Object.values(AREAS).flatMap((a) => a.pickups.map((p) => p.id)))

export function parseSave(raw: string | null): SlotStatus {
  if (raw === null || raw === '') return { state: 'empty' }
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { state: 'corrupt' }
  }
  if (!isRecord(data) || !isRecord(data.player) || !isRecord(data.world) || !isRecord(data.inventory)) return { state: 'corrupt' }
  if (data.version !== SAVE_VERSION) {
    // ponytail: only version 1 exists; a migration goes here when version 2 ships.
    return typeof data.version === 'number' ? { state: 'outdated', version: data.version } : { state: 'corrupt' }
  }
  return { state: 'ok', data: sanitize(data) }
}

/** Rebuilds a save from untrusted data: unknown ids are dropped, numbers clamped, impossible states repaired. */
export function sanitize(d: Record<string, unknown>): SaveData {
  const inv = isRecord(d.inventory) ? d.inventory : {}
  const rawItems = isRecord(inv.items) ? inv.items : {}
  const items: Inventory['items'] = {}
  for (const id of ITEM_IDS) {
    const n = int(rawItems[id], 0, ITEMS[id].max, 0)
    if (n > 0) items[id] = n
  }
  const rawEquipped = isRecord(inv.equipped) ? inv.equipped : {}
  const equipped = {} as Record<Slot, ItemId | null>
  for (const slot of SLOTS) {
    const id = rawEquipped[slot]
    equipped[slot] = known(id, ITEM_IDS) && ITEMS[id].slot === slot && (items[id] ?? 0) > 0 ? id : null
  }

  const p = isRecord(d.player) ? d.player : {}
  const xp = int(p.xp, 0, XP_MAX, 0)
  const st = statsFor(xp, equipped)

  const quests: SaveData['quests'] = {}
  const rawQuests = isRecord(d.quests) ? d.quests : {}
  for (const q of QUEST_IDS) {
    const r = rawQuests[q]
    if (!isRecord(r)) continue
    const last = QUESTS[q].steps.length - 1
    const done = r.done === true
    quests[q] = { step: done ? last : int(r.step, 0, last, 0), done } satisfies QuestState
  }
  // The second quest only exists once the first is finished.
  if (quests.iron_warden && !quests.lost_transmission?.done) delete quests.iron_warden

  const w = isRecord(d.world) ? d.world : {}
  const area: AreaId = known(w.area, AREA_IDS) ? w.area : 'nova7'
  const defeated = idList(w.defeated, ENEMY_IDS)
  const collected = idList(w.collected, PICKUP_IDS)
  let flags = idList(w.flags, new Set<string>(FLAGS)) as Flag[]
  // The boss flag and the boss reward mark must agree.
  const warden = flags.includes('warden_defeated') || defeated.includes('iron_warden')
  if (warden) {
    if (!flags.includes('warden_defeated')) flags = [...flags, 'warden_defeated']
    if (!defeated.includes('iron_warden')) defeated.push('iron_warden')
  }

  let x = num(w.x, 0, 10_000, NaN)
  let y = num(w.y, 0, 10_000, NaN)
  if (!Number.isFinite(x) || !Number.isFinite(y) || !walkableAt(AREAS[area], x, y)) {
    const entry = Object.values(AREAS[area].entries)[0]!
    x = (entry.x + 0.5) * TILE
    y = (entry.y + 0.5) * TILE
  }

  return {
    version: SAVE_VERSION,
    savedAt: typeof d.savedAt === 'string' && !Number.isNaN(Date.parse(d.savedAt)) ? d.savedAt : new Date(0).toISOString(),
    playTime: num(d.playTime, 0, 10_000_000, 0),
    player: {
      xp,
      hp: int(p.hp, 1, st.maxHp, st.maxHp),
      energy: int(p.energy, 0, st.maxEnergy, st.maxEnergy),
      credits: int(p.credits, 0, CREDITS_MAX, 0),
    },
    inventory: { items, equipped },
    quests: quests as Partial<Record<QuestId, QuestState>>,
    world: { area, x, y, defeated, collected, flags },
  }
}

export function readSlot(kv: KeyValueStore | null, n: number): SlotStatus {
  try {
    return parseSave(kv?.getItem(slotKey(n)) ?? null)
  } catch {
    return { state: 'empty' }
  }
}

/** Returns false when the browser refuses to store (quota, private mode). */
export function writeSlot(kv: KeyValueStore | null, n: number, data: SaveData): boolean {
  try {
    kv?.setItem(slotKey(n), JSON.stringify(data))
    return kv !== null
  } catch {
    return false
  }
}

export function deleteSlot(kv: KeyValueStore | null, n: number) {
  try {
    kv?.removeItem(slotKey(n))
  } catch {
    // Nothing to do: the slot stays as it was.
  }
}

/** The slot saved most recently, for "Continue". */
export function latestSlot(kv: KeyValueStore | null): number | null {
  let best: { n: number; at: number } | null = null
  for (let n = 1; n <= SLOT_COUNT; n++) {
    const s = readSlot(kv, n)
    if (s.state !== 'ok') continue
    const at = Date.parse(s.data.savedAt)
    if (!best || at > best.at) best = { n, at }
  }
  return best?.n ?? null
}

// ---------- Settings ----------

export interface Settings {
  master: number
  music: number
  sfx: number
  muted: boolean
  reducedMotion: boolean
  touch: 'auto' | 'on' | 'off'
  lang: 'fr' | 'en'
}

export function parseSettings(raw: string | null, prefersReducedMotion = false): Settings {
  let d: unknown = null
  try {
    d = raw ? JSON.parse(raw) : null
  } catch {
    d = null
  }
  const r = isRecord(d) ? d : {}
  return {
    master: int(r.master, 0, 100, 80),
    music: int(r.music, 0, 100, 60),
    sfx: int(r.sfx, 0, 100, 80),
    muted: r.muted === true,
    reducedMotion: typeof r.reducedMotion === 'boolean' ? r.reducedMotion : prefersReducedMotion,
    touch: known(r.touch, ['auto', 'on', 'off'] as const) ? r.touch : 'auto',
    lang: r.lang === 'en' ? 'en' : 'fr',
  }
}

export function browserStore(): KeyValueStore | null {
  try {
    const s = globalThis.localStorage
    s.getItem(SETTINGS_KEY)
    return s
  } catch {
    return null
  }
}
