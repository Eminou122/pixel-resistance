// Quests, conversations and world events. Pure: every function takes a save and returns a new one plus messages to show.
import { ENEMIES, QUESTS, type ItemId, type NpcId, type QuestId } from './data.ts'
import { AREAS } from './maps.ts'
import { addItem, grant, grantOnce, hasFlag, setFlag, type SaveData } from './state.ts'

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

/** The objective to show on the HUD: the first unfinished quest's current step. */
export function currentObjective(s: SaveData): { quest: QuestId; step: string } | null {
  for (const q of ['iron_warden', 'lost_transmission'] as const) {
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

export type Effect = 'accept_q1' | 'complete_q1' | 'complete_q2' | 'open_bench'
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
    return { speaker: npc, text: 'dlg.commander.after' }
  }
  if (npc === 'juno')
    return {
      speaker: npc,
      text: questDone(s, 'lost_transmission') ? 'dlg.juno.later' : 'dlg.juno.hello',
      choices: [
        { label: 'dlg.openBench', effect: 'open_bench' },
        { label: 'dlg.bye', effect: null },
      ],
    }
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
    case 'open_bench':
      return { save: s, notices: [] }
  }
}

// ---------- World events ----------

export const onEnterArea = (s: SaveData, area: keyof typeof AREAS): Outcome =>
  area === 'wilds' ? advance(s, 'lost_transmission', 'leave_colony') : { save: s, notices: [] }

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

export const spireMessage = (s: SaveData) => (wardenDefeated(s) ? 'msg.spireOpen' : 'msg.spireLocked')
