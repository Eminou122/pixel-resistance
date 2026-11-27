import { useGame } from './store.ts'

/** Tiny chiptune effects generated with the Web Audio API: no audio files, nothing to license. */
type Effect = 'click' | 'good' | 'ok' | 'bad' | 'coin' | 'level' | 'victory' | 'bump' | 'step'

const NOTES: Record<Effect, [freq: number, ms: number][]> = {
  click: [[660, 40]],
  step: [[220, 25]],
  bump: [[110, 70]],
  good: [[523, 70], [659, 70], [784, 120]],
  ok: [[523, 80], [587, 120]],
  bad: [[330, 90], [247, 160]],
  coin: [[988, 60], [1319, 140]],
  level: [[523, 80], [659, 80], [784, 80], [1047, 200]],
  victory: [[392, 120], [523, 120], [659, 120], [784, 120], [659, 100], [784, 320]],
}

let context: AudioContext | null = null

export function play(effect: Effect) {
  if (!useGame.getState().sound || typeof AudioContext === 'undefined') return
  try {
    context ??= new AudioContext()
    let at = context.currentTime
    for (const [freq, ms] of NOTES[effect]) {
      const osc = context.createOscillator()
      const gain = context.createGain()
      osc.type = effect === 'bump' || effect === 'step' ? 'triangle' : 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.04, at)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + ms / 1000)
      osc.connect(gain).connect(context.destination)
      osc.start(at)
      osc.stop(at + ms / 1000)
      at += ms / 1000
    }
  } catch {
    // Audio is a nicety: a browser refusing it must never break the game.
  }
}
