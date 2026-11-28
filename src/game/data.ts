// Game rules as data: items, enemies, levels, quests, recipes. No engine or UI code here.

export type AreaId = 'nova7' | 'wilds' | 'frontier' | 'spire1' | 'spire2' | 'chamber'
export const AREA_IDS: readonly AreaId[] = ['nova7', 'wilds', 'frontier', 'spire1', 'spire2', 'chamber']

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
  // Chapter 2
  | 'spire_alloy'
  | 'echo_log'
  | 'spire_keycard'
  | 'ion_scattergun'
  | 'resonance_blade'
  | 'phase_core'

export interface Bonus {
  attack: number
  ranged: number
  defense: number
  maxHp: number
  maxEnergy: number
  regen: number
  /** Milliseconds taken off the dash cooldown. */
  dash: number
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
  spire_alloy: { kind: 'material', max: 99 },
  echo_log: { kind: 'key', max: 4 },
  spire_keycard: { kind: 'key', max: 1 },
  // Fires three bolts in a fan: weaker per bolt, devastating up close.
  ion_scattergun: { kind: 'equipment', slot: 'ranged', bonus: { ranged: 2 }, max: 1 },
  resonance_blade: { kind: 'equipment', slot: 'melee', bonus: { attack: 14 }, max: 1 },
  phase_core: { kind: 'equipment', slot: 'module', bonus: { maxEnergy: 15, regen: 2, dash: 300, defense: 2 }, max: 1 },
}
export const ITEM_IDS = Object.keys(ITEMS) as ItemId[]

/** Ranged weapons that fire a fan of bolts instead of one. */
export const SPREAD_WEAPONS: Partial<Record<ItemId, { bolts: number; cost: number; spread: number }>> = {
  ion_scattergun: { bolts: 3, cost: 12, spread: 0.32 },
}

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

export type EnemyKind = 'drone' | 'sentinel' | 'phantom' | 'heavy' | 'technician' | 'warden' | 'arbiter'
export const ENEMIES: Record<EnemyKind, { hp: number; attack: number; defense: number; xp: number; credits: number }> = {
  drone: { hp: 22, attack: 8, defense: 0, xp: 15, credits: 6 },
  sentinel: { hp: 48, attack: 11, defense: 2, xp: 30, credits: 12 },
  phantom: { hp: 30, attack: 13, defense: 1, xp: 32, credits: 10 },
  heavy: { hp: 90, attack: 16, defense: 4, xp: 55, credits: 20 },
  technician: { hp: 34, attack: 6, defense: 1, xp: 35, credits: 14 },
  warden: { hp: 300, attack: 16, defense: 4, xp: 250, credits: 120 },
  arbiter: { hp: 520, attack: 18, defense: 5, xp: 450, credits: 260 },
}

/** XP needed to reach each level (index = level). Levels 1-7 are unchanged from Chapter 1. */
export const XP_TABLE = [0, 0, 60, 160, 320, 540, 820, 1200, 1650, 2200, 2900] as const
export const MAX_LEVEL = 10

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

export type QuestId = 'lost_transmission' | 'iron_warden' | 'relay_spire' | 'echo_logs'
export const QUEST_IDS: readonly QuestId[] = ['lost_transmission', 'iron_warden', 'relay_spire', 'echo_logs']
export const QUESTS: Record<QuestId, { steps: readonly string[]; reward: Reward }> = {
  lost_transmission: {
    steps: ['leave_colony', 'explore_wilds', 'find_device', 'defeat_guards', 'return_colony'],
    reward: { xp: 120, credits: 80, items: { healing_cell: 2 } },
  },
  iron_warden: {
    steps: ['defeat_warden', 'report_back'],
    reward: { xp: 150, credits: 100, items: { energy_cell: 2 } },
  },
  relay_spire: {
    steps: ['enter_frontier', 'restore_power', 'enter_spire', 'find_keycard', 'reach_chamber', 'defeat_arbiter', 'free_rook', 'report_vey'],
    reward: { xp: 300, credits: 200, items: { healing_cell: 3, spire_alloy: 2 } },
  },
  echo_logs: {
    steps: ['collect_logs', 'return_moss'],
    reward: { xp: 180, credits: 90, items: { ion_scattergun: 1 } },
  },
}
/** Main quests in story order (the HUD shows the latest unfinished one). */
export const MAIN_QUESTS: readonly QuestId[] = ['lost_transmission', 'iron_warden', 'relay_spire']

export const FLAGS = [
  'intro_seen', 'guards_awake', 'warden_defeated', 'chapter_complete',
  // Chapter 2
  'pylon_1', 'pylon_2', 'pylon_3', 'barrier_b', 'arbiter_defeated', 'rook_trusted', 'rook_doubted', 'chapter2_complete',
] as const
export type Flag = (typeof FLAGS)[number]
export const PYLONS = ['pylon_1', 'pylon_2', 'pylon_3'] as const satisfies readonly Flag[]
export const LOGS_NEEDED = 4

export interface Recipe {
  id: 'arc_blade' | 'healing_cell' | 'energy_cell' | 'resonance_blade'
  components: number
  credits: number
  alloy?: number
  gives: ItemId
}
export const RECIPES: readonly Recipe[] = [
  { id: 'arc_blade', components: 6, credits: 60, gives: 'arc_blade' },
  { id: 'healing_cell', components: 2, credits: 15, gives: 'healing_cell' },
  { id: 'energy_cell', components: 1, credits: 15, gives: 'energy_cell' },
  { id: 'resonance_blade', components: 6, credits: 140, alloy: 4, gives: 'resonance_blade' },
]

export type NpcId = 'commander' | 'juno' | 'tamsin' | 'rook' | 'moss'
