import assert from 'node:assert/strict'
import { test } from 'node:test'
import { en } from '../locales/en.ts'
import { fr } from '../locales/fr.ts'
import { achievements, enemies, locations, missions, modules, npcs, NPC_LINES } from './content.ts'
import { awardAchievements, coins, emptyProgress, level, missionUnlocked, recommendations, recordMission, sanitize, xp } from './progress.ts'

/** Every leaf path of a locale, arrays included with their length. */
const shape = (value: unknown, path = ''): string[] =>
  Array.isArray(value)
    ? [`${path}[${value.length}]`]
    : typeof value === 'object' && value !== null
      ? Object.entries(value).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k))
      : [path]

const get = (locale: unknown, path: string) => path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], locale)

test('French and English have exactly the same keys and list lengths', () => {
  assert.deepEqual(shape(en).sort(), shape(fr).sort())
})

test('every game entity has its texts in both languages', () => {
  const keys: string[] = []
  for (const m of missions) {
    keys.push(`missions.${m.id}.title`, `missions.${m.id}.intro`, `missions.${m.id}.objective`)
    for (const q of m.questions) {
      keys.push(`missions.${m.id}.q.${q.id}.prompt`)
      for (const o of q.options) keys.push(`missions.${m.id}.q.${q.id}.o.${o.id}.label`, `missions.${m.id}.q.${q.id}.o.${o.id}.why`)
    }
    assert.equal(Object.keys(get(fr, `missions.${m.id}.q`) as object).length, m.questions.length, m.id)
  }
  for (const e of enemies) keys.push(`enemies.${e.id}.name`, `enemies.${e.id}.nuance`)
  for (const mo of modules) {
    keys.push(`modules.${mo.id}.title`)
    assert.equal((get(fr, `modules.${mo.id}.quiz.options`) as string[]).length, 3, mo.id)
  }
  for (const l of locations) keys.push(`locations.${l.id}.name`, `locations.${l.id}.text`, `locations.${l.id}.cta`)
  for (const n of npcs) assert.equal((get(fr, `npcs.${n.id}.lines`) as string[]).length, NPC_LINES, n.id)
  for (const a of achievements) keys.push(`achievements.${a}.name`, `achievements.${a}.desc`)
  for (const locale of [fr, en]) for (const key of keys) assert.equal(typeof get(locale, key), 'string', key)
})

test('each question has exactly one best answer', () => {
  for (const m of missions) for (const q of m.questions) assert.equal(q.options.filter((o) => o.quality === 'best').length, 1, `${m.id}.${q.id}`)
})

test('replaying a mission cannot farm rewards; only an improvement counts', () => {
  const answers = (q: 'best' | 'ok' | 'bad') => missions[0]!.questions.map(() => q)
  let p = emptyProgress()
  const first = recordMission(p, 'windows10', answers('ok'))
  assert.ok(first.reward.firstClear && first.reward.xp > 0 && first.reward.coins > 0)
  p = first.progress

  const same = recordMission(p, 'windows10', answers('ok'))
  assert.equal(same.reward.xp, 0)
  assert.equal(same.reward.coins, 0)
  assert.equal(same.progress.missions.windows10!.attempts, 2)

  const worse = recordMission(same.progress, 'windows10', answers('bad'))
  assert.equal(worse.reward.xp, 0)
  assert.equal(worse.progress.missions.windows10!.best, first.reward.score)

  const better = recordMission(worse.progress, 'windows10', answers('best'))
  assert.equal(better.reward.xp, (better.reward.score - first.reward.score) * 10)
  assert.ok(better.progress.missions.windows10!.improved)
  assert.ok(awardAchievements(better.progress).unlocked.includes('comeback'))
})

test('missions unlock in order and levels follow XP', () => {
  const p = emptyProgress()
  assert.ok(missionUnlocked(p, 'windows10'))
  assert.ok(!missionUnlocked(p, 'licenses'))
  assert.ok(missionUnlocked(recordMission(p, 'windows10', ['bad', 'bad', 'bad']).progress, 'licenses'))
  assert.equal(level(0).level, 1)
  assert.equal(level(80).level, 2)
  assert.equal(level(10_000).level, 6)
  assert.equal(level(10_000).ratio, 1)
})

test('recommendations target the weakest axes', () => {
  let p = emptyProgress()
  for (const m of missions) p = recordMission(p, m.id, m.questions.map((q) => (q.axis === 'data' ? 'bad' : 'best'))).progress
  const recs = recommendations(p)
  assert.equal(recs.length, 1)
  assert.equal(recs[0]!.axis, 'data')
})

test('corrupted or tampered saves are repaired, not trusted', () => {
  assert.deepEqual(sanitize('garbage'), emptyProgress())
  assert.deepEqual(sanitize(null), emptyProgress())
  const p = sanitize({
    started: true,
    missions: { windows10: { best: 9999, attempts: -3, answers: ['best', 'best', 'best'] }, fake: {}, data: { answers: ['best'] } },
    enemies: ['lockin', 'lockin', 'dragon'],
    coinsSpent: 1e9,
    achievements: { first_mission: 'yesterday', veteran: 5 },
  })
  assert.equal(p.missions.windows10!.best, 9) // recomputed from the answers
  assert.equal(p.missions.windows10!.attempts, 1)
  assert.equal(p.missions.data, undefined) // wrong answer count
  assert.deepEqual(p.enemies, ['lockin'])
  assert.equal(coins(p), 0) // cannot spend more than earned
  assert.deepEqual(Object.keys(p.achievements), ['veteran'])
  assert.ok(xp(p) > 0)
})
