/**
 * Pure progression rules. Every reward is *derived* from what the player has achieved
 * (best score per mission, sets of discoveries), so replaying a mission or reopening an
 * entry can never farm XP or coins: only an improved best score adds the difference.
 */
import {
  AXES,
  AXIS_MODULES,
  LEVELS,
  POINTS,
  REWARDS,
  achievements,
  enemies,
  locations,
  missions,
  modules,
  npcs,
  type AchievementId,
  type Axis,
  type Location,
  type MissionId,
  type ModuleId,
  type Quality,
} from './content.ts'

export const SAVE_VERSION = 1

export interface MissionRecord {
  /** Best score reached so far. */
  best: number
  attempts: number
  /** Answers of the best attempt, one per question, used for recommendations. */
  answers: Quality[]
  /** The best score was raised by a replay. */
  improved: boolean
}

export interface Progress {
  started: boolean
  introSeen: boolean
  missions: Partial<Record<MissionId, MissionRecord>>
  enemies: string[]
  modules: string[]
  locations: string[]
  npcs: string[]
  coinsSpent: number
  /** Achievement id → unlock time (ms). */
  achievements: Partial<Record<AchievementId, number>>
}

export const emptyProgress = (): Progress => ({
  started: false,
  introSeen: false,
  missions: {},
  enemies: [],
  modules: [],
  locations: [],
  npcs: [],
  coinsSpent: 0,
  achievements: {},
})

/* ---------- Scores ---------- */

export const maxScore = (id: MissionId) => missions.find((m) => m.id === id)!.questions.length * POINTS.best
export const scoreOf = (answers: Quality[]) => answers.reduce((sum, a) => sum + POINTS[a], 0)

/** 3 stars ≥ 85 %, 2 stars ≥ 55 %, 1 star for finishing. */
export function stars(id: MissionId, score: number): 0 | 1 | 2 | 3 {
  const ratio = score / maxScore(id)
  return ratio >= 0.85 ? 3 : ratio >= 0.55 ? 2 : 1
}

const completed = (p: Progress) => missions.filter((m) => p.missions[m.id])
const known = <T extends { id: string }>(list: T[], ids: string[]) => list.filter((item) => ids.includes(item.id)).length

export function xp(p: Progress): number {
  const fromMissions = completed(p).reduce((sum, m) => sum + p.missions[m.id]!.best * REWARDS.xpPerPoint + REWARDS.xpMissionClear, 0)
  return (
    fromMissions +
    known(enemies, p.enemies) * REWARDS.enemy.xp +
    known(modules, p.modules) * REWARDS.module.xp +
    known(locations, p.locations) * REWARDS.location.xp +
    known(npcs, p.npcs) * REWARDS.npc.xp
  )
}

export function coinsEarned(p: Progress): number {
  const fromMissions = completed(p).reduce((sum, m) => sum + stars(m.id, p.missions[m.id]!.best) * REWARDS.coinsPerStar, 0)
  return (
    fromMissions +
    known(enemies, p.enemies) * REWARDS.enemy.coins +
    known(modules, p.modules) * REWARDS.module.coins +
    known(locations, p.locations) * REWARDS.location.coins +
    known(npcs, p.npcs) * REWARDS.npc.coins +
    Object.keys(p.achievements).length * REWARDS.achievementCoins
  )
}

export const coins = (p: Progress) => Math.max(0, coinsEarned(p) - p.coinsSpent)

export function level(totalXp: number) {
  let index = 0
  while (index + 1 < LEVELS.length && totalXp >= LEVELS[index + 1]!) index++
  const floor = LEVELS[index]!
  const next = LEVELS[index + 1]
  return { level: index + 1, floor, next, ratio: next === undefined ? 1 : (totalXp - floor) / (next - floor) }
}

/** Resistance score: everything earned, minus nothing — hints cost coins, so they lower it. */
export const finalScore = (p: Progress) => xp(p) + coins(p)

/* ---------- Unlocks ---------- */

export function missionUnlocked(p: Progress, id: MissionId) {
  const index = missions.findIndex((m) => m.id === id)
  return index === 0 || Boolean(p.missions[missions[index - 1]!.id])
}

export function locationUnlocked(p: Progress, location: Location) {
  const rule = location.unlock
  if (!rule) return true
  if ('mission' in rule) return Boolean(p.missions[rule.mission])
  return allMissionsDone(p)
}

export const allMissionsDone = (p: Progress) => missions.every((m) => p.missions[m.id])

/* ---------- Recording ---------- */

export interface Reward {
  score: number
  stars: number
  firstClear: boolean
  newBest: boolean
  xp: number
  coins: number
}

/** Records an attempt and returns the progress plus what it actually earned. */
export function recordMission(p: Progress, id: MissionId, answers: Quality[]): { progress: Progress; reward: Reward } {
  const previous = p.missions[id]
  const score = scoreOf(answers)
  const newBest = !previous || score > previous.best
  const record: MissionRecord = previous
    ? newBest
      ? { best: score, attempts: previous.attempts + 1, answers, improved: true }
      : { ...previous, attempts: previous.attempts + 1 }
    : { best: score, attempts: 1, answers, improved: false }
  const next = { ...p, missions: { ...p.missions, [id]: record } }
  return {
    progress: next,
    reward: {
      score,
      stars: stars(id, score),
      firstClear: !previous,
      newBest,
      xp: xp(next) - xp(p),
      coins: coinsEarned(next) - coinsEarned(p),
    },
  }
}

const rules: Record<AchievementId, (p: Progress) => boolean> = {
  first_mission: (p) => completed(p).length >= 1,
  perfect_mission: (p) => completed(p).some((m) => p.missions[m.id]!.best === maxScore(m.id)),
  comeback: (p) => completed(p).some((m) => p.missions[m.id]!.improved),
  all_missions: allMissionsDone,
  perfectionist: (p) => missions.every((m) => p.missions[m.id]?.best === maxScore(m.id)),
  scholar: (p) => known(enemies, p.enemies) === enemies.length,
  engineer: (p) => known(modules, p.modules) === modules.length,
  explorer: (p) => known(locations, p.locations) === locations.length,
  sociable: (p) => known(npcs, p.npcs) === npcs.length,
  veteran: (p) => level(xp(p)).level >= 5,
}

/** Adds newly earned achievements; returns their ids so the UI can celebrate them. */
export function awardAchievements(p: Progress, now = Date.now()): { progress: Progress; unlocked: AchievementId[] } {
  const unlocked = achievements.filter((id) => !p.achievements[id] && rules[id](p))
  if (unlocked.length === 0) return { progress: p, unlocked }
  const earned = { ...p.achievements }
  for (const id of unlocked) earned[id] = now
  return { progress: { ...p, achievements: earned }, unlocked }
}

/* ---------- Victory summary ---------- */

/** Share of the best possible points per axis, across the best attempt of each mission (0–1). */
export function axisScores(p: Progress): Record<Axis, number> {
  const got = Object.fromEntries(AXES.map((a) => [a, 0])) as Record<Axis, number>
  const max = Object.fromEntries(AXES.map((a) => [a, 0])) as Record<Axis, number>
  for (const mission of missions) {
    const answers = p.missions[mission.id]?.answers ?? []
    mission.questions.forEach((question, i) => {
      max[question.axis] += POINTS.best
      got[question.axis] += POINTS[answers[i] ?? 'bad']
    })
  }
  return Object.fromEntries(AXES.map((a) => [a, max[a] ? got[a] / max[a] : 0])) as Record<Axis, number>
}

/** Weakest axes first (only those below 100 %), each with the workshop modules that help. */
export function recommendations(p: Progress): { axis: Axis; score: number; modules: ModuleId[] }[] {
  const scores = axisScores(p)
  return AXES.filter((a) => scores[a] < 1)
    .sort((a, b) => scores[a] - scores[b])
    .map((axis) => ({ axis, score: scores[axis], modules: AXIS_MODULES[axis] }))
}

/* ---------- Saved data ---------- */

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const ids = (v: unknown, allowed: string[]) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => allowed.includes(x as string)))] : [])
const QUALITIES: Quality[] = ['best', 'ok', 'bad']

/** Turns whatever was found in storage into a valid Progress, dropping anything unknown or malformed. */
export function sanitize(raw: unknown): Progress {
  const base = emptyProgress()
  if (!isRecord(raw)) return base

  const savedMissions: Progress['missions'] = {}
  if (isRecord(raw.missions)) {
    for (const mission of missions) {
      const r = raw.missions[mission.id]
      if (!isRecord(r)) continue
      const answers = Array.isArray(r.answers) ? r.answers.filter((a): a is Quality => QUALITIES.includes(a as Quality)) : []
      if (answers.length !== mission.questions.length) continue
      const best = scoreOf(answers)
      savedMissions[mission.id] = {
        best,
        attempts: typeof r.attempts === 'number' && r.attempts >= 1 ? Math.floor(r.attempts) : 1,
        answers,
        improved: r.improved === true,
      }
    }
  }

  const savedAchievements: Progress['achievements'] = {}
  if (isRecord(raw.achievements)) {
    for (const id of achievements) {
      const at = raw.achievements[id]
      if (typeof at === 'number' && Number.isFinite(at)) savedAchievements[id] = at
    }
  }

  const progress: Progress = {
    started: raw.started === true,
    introSeen: raw.introSeen === true,
    missions: savedMissions,
    enemies: ids(raw.enemies, enemies.map((e) => e.id)),
    modules: ids(raw.modules, modules.map((m) => m.id)),
    locations: ids(raw.locations, locations.map((l) => l.id)),
    npcs: ids(raw.npcs, npcs.map((n) => n.id)),
    coinsSpent: 0,
    achievements: savedAchievements,
  }
  const spent = typeof raw.coinsSpent === 'number' && Number.isFinite(raw.coinsSpent) ? Math.max(0, Math.floor(raw.coinsSpent)) : 0
  progress.coinsSpent = Math.min(spent, coinsEarned(progress))
  return progress
}
