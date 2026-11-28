// Shared state between Phaser (gameplay) and React (menus). Rules live in state.ts / story.ts; this file wires them up.
import { create } from 'zustand'
import type { AreaId, ItemId, Recipe, Slot } from './data.ts'
import { AREAS, TILE } from './maps.ts'
import {
  SETTINGS_KEY, browserStore, deleteSlot, parseSettings, readSlot, writeSlot, type Settings,
} from './save.ts'
import { craft, equip, newSave, unequip, useItem, type SaveData } from './state.ts'
import { TRAVEL, applyEffect, type Notice, type Outcome, type Script } from './story.ts'

export type Panel = 'inventory' | 'character' | 'journal' | 'settings' | 'bench' | null

/** Written every frame by the engine; read when saving. Not reactive on purpose (no re-render per frame). */
export const live = { x: 0, y: 0, playTime: 0 }

interface GameStore {
  screen: 'title' | 'game'
  slot: number | null
  save: SaveData
  ui: { paused: boolean; panel: Panel; dialogue: Script | null; gameOver: boolean }
  settings: Settings
  notices: (Notice & { id: number })[]
  boss: { hp: number; max: number; name?: 'warden' | 'arbiter' } | null
  canInteract: boolean
  /** Bumped to make the world scene rebuild itself from `save` (new game, load, retry). */
  epoch: number
  saveError: boolean

  newGame(slot: number): void
  loadSlot(slot: number): boolean
  deleteSlot(slot: number): void
  saveNow(): boolean
  retry(): void
  quitToTitle(): void
  /** Moves Kael to another area (a checkpoint: the game saves on arrival). */
  travel(area: AreaId, entry: string): void

  update(f: (s: SaveData) => SaveData): void
  apply(o: Outcome, autosave?: boolean): void
  notify(...n: Notice[]): void
  dismissNotice(id: number): void

  openDialogue(s: Script): void
  closeDialogue(effect?: Script['effect'] | null): void
  openPanel(p: Panel): void
  closePanel(): void
  togglePause(): void
  setGameOver(v: boolean): void
  setBoss(b: GameStore['boss']): void
  setCanInteract(v: boolean): void

  useItem(id: ItemId): boolean
  equip(id: ItemId): void
  unequip(slot: Slot): void
  craft(id: Recipe['id']): boolean

  setSettings(patch: Partial<Settings>): void
}

const kv = browserStore()
const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
let noticeId = 0

const loadSettings = (): Settings => {
  try {
    return parseSettings(kv?.getItem(SETTINGS_KEY) ?? null, prefersReduced)
  } catch {
    return parseSettings(null, prefersReduced)
  }
}

const closedUi = { paused: false, panel: null, dialogue: null, gameOver: false } as const

export const useGame = create<GameStore>()((set, get) => {
  const enter = (slot: number, save: SaveData, dialogue: Script | null = null) => {
    live.x = save.world.x
    live.y = save.world.y
    live.playTime = save.playTime
    set((st) => ({ screen: 'game', slot, save, ui: { ...closedUi, dialogue }, notices: [], boss: null, epoch: st.epoch + 1, saveError: false }))
  }

  return {
    screen: 'title',
    slot: null,
    save: newSave(),
    ui: { ...closedUi },
    settings: loadSettings(),
    notices: [],
    boss: null,
    canInteract: false,
    epoch: 0,
    saveError: false,

    newGame(slot) {
      const save = newSave()
      save.world.flags = ['intro_seen']
      writeSlot(kv, slot, save)
      enter(slot, save, { speaker: 'archive', text: 'dlg.archive.intro' })
    },
    loadSlot(slot) {
      const s = readSlot(kv, slot)
      if (s.state !== 'ok') return false
      enter(slot, s.data)
      return true
    },
    deleteSlot(slot) {
      deleteSlot(kv, slot)
    },
    saveNow() {
      const { slot, save } = get()
      if (slot === null) return false
      const data: SaveData = { ...save, savedAt: new Date().toISOString(), playTime: Math.floor(live.playTime), world: { ...save.world, x: live.x, y: live.y } }
      const ok = writeSlot(kv, slot, data)
      set({ save: data, saveError: !ok })
      return ok
    },
    retry() {
      const { slot } = get()
      if (slot === null || !get().loadSlot(slot)) get().quitToTitle()
    },
    quitToTitle() {
      set({ screen: 'title', ui: { ...closedUi }, boss: null, notices: [] })
    },
    travel(area, entry) {
      const e = AREAS[area].entries[entry] ?? Object.values(AREAS[area].entries)[0]!
      live.x = (e.x + 0.5) * TILE
      live.y = (e.y + 0.5) * TILE
      set((st) => ({ save: { ...st.save, world: { ...st.save.world, area, x: live.x, y: live.y } }, boss: null }))
      get().saveNow()
      set((st) => ({ epoch: st.epoch + 1 }))
    },

    update(f) {
      set((st) => ({ save: f(st.save) }))
    },
    apply(o, autosave = true) {
      set((st) => ({ save: o.save, notices: [...st.notices, ...o.notices.map((n) => ({ ...n, id: ++noticeId }))] }))
      if (autosave && o.notices.some((n) => n.kind === 'quest')) get().saveNow()
    },
    notify(...n) {
      set((st) => ({ notices: [...st.notices, ...n.map((x) => ({ ...x, id: ++noticeId }))] }))
    },
    dismissNotice(id) {
      set((st) => ({ notices: st.notices.filter((n) => n.id !== id) }))
    },

    openDialogue(script) {
      set((st) => ({ ui: { ...st.ui, dialogue: script } }))
    },
    closeDialogue(effect) {
      set((st) => ({ ui: { ...st.ui, dialogue: null } }))
      if (!effect) return
      if (effect === 'open_bench') return get().openPanel('bench')
      const trip = TRAVEL[effect]
      if (trip) return get().travel(trip.area, trip.entry)
      get().apply(applyEffect(get().save, effect))
    },
    openPanel(panel) {
      set((st) => ({ ui: { ...st.ui, panel, paused: panel !== 'bench' ? true : st.ui.paused } }))
    },
    closePanel() {
      set((st) => ({ ui: { ...st.ui, panel: null, paused: st.ui.panel === 'bench' ? false : st.ui.paused } }))
    },
    togglePause() {
      set((st) => (st.ui.paused ? { ui: { ...st.ui, paused: false, panel: null } } : { ui: { ...st.ui, paused: true } }))
    },
    setGameOver(v) {
      set((st) => ({ ui: { ...st.ui, gameOver: v, dialogue: null, panel: null, paused: false } }))
    },
    setBoss(boss) {
      set({ boss })
    },
    setCanInteract(v) {
      if (get().canInteract !== v) set({ canInteract: v })
    },

    useItem(id) {
      const next = useItem(get().save, id)
      if (!next) return false
      set({ save: next })
      return true
    },
    equip(id) {
      const inv = equip(get().save.inventory, id)
      if (inv) set((st) => ({ save: { ...st.save, inventory: inv } }))
    },
    unequip(slot) {
      set((st) => ({ save: { ...st.save, inventory: unequip(st.save.inventory, slot) } }))
    },
    craft(id) {
      const next = craft(get().save, id)
      if (!next) return false
      set({ save: next })
      get().notify({ key: 'notice.item', params: { item: id, amount: 1 }, kind: 'item' })
      get().saveNow()
      return true
    },

    setSettings(patch) {
      const settings = { ...get().settings, ...patch }
      set({ settings })
      try {
        kv?.setItem(SETTINGS_KEY, JSON.stringify(settings))
      } catch {
        // Settings still apply for this visit.
      }
    },
  }
})

/** True while a menu, conversation or the defeat screen should freeze gameplay. */
export const isBlocked = (s: Pick<GameStore, 'ui'>) => s.ui.paused || s.ui.panel !== null || s.ui.dialogue !== null || s.ui.gameOver

export { readSlot, kv as saveStore }
