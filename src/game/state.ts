// The player's game state and the pure rules that change it: stats, inventory, rewards, crafting.
import {
  ENEMIES, ITEMS, MAX_LEVEL, PLAYER, RECIPES, STARTING_EQUIPMENT, STARTING_ITEMS, XP_MAX, XP_TABLE, CREDITS_MAX,
  type AreaId, type Bonus, type Flag, type ItemId, type QuestId, type Recipe, type Reward, type Slot,
} from './data.ts'
import { AREAS, TILE } from './maps.ts'

export const SAVE_VERSION = 1

export interface Inventory {
  items: Partial<Record<ItemId, number>>
  equipped: Record<Slot, ItemId | null>
}
export interface QuestState {
  step: number
  done: boolean
}
export interface SaveData {
  version: typeof SAVE_VERSION
  savedAt: string
  /** Seconds. */
  playTime: number
  player: { xp: number; hp: number; energy: number; credits: number }
  inventory: Inventory
  quests: Partial<Record<QuestId, QuestState>>
  world: { area: AreaId; x: number; y: number; defeated: string[]; collected: string[]; flags: Flag[] }
}

// ---------- Stats ----------

export interface Stats extends Bonus {
  level: number
}

export function levelForXp(xp: number): number {
  let level = 1
  while (level < MAX_LEVEL && xp >= XP_TABLE[level + 1]!) level++
  return level
}

export function xpProgress(xp: number) {
  const level = levelForXp(xp)
  const floor = XP_TABLE[level]!
  const next = level < MAX_LEVEL ? XP_TABLE[level + 1]! : undefined
  return { level, floor, next, ratio: next === undefined ? 1 : (xp - floor) / (next - floor) }
}

export function statsFor(xp: number, equipped: Inventory['equipped']): Stats {
  const level = levelForXp(xp)
  const l = level - 1
  const base: Bonus = { maxHp: 80 + 12 * l, maxEnergy: 60 + 6 * l, attack: 6 + 2 * l, ranged: 0, defense: 2 + l, regen: PLAYER.baseRegen, dash: 0 }
  base.ranged = Math.floor(base.attack * 0.6)
  for (const id of Object.values(equipped)) {
    const bonus = id ? ITEMS[id].bonus : undefined
    if (bonus) for (const [k, v] of Object.entries(bonus)) base[k as keyof Bonus] += v
  }
  return { level, ...base }
}

export const statsOf = (s: SaveData) => statsFor(s.player.xp, s.inventory.equipped)

/** Is a hit coming from in front of a shield? (angles in radians; the shield covers 120 degrees) */
export function frontalBlock(facing: number, attackFrom: number): boolean {
  const d = Math.atan2(Math.sin(attackFrom - facing), Math.cos(attackFrom - facing))
  return Math.abs(d) <= Math.PI / 3
}

/** Damage after the target's defence; every hit does at least 1. */
export const damage = (attack: number, defense: number) => Math.max(1, Math.round(attack - defense / 2))

// ---------- Inventory ----------

export const count = (inv: Inventory, id: ItemId) => inv.items[id] ?? 0

export function addItem(inv: Inventory, id: ItemId, n: number): Inventory {
  const next = Math.min(ITEMS[id].max, count(inv, id) + Math.max(0, Math.floor(n)))
  return { ...inv, items: { ...inv.items, [id]: next } }
}

export function removeItem(inv: Inventory, id: ItemId, n: number): Inventory | null {
  const have = count(inv, id)
  if (n <= 0 || have < n) return null
  const items = { ...inv.items, [id]: have - n }
  if (items[id] === 0) delete items[id]
  const equipped = { ...inv.equipped }
  for (const slot of Object.keys(equipped) as Slot[]) if (equipped[slot] === id && !items[id]) equipped[slot] = null
  return { items, equipped }
}

export function equip(inv: Inventory, id: ItemId): Inventory | null {
  const slot = ITEMS[id].slot
  if (!slot || count(inv, id) < 1) return null
  return { ...inv, equipped: { ...inv.equipped, [slot]: id } }
}

export const unequip = (inv: Inventory, slot: Slot): Inventory => ({ ...inv, equipped: { ...inv.equipped, [slot]: null } })

/** Uses a consumable. Returns null when it would do nothing (none left, or already full). */
export function useItem(s: SaveData, id: ItemId): SaveData | null {
  const def = ITEMS[id]
  if (def.kind !== 'consumable' || count(s.inventory, id) < 1) return null
  const st = statsOf(s)
  const hp = Math.min(st.maxHp, s.player.hp + (def.heal ?? 0))
  const energy = Math.min(st.maxEnergy, s.player.energy + (def.energy ?? 0))
  if (hp === s.player.hp && energy === s.player.energy) return null
  return { ...s, inventory: removeItem(s.inventory, id, 1)!, player: { ...s.player, hp, energy } }
}

// ---------- Rewards ----------

export interface Granted {
  save: SaveData
  /** New level if the reward made the player level up. */
  levelUp: number | null
}

export function grant(s: SaveData, reward: Reward): Granted {
  const before = levelForXp(s.player.xp)
  const xp = Math.min(XP_MAX, s.player.xp + (reward.xp ?? 0))
  const credits = Math.min(CREDITS_MAX, s.player.credits + (reward.credits ?? 0))
  let inventory = s.inventory
  for (const [id, n] of Object.entries(reward.items ?? {})) inventory = addItem(inventory, id as ItemId, n)
  let player = { ...s.player, xp, credits }
  const after = levelForXp(xp)
  if (after > before) {
    // Levelling up restores the player completely.
    const st = statsFor(xp, inventory.equipped)
    player = { ...player, hp: st.maxHp, energy: st.maxEnergy }
  }
  return { save: { ...s, player, inventory }, levelUp: after > before ? after : null }
}

/**
 * Grants a reward tied to one enemy or one pickup, at most once per save.
 * Reloading a save restores both the reward and the "already taken" mark together, so nothing can be farmed.
 */
export function grantOnce(s: SaveData, list: 'defeated' | 'collected', id: string, reward: Reward): Granted & { granted: boolean } {
  if (s.world[list].includes(id)) return { save: s, levelUp: null, granted: false }
  const marked: SaveData = { ...s, world: { ...s.world, [list]: [...s.world[list], id] } }
  return { ...grant(marked, reward), granted: true }
}

export function enemyReward(kind: keyof typeof ENEMIES, drop?: { item: ItemId; amount: number }): Reward {
  const e = ENEMIES[kind]
  return { xp: e.xp, credits: e.credits, items: drop ? { [drop.item]: drop.amount } : {} }
}

export function canCraft(s: SaveData, recipe: Recipe): boolean {
  const def = ITEMS[recipe.gives]
  return (
    count(s.inventory, 'components') >= recipe.components &&
    count(s.inventory, 'spire_alloy') >= (recipe.alloy ?? 0) &&
    s.player.credits >= recipe.credits &&
    count(s.inventory, recipe.gives) < def.max
  )
}

export function craft(s: SaveData, id: Recipe['id']): SaveData | null {
  const recipe = RECIPES.find((r) => r.id === id)
  if (!recipe || !canCraft(s, recipe)) return null
  let inventory = removeItem(s.inventory, 'components', recipe.components)!
  if (recipe.alloy) inventory = removeItem(inventory, 'spire_alloy', recipe.alloy)!
  inventory = addItem(inventory, recipe.gives, 1)
  return { ...s, inventory, player: { ...s.player, credits: s.player.credits - recipe.credits } }
}

export const hasFlag = (s: SaveData, f: Flag) => s.world.flags.includes(f)
export const setFlag = (s: SaveData, f: Flag): SaveData =>
  hasFlag(s, f) ? s : { ...s, world: { ...s.world, flags: [...s.world.flags, f] } }
export const clearFlag = (s: SaveData, f: Flag): SaveData =>
  hasFlag(s, f) ? { ...s, world: { ...s.world, flags: s.world.flags.filter((x) => x !== f) } } : s

// ---------- New game ----------

export function newSave(now = new Date()): SaveData {
  const start = AREAS.nova7.entries.start!
  const inventory: Inventory = { items: { ...STARTING_ITEMS }, equipped: { ...STARTING_EQUIPMENT } }
  const st = statsFor(0, inventory.equipped)
  return {
    version: SAVE_VERSION,
    savedAt: now.toISOString(),
    playTime: 0,
    player: { xp: 0, hp: st.maxHp, energy: st.maxEnergy, credits: 25 },
    inventory,
    quests: {},
    world: { area: 'nova7', x: (start.x + 0.5) * TILE, y: (start.y + 0.5) * TILE, defeated: [], collected: [], flags: [] },
  }
}
