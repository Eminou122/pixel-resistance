// Quests, conversations and world events. Pure: every function takes a save and returns a new one plus messages to show.
import { ENEMIES, LOGS_NEEDED, MAIN_QUESTS, PYLONS, QUESTS, type AreaId, type ItemId, type NpcId, type QuestId } from './data.ts'
import { AREAS, wallId, type TileKind } from './maps.ts'
import { addItem, clearFlag, count, grant, grantOnce, hasFlag, removeItem, setFlag, type SaveData } from './state.ts'

/** A message for the HUD: an i18n key and its values. */
export interface Notice {
  key: string
  params?: Record<string, string | number>
  kind?: 'quest' | 'item' | 'level' | 'info'
}
export interface Outcome {
  save: SaveData
  notices: Notice[]
}

export const questStep = (s: SaveData, q: QuestId): string | null => {
  const st = s.quests[q]
  return !st || st.done ? null : (QUESTS[q].steps[st.step] ?? null)
}
export const questDone = (s: SaveData, q: QuestId) => s.quests[q]?.done === true

/** The objective to show on the HUD: the latest unfinished main quest's current step. */
export function currentObjective(s: SaveData): { quest: QuestId; step: string } | null {
  for (const q of [...MAIN_QUESTS].reverse()) {
    const step = questStep(s, q)
    if (step) return { quest: q, step }
  }
  return null
}

function levelNotice(levelUp: number | null): Notice[] {
  return levelUp ? [{ key: 'notice.levelUp', params: { level: levelUp }, kind: 'level' }] : []
}

export function startQuest(s: SaveData, q: QuestId): Outcome {
  if (s.quests[q]) return { save: s, notices: [] }
  return {
    save: { ...s, quests: { ...s.quests, [q]: { step: 0, done: false } } },
    notices: [{ key: 'notice.questStarted', params: { quest: q }, kind: 'quest' }],
  }
}

/** Completes `step` if it is the quest's current step. Finishing the last step completes the quest and pays its reward. */
export function advance(s: SaveData, q: QuestId, step: string): Outcome {
  if (questStep(s, q) !== step) return { save: s, notices: [] }
  const st = s.quests[q]!
  const last = st.step >= QUESTS[q].steps.length - 1
  const save: SaveData = { ...s, quests: { ...s.quests, [q]: last ? { step: st.step, done: true } : { step: st.step + 1, done: false } } }
  if (!last) return { save, notices: [{ key: 'notice.objective', params: { quest: q, step: QUESTS[q].steps[st.step + 1]! }, kind: 'quest' }] }
  const paid = grant(save, QUESTS[q].reward)
  return { save: paid.save, notices: [{ key: 'notice.questDone', params: { quest: q }, kind: 'quest' }, ...levelNotice(paid.levelUp)] }
}

const chain = (s: SaveData, ...steps: ((s: SaveData) => Outcome)[]): Outcome =>
  steps.reduce<Outcome>((acc, f) => {
    const next = f(acc.save)
    return { save: next.save, notices: [...acc.notices, ...next.notices] }
  }, { save: s, notices: [] })

// ---------- Conversations ----------

export type Effect =
  | 'accept_q1' | 'complete_q1' | 'complete_q2' | 'open_bench'
  | 'accept_q3' | 'complete_q3' | 'trust_rook' | 'doubt_rook' | 'accept_logs' | 'complete_logs'
  | 'go_frontier' | 'beacon_nova7' | 'beacon_frontier'

/** Effects that move Kael to another area: the store handles them by rebuilding the world there. */
export const TRAVEL: Partial<Record<Effect, { area: AreaId; entry: string }>> = {
  go_frontier: { area: 'frontier', entry: 'wilds' },
  beacon_nova7: { area: 'nova7', entry: 'beacon' },
  beacon_frontier: { area: 'frontier', entry: 'beacon' },
}

export interface Script {
  speaker: NpcId | 'archive'
  /** i18n key of an array of lines. */
  text: string
  choices?: { label: string; effect: Effect | null }[]
  /** Applied when the last line is read. */
  effect?: Effect
}

export function talk(npc: NpcId, s: SaveData): Script {
  if (npc === 'commander') {
    if (!s.quests.lost_transmission)
      return {
        speaker: npc,
        text: 'dlg.commander.intro',
        choices: [
          { label: 'dlg.accept', effect: 'accept_q1' },
          { label: 'dlg.later', effect: null },
        ],
      }
    const q1 = questStep(s, 'lost_transmission')
    if (q1 === 'return_colony') return { speaker: npc, text: 'dlg.commander.report', effect: 'complete_q1' }
    if (q1) return { speaker: npc, text: 'dlg.commander.waiting' }
    const q2 = questStep(s, 'iron_warden')
    if (q2 === 'report_back') return { speaker: npc, text: 'dlg.commander.victory', effect: 'complete_q2' }
    if (q2) return { speaker: npc, text: 'dlg.commander.warden' }
    if (!s.quests.relay_spire)
      return {
        speaker: npc,
        text: 'dlg.commander.ch2',
        choices: [
          { label: 'dlg.acceptSpire', effect: 'accept_q3' },
          { label: 'dlg.later', effect: null },
        ],
      }
    const q3 = questStep(s, 'relay_spire')
    if (q3 === 'report_vey') return { speaker: npc, text: 'dlg.commander.ch2end', effect: 'complete_q3' }
    if (q3) return { speaker: npc, text: 'dlg.commander.ch2wait' }
    return { speaker: npc, text: 'dlg.commander.after2' }
  }
  if (npc === 'juno')
    return {
      speaker: npc,
      text: s.quests.relay_spire ? 'dlg.juno.alloy' : questDone(s, 'lost_transmission') ? 'dlg.juno.later' : 'dlg.juno.hello',
      choices: [
        { label: 'dlg.openBench', effect: 'open_bench' },
        { label: 'dlg.bye', effect: null },
      ],
    }
  if (npc === 'rook') {
    const step = questStep(s, 'relay_spire')
    if (step === 'free_rook')
      return {
        speaker: npc,
        text: 'dlg.rook.meet',
        choices: [
          { label: 'dlg.trust', effect: 'trust_rook' },
          { label: 'dlg.doubt', effect: 'doubt_rook' },
        ],
      }
    if (step === 'report_vey') return { speaker: npc, text: 'dlg.rook.colony' }
    return { speaker: npc, text: hasFlag(s, 'rook_trusted') ? 'dlg.rook.afterTrust' : 'dlg.rook.afterDoubt' }
  }
  if (npc === 'moss') {
    if (!s.quests.echo_logs)
      return {
        speaker: npc,
        text: 'dlg.moss.intro',
        choices: [
          { label: 'dlg.acceptLogs', effect: 'accept_logs' },
          { label: 'dlg.later', effect: null },
        ],
      }
    const step = questStep(s, 'echo_logs')
    if (step === 'return_moss') return { speaker: npc, text: 'dlg.moss.thanks', effect: 'complete_logs' }
    if (step) return { speaker: npc, text: 'dlg.moss.waiting' }
    return { speaker: npc, text: 'dlg.moss.after' }
  }
  if (hasFlag(s, 'chapter2_complete')) return { speaker: npc, text: 'dlg.tamsin.ch2end' }
  if (s.quests.relay_spire) return { speaker: npc, text: 'dlg.tamsin.frontier' }
  if (hasFlag(s, 'chapter_complete')) return { speaker: npc, text: 'dlg.tamsin.after' }
  return { speaker: npc, text: questDone(s, 'lost_transmission') ? 'dlg.tamsin.spire' : 'dlg.tamsin.lore' }
}

export function applyEffect(s: SaveData, effect: Effect): Outcome {
  switch (effect) {
    case 'accept_q1':
      return startQuest(s, 'lost_transmission')
    case 'complete_q1':
      return chain(s, (x) => advance(x, 'lost_transmission', 'return_colony'), (x) => startQuest(x, 'iron_warden'))
    case 'complete_q2': {
      const done = advance(s, 'iron_warden', 'report_back')
      return { save: setFlag(done.save, 'chapter_complete'), notices: [...done.notices, { key: 'notice.chapter', kind: 'quest' }] }
    }
    case 'accept_q3':
      return startQuest(s, 'relay_spire')
    case 'complete_q3': {
      const done = advance(s, 'relay_spire', 'report_vey')
      return { save: setFlag(done.save, 'chapter2_complete'), notices: [...done.notices, { key: 'notice.chapter2', kind: 'quest' }] }
    }
    case 'trust_rook':
    case 'doubt_rook':
      return advance(setFlag(s, effect === 'trust_rook' ? 'rook_trusted' : 'rook_doubted'), 'relay_spire', 'free_rook')
    case 'accept_logs':
      return chain(s, (x) => startQuest(x, 'echo_logs'), onLogPicked)
    case 'complete_logs': {
      const inv = removeItem(s.inventory, 'echo_log', LOGS_NEEDED)
      if (!inv || questStep(s, 'echo_logs') !== 'return_moss') return { save: s, notices: [] }
      const done = advance({ ...s, inventory: inv }, 'echo_logs', 'return_moss')
      return { save: done.save, notices: [...done.notices, { key: 'notice.item', params: { item: 'ion_scattergun', amount: 1 }, kind: 'item' }] }
    }
    case 'open_bench':
    case 'go_frontier':
    case 'beacon_nova7':
    case 'beacon_frontier':
      return { save: s, notices: [] }
  }
}

// ---------- World events: Chapter 1 ----------

export function onEnterArea(s: SaveData, area: AreaId): Outcome {
  if (area === 'wilds') return advance(s, 'lost_transmission', 'leave_colony')
  if (area === 'frontier') return advance(s, 'relay_spire', 'enter_frontier')
  if (area === 'spire1') return advance(s, 'relay_spire', 'enter_spire')
  if (area === 'chamber') return advance(s, 'relay_spire', 'reach_chamber')
  return { save: s, notices: [] }
}

export const onReachOutpost = (s: SaveData): Outcome => advance(s, 'lost_transmission', 'explore_wilds')

export const GUARD_IDS = AREAS.wilds.enemies.filter((e) => e.guard).map((e) => e.id)
export const guardsAwake = (s: SaveData) => hasFlag(s, 'guards_awake')
export const guardsCleared = (s: SaveData) => GUARD_IDS.every((id) => s.world.defeated.includes(id))

/** The player examines the transmission device. Returns the message to show. */
export function onDevice(s: SaveData): Outcome & { message: string } {
  if (questStep(s, 'lost_transmission') === 'explore_wilds') s = onReachOutpost(s).save
  const step = questStep(s, 'lost_transmission')
  if (step === 'find_device') {
    const out = advance(setFlag(s, 'guards_awake'), 'lost_transmission', 'find_device')
    return { ...out, message: 'msg.deviceFound' }
  }
  if (step === 'defeat_guards') return { save: s, notices: [], message: 'msg.deviceShielded' }
  if (s.inventory.items.transmission_device) return { save: s, notices: [], message: 'msg.deviceTaken' }
  return { save: s, notices: [], message: 'msg.deviceIdle' }
}

/** Called after each guard falls: once all are down, the device's shield drops and the player takes it. */
export function onGuardDefeated(s: SaveData): Outcome {
  if (!guardsCleared(s) || questStep(s, 'lost_transmission') !== 'defeat_guards') return { save: s, notices: [] }
  const out = advance({ ...s, inventory: addItem(s.inventory, 'transmission_device', 1) }, 'lost_transmission', 'defeat_guards')
  return { save: out.save, notices: [{ key: 'notice.item', params: { item: 'transmission_device', amount: 1 }, kind: 'item' }, ...out.notices] }
}

export const arenaOpen = (s: SaveData) => s.quests.iron_warden !== undefined
export const wardenDefeated = (s: SaveData) => hasFlag(s, 'warden_defeated')

export const WARDEN_DROPS: Partial<Record<ItemId, number>> = { warden_plating: 1, components: 5 }

export function onWardenDefeated(s: SaveData): Outcome {
  const paid = grantOnce(s, 'defeated', 'iron_warden', { xp: ENEMIES.warden.xp, credits: ENEMIES.warden.credits, items: WARDEN_DROPS })
  if (!paid.granted) return { save: s, notices: [] }
  const q = advance(setFlag(paid.save, 'warden_defeated'), 'iron_warden', 'defeat_warden')
  return {
    save: q.save,
    notices: [
      { key: 'notice.boss', kind: 'quest' },
      { key: 'notice.item', params: { item: 'warden_plating', amount: 1 }, kind: 'item' },
      ...levelNotice(paid.levelUp),
      ...q.notices,
    ],
  }
}

/** The great door behind the Warden's arena: sealed, then the way to the Ashen Frontier. */
export function spireGate(s: SaveData): Script {
  if (!wardenDefeated(s)) return { speaker: 'archive', text: 'msg.spireLocked' }
  if (!s.quests.relay_spire) return { speaker: 'archive', text: 'msg.spireWaiting' }
  return {
    speaker: 'archive',
    text: 'msg.spireOpen',
    choices: [
      { label: 'dlg.goFrontier', effect: 'go_frontier' },
      { label: 'dlg.stay', effect: null },
    ],
  }
}

// ---------- World events: Chapter 2 ----------

export const powerRestored = (s: SaveData) => PYLONS.every((f) => hasFlag(s, f))

/** Kael switches a pylon on. The three together power the Spire's blast door. */
export function onPylon(s: SaveData, id: string): Outcome & { message: string } {
  const flag = PYLONS.find((f) => f === id)
  if (!flag) return { save: s, notices: [], message: 'msg.pylonOn' }
  if (hasFlag(s, flag)) return { save: s, notices: [], message: 'msg.pylonOn' }
  const lit = setFlag(s, flag)
  const on = PYLONS.filter((f) => hasFlag(lit, f)).length
  if (on < PYLONS.length)
    return { save: lit, notices: [{ key: 'notice.pylon', params: { on, total: PYLONS.length }, kind: 'info' }], message: 'msg.pylonActivated' }
  const out = advance(lit, 'relay_spire', 'restore_power')
  return { save: out.save, notices: [{ key: 'notice.power', kind: 'info' }, ...out.notices], message: 'msg.powerRestored' }
}

/** A Spire terminal sends the power to the other set of barriers. */
export function onTerminal(s: SaveData): Outcome & { message: string } {
  const toB = !hasFlag(s, 'barrier_b')
  return { save: toB ? setFlag(s, 'barrier_b') : clearFlag(s, 'barrier_b'), notices: [], message: toB ? 'msg.terminalB' : 'msg.terminalA' }
}

export const onKeycard = (s: SaveData): Outcome => advance(s, 'relay_spire', 'find_keycard')

export function onLogPicked(s: SaveData): Outcome {
  if (questStep(s, 'echo_logs') !== 'collect_logs' || count(s.inventory, 'echo_log') < LOGS_NEEDED) return { save: s, notices: [] }
  return advance(s, 'echo_logs', 'collect_logs')
}

/** Is this door (or barrier, or breakable wall) open in this save? */
export function doorOpen(kind: TileKind, s: SaveData, area: AreaId, x: number, y: number): boolean {
  switch (kind) {
    case 'gate':
      return arenaOpen(s)
    case 'blastdoor':
      return powerRestored(s)
    case 'barrierA':
      return !hasFlag(s, 'barrier_b')
    case 'barrierB':
      return hasFlag(s, 'barrier_b')
    case 'keydoor':
      return count(s.inventory, 'spire_keycard') > 0
    case 'cracked':
      return s.world.collected.includes(wallId(area, x, y))
    default:
      return true
  }
}

export const arbiterDefeated = (s: SaveData) => hasFlag(s, 'arbiter_defeated')
export const ARBITER_DROPS: Partial<Record<ItemId, number>> = { phase_core: 1, spire_alloy: 3 }

export function onArbiterDefeated(s: SaveData): Outcome {
  const paid = grantOnce(s, 'defeated', 'arbiter', { xp: ENEMIES.arbiter.xp, credits: ENEMIES.arbiter.credits, items: ARBITER_DROPS })
  if (!paid.granted) return { save: s, notices: [] }
  const q = advance(setFlag(paid.save, 'arbiter_defeated'), 'relay_spire', 'defeat_arbiter')
  return {
    save: q.save,
    notices: [
      { key: 'notice.arbiter', kind: 'quest' },
      { key: 'notice.item', params: { item: 'phase_core', amount: 1 }, kind: 'item' },
      ...levelNotice(paid.levelUp),
      ...q.notices,
    ],
  }
}

/** Who is where: Rook waits in the Signal Chamber once freed, then comes home to Nova-7. */
export function npcVisible(id: NpcId, area: AreaId, s: SaveData): boolean {
  if (id !== 'rook') return true
  const step = questStep(s, 'relay_spire')
  if (area === 'chamber') return arbiterDefeated(s) && step === 'free_rook'
  return step === 'report_vey' || questDone(s, 'relay_spire')
}

/** The transit beacon in Nova-7 only works once Kael has reached the Frontier. */
export const beaconVisible = (area: AreaId, s: SaveData) =>
  area !== 'nova7' || questDone(s, 'relay_spire') || (s.quests.relay_spire !== undefined && questStep(s, 'relay_spire') !== 'enter_frontier')

export function beaconScript(area: AreaId): Script {
  return {
    speaker: 'archive',
    text: 'msg.beacon',
    choices: [
      area === 'nova7' ? { label: 'dlg.toFrontier', effect: 'beacon_frontier' } : { label: 'dlg.toNova7', effect: 'beacon_nova7' },
      { label: 'dlg.stay', effect: null },
    ],
  }
}
