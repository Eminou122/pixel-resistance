import assert from 'node:assert/strict'
import test from 'node:test'
import { LOGS_NEEDED, PYLONS, RECIPES } from './data.ts'
import { AREAS, BREAKABLE_IDS, kindAt, reachable, walkable, wallId, type AreaDef, type TileKind } from './maps.ts'
import { parseSave, sanitize } from './save.ts'
import { addItem, craft, frontalBlock, grantOnce, statsOf, type SaveData } from './state.ts'
import {
  applyEffect, beaconVisible, currentObjective, doorOpen, npcVisible, onArbiterDefeated, onEnterArea, onKeycard, onLogPicked,
  onPylon, onTerminal, powerRestored, questStep, spireGate, talk,
} from './story.ts'

/** A real end-of-Chapter-1 save, exactly as the Chapter 1 build wrote it. */
const CHAPTER1_SAVE = JSON.stringify({
  version: 1,
  savedAt: '2026-11-27T17:00:00.000Z',
  playTime: 390,
  player: { xp: 625, hp: 128, energy: 84, credits: 352 },
  inventory: {
    items: { pulse_blade: 1, plasma_blaster: 1, basic_armor: 1, healing_cell: 4, energy_cell: 2, components: 6, transmission_device: 1, warden_plating: 1 },
    equipped: { melee: 'pulse_blade', ranged: 'plasma_blaster', armor: 'warden_plating', module: null },
  },
  quests: { lost_transmission: { step: 4, done: true }, iron_warden: { step: 1, done: true } },
  world: {
    area: 'nova7',
    x: 227.5,
    y: 110.5,
    defeated: ['drone_3', 'drone_1', 'guard_drone', 'guard_sentinel_1', 'guard_sentinel_2', 'iron_warden'],
    collected: ['w_heal_1'],
    flags: ['intro_seen', 'guards_awake', 'warden_defeated', 'chapter_complete'],
  },
})

const chapter1 = (): SaveData => {
  const s = parseSave(CHAPTER1_SAVE)
  assert.equal(s.state, 'ok')
  return (s as { data: SaveData }).data
}
const key = (p: { x: number; y: number }) => `${Math.floor(p.x)},${Math.floor(p.y)}`
/** Can Kael stand next to this (possibly solid) spot? */
const nextTo = (seen: Set<string>, p: { x: number; y: number }) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]].some(([dx, dy]) => seen.has(`${p.x + dx!},${p.y + dy!}`))
const exitTiles = (a: AreaDef, c: string) => a.rows.flatMap((row, y) => [...row].flatMap((ch, x) => (ch === c ? [`${x},${y}`] : [])))

test('compatibility: a Chapter 1 save loads unchanged and leads into Chapter 2', () => {
  const s = chapter1()
  const raw = JSON.parse(CHAPTER1_SAVE)
  assert.deepEqual(s.inventory, raw.inventory)
  assert.deepEqual(s.quests, raw.quests)
  assert.deepEqual(s.world, raw.world)
  assert.deepEqual(s.player, raw.player)
  // The Commander now offers Chapter 2.
  const offer = talk('commander', s)
  assert.equal(offer.choices?.[0]?.effect, 'accept_q3')
  assert.equal(spireGate(s).text, 'msg.spireWaiting')
  const started = applyEffect(s, 'accept_q3').save
  assert.equal(questStep(started, 'relay_spire'), 'enter_frontier')
  assert.equal(spireGate(started).choices?.[0]?.effect, 'go_frontier')
})

test('maps: every exit leads to an entry that exists, and entries are reachable from each other', () => {
  for (const area of Object.values(AREAS)) {
    for (const [c, exit] of Object.entries(area.exits)) {
      assert.ok(AREAS[exit.to].entries[exit.entry], `${area.id} '${c}' → ${exit.to}.${exit.entry}`)
      assert.ok(exitTiles(area, c).length > 0, `${area.id} has '${c}' tiles`)
    }
  }
})

test('maps: the Frontier — pylons and Moss in reach, caches behind cracked walls, the Spire behind the blast door', () => {
  const f = AREAS.frontier
  const closed = reachable(f, f.entries.wilds!)
  for (const i of f.interactables) assert.ok(nextTo(closed, i), `${i.kind} ${i.id ?? ''}`)
  assert.ok(nextTo(closed, f.npcs[0]!), 'Moss')
  for (const id of ['f_log_1', 'f_log_2', 'f_alloy_store', 'f_credits_house'])
    assert.ok(!closed.has(key(f.pickups.find((p) => p.id === id)!)), `${id} is hidden`)
  assert.ok(!exitTiles(f, 'E').some((t) => closed.has(t)), 'the Spire stays shut')
  const open = reachable(f, f.entries.wilds!, new Set<TileKind>(['cracked', 'blastdoor']))
  for (const p of f.pickups) assert.ok(open.has(key(p)), p.id)
  for (const e of f.enemies) assert.ok(open.has(key(e)), e.id)
  assert.ok(exitTiles(f, 'E').some((t) => open.has(t)))
})

test('maps: the Spire barrier puzzle — keycard behind A, lift behind B, a terminal always in reach', () => {
  const s1 = AREAS.spire1
  const terminals = s1.interactables.filter((i) => i.kind === 'terminal')
  const stateA = new Set<TileKind>(['barrierA'])
  const stateB = new Set<TileKind>(['barrierB'])
  const a = reachable(s1, s1.entries.frontier!, stateA)
  assert.ok(a.has('3,4'), 'keycard reachable while A is open')
  assert.ok(!exitTiles(s1, 'U').some((t) => a.has(t)), 'lift closed while B is up')
  const b = reachable(s1, s1.entries.frontier!, stateB)
  assert.ok(exitTiles(s1, 'U').some((t) => b.has(t)), 'lift reachable once B is open')
  assert.ok(!b.has('3,4'))
  // No softlock: from every entry and in both states, Kael can reach a terminal.
  for (const entry of Object.values(s1.entries))
    for (const state of [stateA, stateB]) {
      const seen = reachable(s1, entry, state)
      assert.ok(terminals.some((t) => nextTo(seen, t)), `terminal from ${key(entry)}`)
    }
  // Every pickup is reachable in one state or the other (the cache needs its wall broken).
  const any = new Set([...reachable(s1, s1.entries.frontier!, new Set<TileKind>(['barrierA', 'cracked'])), ...reachable(s1, s1.entries.frontier!, new Set<TileKind>(['barrierB', 'cracked']))])
  for (const p of s1.pickups) assert.ok(any.has(key(p)), p.id)
})

test('maps: upper Spire and Signal Chamber — keycard door, cache, arena', () => {
  const s2 = AREAS.spire2
  const closed = reachable(s2, s2.entries.spire1!)
  assert.ok(!exitTiles(s2, 'C').some((t) => closed.has(t)), 'the chamber needs the keycard')
  const open = reachable(s2, s2.entries.spire1!, new Set<TileKind>(['keydoor', 'cracked']))
  assert.ok(exitTiles(s2, 'C').some((t) => open.has(t)))
  for (const p of s2.pickups) assert.ok(open.has(key(p)), p.id)
  for (const e of s2.enemies) assert.ok(open.has(key(e)), e.id)
  const c = AREAS.chamber
  const arena = reachable(c, c.entries.spire2!, new Set<TileKind>(['seal']))
  assert.ok(arena.has(key(c.boss!)) && nextTo(arena, c.npcs[0]!))
  assert.ok(!reachable(c, c.entries.spire2!).has(key(c.boss!)), 'the seal blocks the arena until opened')
})

test('doors: power, barriers, keycard and broken walls follow the save', () => {
  let s = applyEffect(chapter1(), 'accept_q3').save
  assert.ok(!doorOpen('blastdoor', s, 'frontier', 20, 3))
  for (const p of PYLONS) s = onPylon(s, p).save
  assert.ok(powerRestored(s) && doorOpen('blastdoor', s, 'frontier', 20, 3))
  assert.ok(doorOpen('barrierA', s, 'spire1', 8, 10) && !doorOpen('barrierB', s, 'spire1', 23, 10))
  s = onTerminal(s).save
  assert.ok(!doorOpen('barrierA', s, 'spire1', 8, 10) && doorOpen('barrierB', s, 'spire1', 23, 10))
  s = onTerminal(s).save
  assert.ok(doorOpen('barrierA', s, 'spire1', 8, 10))
  assert.ok(!doorOpen('keydoor', s, 'spire2', 14, 5))
  s = { ...s, inventory: addItem(s.inventory, 'spire_keycard', 1) }
  assert.ok(doorOpen('keydoor', s, 'spire2', 14, 5))
  const wall = wallId('frontier', 7, 9)
  assert.ok(BREAKABLE_IDS.includes(wall))
  assert.ok(!doorOpen('cracked', s, 'frontier', 7, 9))
  s = grantOnce(s, 'collected', wall, {}).save
  assert.ok(doorOpen('cracked', s, 'frontier', 7, 9))
  assert.deepEqual(sanitize(JSON.parse(JSON.stringify(s))).world.collected, s.world.collected, 'broken walls survive a save')
})

test('story: Chapter 2 from start to finish, with its reward paid once', () => {
  let s = applyEffect(chapter1(), 'accept_q3').save
  assert.ok(!beaconVisible('nova7', s), 'the colony beacon waits until the Frontier is reached')
  s = onEnterArea(s, 'frontier').save
  assert.equal(questStep(s, 'relay_spire'), 'restore_power')
  assert.ok(beaconVisible('nova7', s))
  assert.equal(onPylon(s, 'pylon_2').message, 'msg.pylonActivated')
  s = onPylon(onPylon(s, 'pylon_2').save, 'pylon_1').save
  assert.equal(onPylon(s, 'pylon_1').message, 'msg.pylonOn', 'a pylon only counts once')
  s = onPylon(s, 'pylon_3').save
  assert.equal(questStep(s, 'relay_spire'), 'enter_spire')
  s = onEnterArea(s, 'spire1').save
  s = grantOnce(s, 'collected', 's1_keycard', { items: { spire_keycard: 1 } }).save
  s = onKeycard(s).save
  assert.equal(questStep(s, 'relay_spire'), 'reach_chamber')
  s = onEnterArea(s, 'chamber').save
  assert.deepEqual(currentObjective(s), { quest: 'relay_spire', step: 'defeat_arbiter' })
  assert.ok(!npcVisible('rook', 'chamber', s))
  const before = s.player.xp
  s = onArbiterDefeated(s).save
  assert.ok(s.player.xp > before && s.inventory.items.phase_core === 1)
  assert.equal(onArbiterDefeated(s).save.player.xp, s.player.xp, 'the Arbiter pays once')
  assert.ok(npcVisible('rook', 'chamber', s) && !npcVisible('rook', 'nova7', s))
  assert.deepEqual(talk('rook', s).choices?.map((c) => c.effect), ['trust_rook', 'doubt_rook'])
  s = applyEffect(s, 'trust_rook').save
  assert.equal(questStep(s, 'relay_spire'), 'report_vey')
  assert.ok(!npcVisible('rook', 'chamber', s) && npcVisible('rook', 'nova7', s), 'Rook goes home to Nova-7')
  assert.equal(talk('commander', s).effect, 'complete_q3')
  const credits = s.player.credits
  s = applyEffect(s, 'complete_q3').save
  assert.ok(s.world.flags.includes('chapter2_complete') && s.world.flags.includes('rook_trusted'))
  assert.ok(s.player.credits > credits)
  assert.equal(applyEffect(s, 'complete_q3').save.player.credits, s.player.credits, 'no second reward')
  assert.equal(currentObjective(s), null)
})

test("side quest: Moss's echo logs, in any order, rewarded once", () => {
  let s = applyEffect(onEnterArea(applyEffect(chapter1(), 'accept_q3').save, 'frontier').save, 'accept_logs').save
  assert.equal(questStep(s, 'echo_logs'), 'collect_logs')
  for (const id of ['f_log_1', 'f_log_2', 's1_log', 's2_log']) {
    s = grantOnce(s, 'collected', id, { items: { echo_log: 1 } }).save
    s = onLogPicked(s).save
  }
  assert.equal(s.inventory.items.echo_log, LOGS_NEEDED)
  assert.equal(questStep(s, 'echo_logs'), 'return_moss')
  s = applyEffect(s, 'complete_logs').save
  assert.equal(s.inventory.items.ion_scattergun, 1)
  assert.equal(s.inventory.items.echo_log, undefined)
  assert.equal(applyEffect(s, 'complete_logs').save.player.xp, s.player.xp, 'turning in twice gives nothing')
  // Logs found before talking to Moss count straight away.
  let early = applyEffect(chapter1(), 'accept_q3').save
  early = { ...early, inventory: addItem(early.inventory, 'echo_log', 4) }
  assert.equal(questStep(applyEffect(early, 'accept_logs').save, 'echo_logs'), 'return_moss')
})

test('saves: Chapter 2 state is validated like the rest', () => {
  const s = chapter1()
  const evil = { ...JSON.parse(CHAPTER1_SAVE), quests: { relay_spire: { step: 6 } }, world: { ...JSON.parse(CHAPTER1_SAVE).world, flags: ['arbiter_defeated'], collected: ['wall_frontier_7_9', 'wall_nowhere_1_1'] } }
  const fixed = sanitize(evil)
  assert.equal(fixed.quests.relay_spire, undefined, 'Chapter 2 needs Chapter 1 finished')
  assert.ok(fixed.world.defeated.includes('arbiter'), 'boss flag and reward mark agree')
  assert.deepEqual(fixed.world.collected, ['wall_frontier_7_9'])
  assert.equal(statsOf(s).maxHp, statsOf(fixed).maxHp)
  // Positions in the new areas are checked too.
  const lost = sanitize({ ...JSON.parse(CHAPTER1_SAVE), quests: JSON.parse(CHAPTER1_SAVE).quests, world: { ...JSON.parse(CHAPTER1_SAVE).world, area: 'chamber', x: 0, y: 0 } })
  assert.equal(lost.world.area, 'chamber')
  assert.ok(walkable(AREAS.chamber, Math.floor(lost.world.x / 16), Math.floor(lost.world.y / 16)))
})

test('combat: shields block from the front only; the Resonance Blade needs Spire alloy', () => {
  assert.ok(frontalBlock(0, 0.5))
  assert.ok(!frontalBlock(0, Math.PI))
  assert.ok(!frontalBlock(Math.PI / 2, -Math.PI / 2))
  assert.ok(frontalBlock(Math.PI, -Math.PI + 0.2), 'angles wrap around')
  const recipe = RECIPES.find((r) => r.id === 'resonance_blade')!
  let s = { ...chapter1(), player: { ...chapter1().player, credits: 999 } }
  s = { ...s, inventory: addItem(s.inventory, 'components', 20) }
  assert.equal(craft(s, 'resonance_blade'), null)
  s = { ...s, inventory: addItem(s.inventory, 'spire_alloy', recipe.alloy!) }
  const made = craft(s, 'resonance_blade')!
  assert.equal(made.inventory.items.resonance_blade, 1)
  assert.equal(made.inventory.items.spire_alloy, undefined)
  assert.equal(kindAt(AREAS.frontier, 7, 9), 'cracked')
})

test('texts: every dialogue, message and notice the code uses exists in both languages', async () => {
  const { readFileSync } = await import('node:fs')
  const { en } = await import('../locales/en.ts')
  const { fr } = await import('../locales/fr.ts')
  const get = (o: unknown, path: string) => path.split('.').reduce<unknown>((v, k) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined), o)
  const files = ['game/story.ts', 'engine/world.ts', 'engine/actors2.ts', 'engine/hud.ts'].map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'))
  const keys = new Set(files.flatMap((src) => [...src.matchAll(/'((?:dlg|msg|notice|hud)\.[A-Za-z0-9_.]+)'/g)].map((m) => m[1]!)))
  for (const area of Object.values(AREAS)) for (const p of area.pickups) if (p.item === 'echo_log') keys.add(`log.${p.id}`)
  assert.ok(keys.size > 40)
  for (const k of keys) for (const [lang, loc] of [['en', en], ['fr', fr]] as const) assert.ok(get(loc, k) !== undefined, `${lang}: ${k}`)
})

test('maps: arrival points sit at least two tiles from any exit (no bouncing straight back out)', () => {
  for (const area of Object.values(AREAS)) {
    const exits = Object.keys(area.exits).flatMap((c) => exitTiles(area, c).map((t) => t.split(',').map(Number) as [number, number]))
    for (const [name, e] of Object.entries(area.entries)) {
      const nearest = Math.min(...exits.map(([x, y]) => Math.abs(x - e.x) + Math.abs(y - e.y)))
      assert.ok(nearest >= 2, `${area.id}.${name} is ${nearest} tile(s) from an exit`)
    }
  }
})
