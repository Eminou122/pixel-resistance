// Game rules as data: items, enemies, levels, quests, recipes. No engine or UI code here.

export type AreaId = 'nova7' | 'wilds'
export const AREA_IDS: readonly AreaId[] = ['nova7', 'wilds']

export type Slot = 'melee' | 'ranged' | 'armor' | 'module'
export const SLOTS: readonly Slot[] = ['melee', 'ranged', 'armor', 'module']

export type ItemId =
  | 'healing_cell'
  | 'energy_cell'
  | 'components'
  | 'transmission_device'
  | 'pulse_blade'
  | 'arc_blade'
  | 'plasma_blaster'
  | 'basic_armor'
  | 'warden_plating'
  | 'signal_amplifier'

export interface Bonus {
  attack: number
  ranged: number
  defense: number
  maxHp: number
  maxEnergy: number
  regen: number
}

export interface ItemDef {
  kind: 'consumable' | 'material' | 'key' | 'equipment'
  slot?: Slot
  bonus?: Partial<Bonus>
  heal?: number
  energy?: number
  /** Most a player can carry. */
  max: number
}

export const ITEMS: Record<ItemId, ItemDef> = {
  healing_cell: { kind: 'consumable', heal: 45, max: 9 },
  energy_cell: { kind: 'consumable', energy: 50, max: 9 },
  components: { kind: 'material', max: 99 },
  transmission_device: { kind: 'key', max: 1 },
  pulse_blade: { kind: 'equipment', slot: 'melee', bonus: { attack: 4 }, max: 1 },
  arc_blade: { kind: 'equipment', slot: 'melee', bonus: { attack: 9 }, max: 1 },
  plasma_blaster: { kind: 'equipment', slot: 'ranged', bonus: { ranged: 4 }, max: 1 },
  basic_armor: { kind: 'equipment', slot: 'armor', bonus: { defense: 2 }, max: 1 },
  warden_plating: { kind: 'equipment', slot: 'armor', bonus: { defense: 6, maxHp: 20 }, max: 1 },
  signal_amplifier: { kind: 'equipment', slot: 'module', bonus: { maxEnergy: 25, regen: 3 }, max: 1 },
}
export const ITEM_IDS = Object.keys(ITEMS) as ItemId[]

export const STARTING_ITEMS: Partial<Record<ItemId, number>> = {
  pulse_blade: 1,
  plasma_blaster: 1,
  basic_armor: 1,
  healing_cell: 2,
  energy_cell: 1,
}
export const STARTING_EQUIPMENT: Record<Slot, ItemId | null> = {
  melee: 'pulse_blade',
  ranged: 'plasma_blaster',
  armor: 'basic_armor',
  module: null,
}

export type EnemyKind = 'drone' | 'sentinel' | 'warden'
export const ENEMIES: Record<EnemyKind, { hp: number; attack: number; defense: number; xp: number; credits: number }> = {
  drone: { hp: 22, attack: 8, defense: 0, xp: 15, credits: 6 },
  sentinel: { hp: 48, attack: 11, defense: 2, xp: 30, credits: 12 },
  warden: { hp: 300, attack: 16, defense: 4, xp: 250, credits: 120 },
}

/** XP needed to reach each level (index = level). */
export const XP_TABLE = [0, 0, 60, 160, 320, 540, 820, 1200] as const
export const MAX_LEVEL = 7

export const CREDITS_MAX = 999_999
export const XP_MAX = 99_999

/** Player tuning. */
export const PLAYER = {
  speed: 88,
  meleeCooldown: 340,
  rangedCooldown: 260,
  rangedCost: 8,
  dashSpeed: 260,
  dashTime: 180,
  dashCooldown: 800,
  hurtInvulnerability: 700,
  baseRegen: 6,
} as const

export interface Reward {
  xp?: number
  credits?: number
  items?: Partial<Record<ItemId, number>>
}

export type QuestId = 'lost_transmission' | 'iron_warden'
export const QUEST_IDS: readonly QuestId[] = ['lost_transmission', 'iron_warden']
export const QUESTS: Record<QuestId, { steps: readonly string[]; reward: Reward }> = {
  lost_transmission: {
    steps: ['leave_colony', 'explore_wilds', 'find_device', 'defeat_guards', 'return_colony'],
    reward: { xp: 120, credits: 80, items: { healing_cell: 2 } },
  },
  iron_warden: {
    steps: ['defeat_warden', 'report_back'],
    reward: { xp: 150, credits: 100, items: { energy_cell: 2 } },
  },
}

export const FLAGS = ['intro_seen', 'guards_awake', 'warden_defeated', 'chapter_complete'] as const
export type Flag = (typeof FLAGS)[number]

export interface Recipe {
  id: 'arc_blade' | 'healing_cell' | 'energy_cell'
  components: number
  credits: number
  gives: ItemId
}
export const RECIPES: readonly Recipe[] = [
  { id: 'arc_blade', components: 6, credits: 60, gives: 'arc_blade' },
  { id: 'healing_cell', components: 2, credits: 15, gives: 'healing_cell' },
  { id: 'energy_cell', components: 1, credits: 15, gives: 'energy_cell' },
]

export type NpcId = 'commander' | 'juno' | 'tamsin'
