import assert from 'node:assert/strict'
import test from 'node:test'
import { ITEMS, MAX_LEVEL, QUESTS, RECIPES, XP_TABLE } from './data.ts'
import { AREAS, OVERLAY, SOLID, TILE, kindAt, reachable, walkable, type AreaDef } from './maps.ts'
import { SETTINGS_KEY, latestSlot, parseSave, parseSettings, readSlot, sanitize, writeSlot, type KeyValueStore } from './save.ts'
import {
  addItem, craft, damage, equip, grantOnce, levelForXp, newSave, removeItem, statsFor, statsOf, useItem, type SaveData,
} from './state.ts'
import { GUARD_IDS, applyEffect, arenaOpen, currentObjective, onDevice, onEnterArea, onGuardDefeated, onReachOutpost, onWardenDefeated, questStep, talk } from './story.ts'

const key = (p: { x: number; y: number }) => `${Math.floor(p.x)},${Math.floor(p.y)}`

test('maps: rows are rectangular and every tile is defined', () => {
  for (const area of Object.values(AREAS)) {
    const width = area.rows[0]!.length
    area.rows.forEach((row, y) => assert.equal(row.length, width, `${area.id} row ${y}`))
    for (const row of area.rows) for (const c of row) assert.ok(area.legend[c], `${area.id}: unknown tile "${c}"`)
  }
  for (const k of SOLID) assert.ok(OVERLAY.has(k))
})

test('maps: everything placed stands on open ground', () => {
  for (const area of Object.values(AREAS)) {
    const spots: [string, { x: number; y: number }][] = [
      ...Object.entries(area.entries),
      ...area.npcs.map((n) => [n.id, n] as [string, { x: number; y: number }]),
      ...area.pickups.map((p) => [p.id, p] as [string, { x: number; y: number }]),
      ...area.enemies.flatMap((e) => [[e.id, e], ...(e.patrol ? [[`${e.id} patrol`, { x: e.patrol[0], y: e.patrol[1] }]] : [])] as [string, { x: number; y: number }][]),
      // Pylons and terminals are machines standing on their own (solid) tile.
      ...area.interactables.filter((i) => i.kind !== 'pylon' && i.kind !== 'terminal').map((i) => [i.kind, i] as [string, { x: number; y: number }]),
    ]
    for (const [name, p] of spots) assert.ok(walkable(area, Math.floor(p.x), Math.floor(p.y)), `${area.id}: ${name} at ${key(p)}`)
  }
})

test('maps: Nova-7 exit and every Wilds pickup can be reached on foot', () => {
  const nova = AREAS.nova7
  const fromStart = reachable(nova, nova.entries.start!)
  assert.ok([...fromStart].some((k) => { const [x, y] = k.split(',').map(Number); return kindAt(nova, x!, y!) === 'exit' }))
  for (const n of nova.npcs) assert.ok(fromStart.has(key(n)), n.id)

  const wilds = AREAS.wilds
  const open = reachable(wilds, wilds.entries.nova7!)
  for (const p of wilds.pickups) assert.ok(open.has(key(p)), p.id)
  for (const e of wilds.enemies) assert.ok(open.has(key(e)), e.id)
  assert.ok(open.has('38,17'), 'transmission device')
  // The arena stays shut until its gate opens.
  assert.ok(!open.has(key(wilds.boss!)), 'arena must be sealed')
  const withGate = reachable(wilds, wilds.entries.nova7!, new Set(['gate']))
  assert.ok(withGate.has(key(wilds.boss!)) && withGate.has('23,33'))
})

test('maps: the hidden grove is only reachable through the fake thicket', () => {
  const wilds = AREAS.wilds
  const sealed: AreaDef = { ...wilds, rows: wilds.rows.map((r, y) => (y === 17 ? r.slice(0, 9) + 'h' + r.slice(10) : r)) }
  assert.equal(kindAt(wilds, 9, 17), 'fakethicket')
  assert.ok(!reachable(sealed, wilds.entries.nova7!).has('3,17'))
  assert.ok(reachable(wilds, wilds.entries.nova7!).has('3,17'))
})

test('stats: levels, equipment bonuses and damage', () => {
  assert.equal(levelForXp(0), 1)
  assert.equal(levelForXp(XP_TABLE[2]! - 1), 1)
  assert.equal(levelForXp(XP_TABLE[2]!), 2)
  assert.equal(levelForXp(1e9), MAX_LEVEL)
  const bare = statsFor(0, { melee: null, ranged: null, armor: null, module: null })
  const geared = statsFor(0, { melee: 'arc_blade', ranged: 'plasma_blaster', armor: 'warden_plating', module: 'signal_amplifier' })
  assert.equal(geared.attack - bare.attack, 9)
  assert.equal(geared.defense - bare.defense, 6)
  assert.equal(geared.maxHp - bare.maxHp, 20)
  assert.equal(geared.maxEnergy - bare.maxEnergy, 25)
  assert.equal(damage(10, 4), 8)
  assert.equal(damage(1, 50), 1)
})

test('inventory: stacking limits, equipping and consumables', () => {
  const s = newSave()
  let inv = addItem(s.inventory, 'healing_cell', 50)
  assert.equal(inv.items.healing_cell, ITEMS.healing_cell.max)
  assert.equal(equip(inv, 'arc_blade'), null, 'cannot equip what you do not own')
  inv = addItem(inv, 'arc_blade', 1)
  inv = equip(inv, 'arc_blade')!
  assert.equal(inv.equipped.melee, 'arc_blade')
  assert.equal(removeItem(inv, 'components', 1), null)
  assert.equal(removeItem(inv, 'arc_blade', 1)!.equipped.melee, null, 'losing an item unequips it')

  assert.equal(useItem(s, 'healing_cell'), null, 'healing at full health does nothing')
  const hurt: SaveData = { ...s, player: { ...s.player, hp: 10 } }
  const healed = useItem(hurt, 'healing_cell')!
  assert.equal(healed.player.hp, 55)
  assert.equal(healed.inventory.items.healing_cell, 1)
  const nearlyFull: SaveData = { ...s, player: { ...s.player, hp: statsOf(s).maxHp - 5 } }
  assert.equal(useItem(nearlyFull, 'healing_cell')!.player.hp, statsOf(s).maxHp)
})

test('rewards: an enemy or a pickup pays once, and levelling up heals', () => {
  const s: SaveData = { ...newSave(), player: { ...newSave().player, hp: 3, xp: XP_TABLE[2]! - 1 } }
  const first = grantOnce(s, 'defeated', 'drone_1', { xp: 15, credits: 6 })
  assert.ok(first.granted)
  assert.equal(first.levelUp, 2)
  assert.equal(first.save.player.hp, statsOf(first.save).maxHp)
  const again = grantOnce(first.save, 'defeated', 'drone_1', { xp: 15, credits: 6 })
  assert.ok(!again.granted)
  assert.equal(again.save.player.xp, first.save.player.xp)
  assert.equal(again.save.player.credits, first.save.player.credits)
})

test('crafting spends components and credits, and respects carry limits', () => {
  let s = newSave()
  assert.equal(craft(s, 'arc_blade'), null)
  s = { ...s, player: { ...s.player, credits: 500 }, inventory: addItem(s.inventory, 'components', 20) }
  const crafted = craft(s, 'arc_blade')!
  assert.equal(crafted.inventory.items.arc_blade, 1)
  assert.equal(crafted.inventory.items.components, 20 - RECIPES[0]!.components)
  assert.equal(crafted.player.credits, 500 - RECIPES[0]!.credits)
  assert.equal(craft(crafted, 'arc_blade'), null, 'only one Arc Blade')
})

test('story: the whole first chapter can be completed, and rewards are paid once', () => {
  let s = newSave()
  assert.equal(talk('commander', s).choices?.[0]?.effect, 'accept_q1')
  s = applyEffect(s, 'accept_q1').save
  assert.equal(questStep(s, 'lost_transmission'), 'leave_colony')
  s = onEnterArea(s, 'wilds').save
  s = onReachOutpost(s).save
  const found = onDevice(s)
  assert.equal(found.message, 'msg.deviceFound')
  s = found.save
  assert.equal(questStep(s, 'lost_transmission'), 'defeat_guards')
  for (const id of GUARD_IDS) {
    s = grantOnce(s, 'defeated', id, { xp: 10 }).save
    s = onGuardDefeated(s).save
  }
  assert.equal(s.inventory.items.transmission_device, 1)
  assert.equal(questStep(s, 'lost_transmission'), 'return_colony')
  assert.ok(!arenaOpen(s))
  const credits = s.player.credits
  s = applyEffect(s, 'complete_q1').save
  assert.equal(s.player.credits, credits + QUESTS.lost_transmission.reward.credits!)
  assert.ok(arenaOpen(s))
  assert.deepEqual(currentObjective(s), { quest: 'iron_warden', step: 'defeat_warden' })

  s = onWardenDefeated(s).save
  const xp = s.player.xp
  assert.equal(onWardenDefeated(s).save.player.xp, xp, 'the boss pays once')
  assert.equal(s.inventory.items.warden_plating, 1)
  assert.equal(questStep(s, 'iron_warden'), 'report_back')
  s = applyEffect(s, 'complete_q2').save
  assert.ok(s.world.flags.includes('chapter_complete'))
  assert.equal(currentObjective(s), null)
})

const memory = (): KeyValueStore & { data: Map<string, string> } => {
  const data = new Map<string, string>()
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) }
}

test('saves: round trip, empty, corrupt and outdated slots', () => {
  const kv = memory()
  const s = newSave(new Date('2026-01-01T00:00:00Z'))
  assert.ok(writeSlot(kv, 2, s))
  const back = readSlot(kv, 2)
  assert.equal(back.state, 'ok')
  assert.deepEqual(back.state === 'ok' && back.data, s)
  assert.equal(readSlot(kv, 1).state, 'empty')
  kv.setItem('echoes-of-the-last-signal:slot-1', '{oops')
  assert.equal(readSlot(kv, 1).state, 'corrupt')
  assert.equal(parseSave('[]').state, 'corrupt')
  assert.equal(parseSave(JSON.stringify({ ...s, version: 99 })).state, 'outdated')
  assert.equal(latestSlot(kv), 2)
})

test('saves: tampered data is repaired, never trusted', () => {
  const s = newSave()
  const evil = {
    ...s,
    player: { xp: -50, hp: 99999, energy: 'lots', credits: -10 },
    inventory: { items: { healing_cell: 500, rocket_launcher: 3, warden_plating: 0 }, equipped: { melee: 'warden_plating', armor: 'warden_plating', ranged: '<img>' } },
    quests: { iron_warden: { step: 1, done: false }, lost_transmission: { step: 99 } },
    world: { area: 'moon', x: 1, y: 1, defeated: ['drone_1', 'drone_1', 'ghost'], collected: ['w_amp', 42], flags: ['warden_defeated', 'god_mode'] },
  }
  const fixed = sanitize(evil as unknown as Record<string, unknown>)
  assert.equal(fixed.player.xp, 0)
  assert.equal(fixed.player.credits, 0)
  assert.equal(fixed.player.hp, statsOf(fixed).maxHp)
  assert.equal(fixed.player.energy, statsOf(fixed).maxEnergy)
  assert.equal(fixed.inventory.items.healing_cell, ITEMS.healing_cell.max)
  assert.ok(!('rocket_launcher' in fixed.inventory.items))
  assert.deepEqual(fixed.inventory.equipped, { melee: null, ranged: null, armor: null, module: null })
  assert.equal(fixed.quests.iron_warden, undefined, 'quest 2 needs quest 1 done')
  assert.equal(fixed.quests.lost_transmission?.step, QUESTS.lost_transmission.steps.length - 1)
  assert.equal(fixed.world.area, 'nova7')
  assert.deepEqual(fixed.world.defeated, ['drone_1', 'iron_warden'])
  assert.deepEqual(fixed.world.collected, ['w_amp'])
  assert.deepEqual(fixed.world.flags, ['warden_defeated'])
  // (1,1) px is inside the fence: the player is moved to a safe entry point.
  assert.ok(walkable(AREAS.nova7, Math.floor(fixed.world.x / TILE), Math.floor(fixed.world.y / TILE)))
})

test('settings: defaults and invalid values', () => {
  assert.deepEqual(parseSettings(null, true), { master: 80, music: 60, sfx: 80, muted: false, reducedMotion: true, touch: 'auto', lang: 'fr' })
  const s = parseSettings(JSON.stringify({ master: 500, music: -3, sfx: 'x', muted: true, touch: 'always', lang: 'en' }))
  assert.equal(s.master, 100)
  assert.equal(s.music, 0)
  assert.equal(s.sfx, 80)
  assert.equal(s.touch, 'auto')
  assert.equal(s.lang, 'en')
  assert.equal(parseSettings('{bad').lang, 'fr')
  assert.ok(SETTINGS_KEY)
})

test('texts: French and English match key for key, and every game id has a text', async () => {
  const { en } = await import('../locales/en.ts')
  const { fr } = await import('../locales/fr.ts')
  const { ITEM_IDS, QUEST_IDS, AREA_IDS } = await import('./data.ts')
  const shape = (v: unknown, path = ''): string[] =>
    Array.isArray(v) ? [`${path}[${v.length}]`] : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => shape(x, `${path}.${k}`)) : [path]
  assert.deepEqual(shape(fr), shape(en))
  for (const loc of [en, fr]) {
    for (const id of ITEM_IDS) assert.ok(loc.items[id].name && loc.items[id].desc, id)
    for (const q of QUEST_IDS) for (const step of QUESTS[q].steps) assert.ok((loc.quests[q].steps as Record<string, string>)[step], `${q}.${step}`)
    for (const a of AREA_IDS) assert.ok(loc.areas[a], a)
  }
})
