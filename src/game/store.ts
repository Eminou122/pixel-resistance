import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AchievementId, MissionId, Quality } from './content.ts'
import {
  SAVE_VERSION,
  awardAchievements,
  coins,
  emptyProgress,
  level,
  recordMission,
  sanitize,
  xp,
  type Progress,
  type Reward,
} from './progress.ts'

export type Toast = { key: number } & ({ kind: 'achievement'; id: AchievementId } | { kind: 'level'; level: number })

interface GameState {
  progress: Progress
  sound: boolean
  toasts: Toast[]
  newGame: () => void
  seeIntro: () => void
  completeMission: (id: MissionId, answers: Quality[]) => Reward
  discover: (list: 'enemies' | 'modules' | 'locations' | 'npcs', id: string) => void
  spend: (amount: number) => boolean
  reset: () => void
  toggleSound: () => void
  dismissToast: (key: number) => void
}

let toastKey = 0

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      /** Applies a progress change, awards achievements and queues celebrations. */
      const commit = (next: Progress) => {
        const before = level(xp(get().progress)).level
        const { progress, unlocked } = awardAchievements(next)
        const after = level(xp(progress)).level
        const toasts: Toast[] = unlocked.map((id) => ({ key: ++toastKey, kind: 'achievement', id }))
        if (after > before) toasts.push({ key: ++toastKey, kind: 'level', level: after })
        set((state) => ({ progress, toasts: [...state.toasts, ...toasts] }))
      }

      return {
        progress: emptyProgress(),
        sound: true,
        toasts: [],
        newGame: () => set({ progress: { ...emptyProgress(), started: true }, toasts: [] }),
        seeIntro: () => set((s) => ({ progress: { ...s.progress, introSeen: true } })),
        completeMission: (id, answers) => {
          const { progress, reward } = recordMission({ ...get().progress, started: true }, id, answers)
          const before = get().progress
          commit(progress)
          // Achievement coins count as part of this mission's reward.
          return { ...reward, coins: coins(get().progress) - coins(before) }
        },
        discover: (list, id) => {
          const p = get().progress
          if (p[list].includes(id)) return
          commit({ ...p, started: true, [list]: [...p[list], id] })
        },
        spend: (amount) => {
          const p = get().progress
          if (coins(p) < amount) return false
          set({ progress: { ...p, coinsSpent: p.coinsSpent + amount } })
          return true
        },
        reset: () => set({ progress: emptyProgress(), toasts: [] }),
        toggleSound: () => set((s) => ({ sound: !s.sound })),
        dismissToast: (key) => set((s) => ({ toasts: s.toasts.filter((t) => t.key !== key) })),
      }
    },
    {
      name: 'pixel-resistance-save',
      version: SAVE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ progress: s.progress, sound: s.sound }),
      // Older or foreign saves are not trusted: they go through the same sanitizer.
      migrate: (saved) => saved as GameState,
      merge: (saved, current) => {
        const s = (saved ?? {}) as Partial<GameState>
        return { ...current, progress: sanitize(s.progress), sound: s.sound !== false }
      },
    },
  ),
)

export const hasSave = (p: Progress) => p.started || Object.keys(p.missions).length > 0
