/**
 * Game structure only: ids, correct answers, unlock rules and rewards.
 * Every visible text lives in ../locales/{fr,en}.ts under the same ids.
 */

export type Quality = 'best' | 'ok' | 'bad'
export type Axis = 'hardware' | 'software' | 'data' | 'people' | 'openness'
export const AXES: readonly Axis[] = ['hardware', 'software', 'data', 'people', 'openness']

export type MissionId = 'windows10' | 'licenses' | 'data' | 'reuse' | 'openvillage'
export type EnemyId = 'lockin' | 'licenses' | 'data' | 'obsolescence' | 'cloud' | 'interop'
export type ModuleId = 'linux' | 'libreoffice' | 'learning' | 'refurbish' | 'privacy' | 'standards' | 'inclusion'
export type LocationId = 'school' | 'hq' | 'library' | 'workshop' | 'server' | 'repair' | 'tower'
export type NpcId = 'teacher' | 'tech' | 'student' | 'grandpa'
export type AchievementId =
  | 'first_mission'
  | 'perfect_mission'
  | 'all_missions'
  | 'perfectionist'
  | 'comeback'
  | 'scholar'
  | 'engineer'
  | 'explorer'
  | 'sociable'
  | 'veteran'

export interface Option {
  id: string
  quality: Quality
}
export interface Question {
  id: string
  axis: Axis
  options: Option[]
}
export interface Mission {
  id: MissionId
  enemy: EnemyId
  questions: Question[]
}

const q = (id: string, axis: Axis, ...qualities: Quality[]): Question => ({
  id,
  axis,
  options: qualities.map((quality, i) => ({ id: 'abcd'[i]!, quality })),
})

/** Missions unlock in this order: each one needs the previous one completed. */
export const missions: Mission[] = [
  {
    id: 'windows10',
    enemy: 'obsolescence',
    questions: [q('q1', 'hardware', 'bad', 'bad', 'ok', 'best'), q('q2', 'software', 'bad', 'best', 'ok'), q('q3', 'people', 'bad', 'ok', 'best')],
  },
  {
    id: 'licenses',
    enemy: 'licenses',
    questions: [q('q1', 'software', 'ok', 'best', 'bad'), q('q2', 'openness', 'best', 'ok', 'bad'), q('q3', 'people', 'bad', 'ok', 'best')],
  },
  {
    id: 'data',
    enemy: 'data',
    questions: [q('q1', 'data', 'bad', 'best', 'ok'), q('q2', 'data', 'ok', 'bad', 'best'), q('q3', 'data', 'best', 'ok', 'bad')],
  },
  {
    id: 'reuse',
    enemy: 'lockin',
    questions: [q('q1', 'hardware', 'ok', 'bad', 'best'), q('q2', 'hardware', 'best', 'bad', 'ok'), q('q3', 'people', 'bad', 'best', 'ok')],
  },
  {
    id: 'openvillage',
    enemy: 'interop',
    questions: [
      q('q1', 'people', 'ok', 'best', 'bad'),
      q('q2', 'openness', 'bad', 'ok', 'best'),
      q('q3', 'openness', 'best', 'bad', 'ok'),
      q('q4', 'people', 'bad', 'best', 'ok'),
    ],
  },
]

export const POINTS: Record<Quality, number> = { best: 3, ok: 1, bad: 0 }
export const HINT_COST = 5

export interface Enemy {
  id: EnemyId
  danger: 1 | 2 | 3 | 4 | 5
  counters: ModuleId[]
}
export const enemies: Enemy[] = [
  { id: 'lockin', danger: 5, counters: ['standards', 'linux'] },
  { id: 'licenses', danger: 3, counters: ['libreoffice', 'learning'] },
  { id: 'data', danger: 4, counters: ['privacy'] },
  { id: 'obsolescence', danger: 4, counters: ['refurbish', 'linux'] },
  { id: 'cloud', danger: 3, counters: ['privacy', 'standards'] },
  { id: 'interop', danger: 2, counters: ['standards', 'libreoffice'] },
]

/** Workshop modules end with a one-question check; `answer` is the index of the right option (3 options). */
export const modules: { id: ModuleId; answer: 0 | 1 | 2 }[] = [
  { id: 'linux', answer: 1 },
  { id: 'libreoffice', answer: 2 },
  { id: 'learning', answer: 0 },
  { id: 'refurbish', answer: 1 },
  { id: 'privacy', answer: 2 },
  { id: 'standards', answer: 0 },
  { id: 'inclusion', answer: 1 },
]

export type Unlock = { mission: MissionId } | { allMissions: true } | null
export interface Location {
  id: LocationId
  /** Tile rectangle on the village map. */
  x: number
  y: number
  w: number
  h: number
  unlock: Unlock
  /** Where the location's main action leads, relative to the game root. */
  to: string
  roof: string
  wall: string
}

export const MAP_W = 20
export const MAP_H = 12

export const locations: Location[] = [
  { id: 'school', x: 8, y: 4, w: 4, h: 3, unlock: null, to: 'missions', roof: '#E84855', wall: '#FFF1C7' },
  { id: 'hq', x: 2, y: 1, w: 3, h: 3, unlock: null, to: 'qg', roof: '#4776D0', wall: '#E9D9A6' },
  { id: 'library', x: 15, y: 1, w: 3, h: 3, unlock: null, to: 'ennemis', roof: '#8B5CC4', wall: '#FFF1C7' },
  { id: 'workshop', x: 2, y: 7, w: 3, h: 3, unlock: { mission: 'windows10' }, to: 'atelier', roof: '#63B75D', wall: '#E9D9A6' },
  { id: 'server', x: 15, y: 7, w: 3, h: 3, unlock: { mission: 'data' }, to: 'atelier#privacy', roof: '#2E9C9A', wall: '#DDE6F0' },
  { id: 'repair', x: 8, y: 9, w: 4, h: 3, unlock: { mission: 'reuse' }, to: 'atelier#refurbish', roof: '#F08A3C', wall: '#FFF1C7' },
  { id: 'tower', x: 9, y: 0, w: 2, h: 3, unlock: { allMissions: true }, to: 'victoire', roof: '#5A5F73', wall: '#3A3F52' },
]

export interface Npc {
  id: NpcId
  x: number
  y: number
  hair: string
  shirt: string
  skin: string
}
export const npcs: Npc[] = [
  { id: 'teacher', x: 7, y: 6, hair: '#7A3B1D', shirt: '#E84855', skin: '#F2C49B' },
  { id: 'tech', x: 5, y: 9, hair: '#1B1B1B', shirt: '#63B75D', skin: '#B97A4F' },
  { id: 'student', x: 13, y: 5, hair: '#F5C451', shirt: '#8B5CC4', skin: '#F7D7B5' },
  { id: 'grandpa', x: 13, y: 10, hair: '#E6E6E6', shirt: '#F08A3C', skin: '#E3B58C' },
]
export const NPC_LINES = 3

export const trees: [number, number][] = [
  [0, 0], [1, 0], [18, 0], [19, 0], [6, 0], [13, 0], [0, 5], [19, 4], [0, 11], [1, 11], [19, 11], [6, 11], [13, 11], [19, 10],
]
export const pond = { x: 16, y: 5, w: 2, h: 1 }
export const HERO_START: [number, number] = [6, 5]

export const achievements: AchievementId[] = [
  'first_mission',
  'perfect_mission',
  'comeback',
  'all_missions',
  'perfectionist',
  'scholar',
  'engineer',
  'explorer',
  'sociable',
  'veteran',
]

/** XP needed to reach each level (index 0 = level 1). */
export const LEVELS = [0, 80, 200, 360, 560, 780]

/** Workshop modules suggested on the victory screen for each weak axis. */
export const AXIS_MODULES: Record<Axis, ModuleId[]> = {
  hardware: ['refurbish', 'linux'],
  software: ['libreoffice', 'linux'],
  data: ['privacy'],
  people: ['learning', 'inclusion'],
  openness: ['standards'],
}

export const REWARDS = {
  xpPerPoint: 10,
  xpMissionClear: 30,
  coinsPerStar: 10,
  enemy: { xp: 10, coins: 5 },
  module: { xp: 20, coins: 10 },
  location: { xp: 5, coins: 3 },
  npc: { xp: 5, coins: 3 },
  achievementCoins: 20,
}
