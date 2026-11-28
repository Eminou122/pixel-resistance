// Original chiptune sound effects and music, synthesised live with the Web Audio API (no audio files).

export type Sfx =
  | 'ui' | 'confirm' | 'slash' | 'hit' | 'blaster' | 'zap' | 'hurt' | 'dash' | 'pickup' | 'heal' | 'level' | 'quest'
  | 'explode' | 'charge' | 'laser' | 'missile' | 'empty' | 'death' | 'door'
export type Track = 'title' | 'colony' | 'wilds' | 'boss' | 'frontier' | 'spire' | 'chamber' | 'arbiter'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicBus: GainNode | null = null
let sfxBus: GainNode | null = null
let noise: AudioBuffer | null = null
const volumes = { master: 0.8, music: 0.6, sfx: 0.8, muted: false }

/** Must run from a user gesture (browsers block audio until then). */
export function unlockAudio() {
  try {
    if (!ctx) {
      ctx = new AudioContext()
      master = ctx.createGain()
      musicBus = ctx.createGain()
      sfxBus = ctx.createGain()
      musicBus.connect(master)
      sfxBus.connect(master)
      master.connect(ctx.destination)
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
      const data = noise.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      applyVolumes()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    // Music requested before the first gesture starts now.
    if (current && timer === null) {
      const track = current
      current = null
      playMusic(track)
    }
  } catch {
    ctx = null
  }
}

function applyVolumes() {
  if (!ctx || !master || !musicBus || !sfxBus) return
  const t = ctx.currentTime
  master.gain.setTargetAtTime(volumes.muted ? 0 : volumes.master * 0.5, t, 0.02)
  musicBus.gain.setTargetAtTime(volumes.music * 0.35, t, 0.02)
  sfxBus.gain.setTargetAtTime(volumes.sfx, t, 0.02)
}

export function setVolumes(v: { master: number; music: number; sfx: number; muted: boolean }) {
  volumes.master = v.master / 100
  volumes.music = v.music / 100
  volumes.sfx = v.sfx / 100
  volumes.muted = v.muted
  applyVolumes()
}

function tone(bus: GainNode, type: OscillatorType, from: number, to: number, dur: number, vol: number, at = 0) {
  if (!ctx) return
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(bus)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function hiss(bus: GainNode, dur: number, vol: number, filter = 1200, at = 0) {
  if (!ctx || !noise) return
  const t = ctx.currentTime + at
  const src = ctx.createBufferSource()
  src.buffer = noise
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(filter, t)
  f.frequency.exponentialRampToValueAtTime(80, t + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(bus)
  src.start(t)
  src.stop(t + dur + 0.02)
}

export function sfx(name: Sfx) {
  if (!ctx || !sfxBus || volumes.muted) return
  const b = sfxBus
  switch (name) {
    case 'ui': return tone(b, 'square', 660, 660, 0.05, 0.08)
    case 'confirm': return (tone(b, 'square', 520, 520, 0.06, 0.08), tone(b, 'square', 780, 780, 0.08, 0.08, 0.06))
    case 'slash': return (hiss(b, 0.12, 0.25, 4000), tone(b, 'sawtooth', 900, 300, 0.1, 0.06))
    case 'hit': return (tone(b, 'square', 220, 80, 0.1, 0.15), hiss(b, 0.08, 0.2, 2500))
    case 'blaster': return tone(b, 'square', 1200, 300, 0.14, 0.08)
    case 'zap': return tone(b, 'sawtooth', 500, 900, 0.12, 0.06)
    case 'hurt': return (tone(b, 'square', 300, 90, 0.2, 0.15), hiss(b, 0.15, 0.2, 1500))
    case 'dash': return hiss(b, 0.18, 0.25, 3000)
    case 'pickup': return (tone(b, 'triangle', 880, 880, 0.06, 0.15), tone(b, 'triangle', 1320, 1320, 0.1, 0.15, 0.06))
    case 'heal': return [523, 659, 784].forEach((f, i) => tone(b, 'triangle', f, f, 0.12, 0.14, i * 0.07))
    case 'level': return [523, 659, 784, 1047].forEach((f, i) => tone(b, 'square', f, f, 0.14, 0.09, i * 0.09))
    case 'quest': return [392, 523, 659].forEach((f, i) => tone(b, 'triangle', f, f, 0.2, 0.15, i * 0.12))
    case 'explode': return (hiss(b, 0.6, 0.45, 900), tone(b, 'square', 120, 40, 0.4, 0.15))
    case 'charge': return tone(b, 'sawtooth', 80, 400, 0.6, 0.07)
    case 'laser': return (tone(b, 'sawtooth', 1400, 1100, 1.2, 0.05), tone(b, 'square', 70, 70, 1.2, 0.05))
    case 'missile': return (tone(b, 'square', 600, 200, 0.25, 0.06), hiss(b, 0.3, 0.12, 2000))
    case 'empty': return tone(b, 'square', 140, 140, 0.08, 0.08)
    case 'death': return [392, 330, 262, 196].forEach((f, i) => tone(b, 'triangle', f, f * 0.98, 0.3, 0.15, i * 0.22))
    case 'door': return (tone(b, 'sawtooth', 200, 90, 0.4, 0.08), hiss(b, 0.4, 0.1, 600))
  }
}

// ---------- Music: a small step sequencer playing original loops ----------

interface Song {
  bpm: number
  /** Semitones from A3 (220 Hz); null is a rest. One entry per 8th note. */
  lead: (number | null)[]
  bass: (number | null)[]
  leadWave: OscillatorType
  drums?: boolean
}

const SONGS: Record<Track, Song> = {
  // Chapter 2. Original loops, like the rest.
  frontier: {
    // Slow and dusty: a dead town under a red sky.
    bpm: 88,
    leadWave: 'triangle',
    drums: true,
    lead: [7, null, null, 10, null, 7, 5, null, 3, null, null, 5, null, null, null, null, 7, null, null, 10, null, 12, 10, null, 8, null, 7, null, 5, null, null, null],
    bass: [-12, null, -12, null, -12, null, -12, null, -9, null, -9, null, -9, null, -9, null, -7, null, -7, null, -7, null, -7, null, -14, null, -14, null, -14, null, -14, null],
  },
  spire: {
    // Cold, regular, mechanical: the inside of OVERLORD's machine.
    bpm: 104,
    leadWave: 'square',
    lead: [12, 19, 24, 19, 12, 19, 24, 19, 11, 18, 23, 18, 11, 18, 23, 18, 10, 17, 22, 17, 10, 17, 22, 17, 11, 18, 23, 18, 13, 20, 25, 20],
    bass: [0, null, null, null, 0, null, null, null, -1, null, null, null, -1, null, null, null, -2, null, null, null, -2, null, null, null, -1, null, null, null, 1, null, null, null],
  },
  chamber: {
    // After the fight: quiet, wide, almost hopeful.
    bpm: 72,
    leadWave: 'triangle',
    lead: [19, null, 17, null, 15, null, 12, null, 14, null, null, null, 10, null, null, null, 15, null, 14, null, 12, null, 10, null, 12, null, null, null, null, null, null, null],
    bass: [0, null, null, null, null, null, null, null, -4, null, null, null, null, null, null, null, -5, null, null, null, null, null, null, null, -7, null, null, null, null, null, null, null],
  },
  arbiter: {
    bpm: 156,
    leadWave: 'sawtooth',
    drums: true,
    lead: [12, 15, 19, 15, 12, 15, 20, 15, 11, 14, 19, 14, 11, 14, 18, 14, 12, 15, 19, 24, 22, 19, 15, 12, 13, null, 13, null, 11, null, 11, null],
    bass: [0, 0, 12, 0, 0, 0, 12, 0, -1, -1, 11, -1, -1, -1, 11, -1, 0, 0, 12, 0, 0, 0, 12, 0, 1, 1, 13, 1, -1, -1, 11, -1],
  },

  title: {
    bpm: 84,
    leadWave: 'triangle',
    lead: [12, null, 15, null, 19, null, 17, 15, 12, null, 10, null, 12, null, null, null, 8, null, 12, null, 15, null, 14, 12, 10, null, 7, null, 10, null, null, null],
    bass: [0, null, null, null, 0, null, null, null, -4, null, null, null, -4, null, null, null, -7, null, null, null, -7, null, null, null, -5, null, null, null, -5, null, null, null],
  },
  colony: {
    bpm: 96,
    leadWave: 'triangle',
    lead: [7, 12, 15, 12, 7, 12, 15, 19, 5, 10, 14, 10, 5, 10, 14, 17, 3, 8, 12, 8, 3, 8, 12, 15, 2, 7, 10, 7, 2, 7, 11, 14],
    bass: [0, null, 0, null, 0, null, 0, null, -2, null, -2, null, -2, null, -2, null, -4, null, -4, null, -4, null, -4, null, -5, null, -5, null, -5, null, -5, null],
  },
  wilds: {
    bpm: 112,
    leadWave: 'square',
    drums: true,
    lead: [12, null, 12, 15, null, 12, 10, null, 8, null, 8, 10, null, 12, 7, null, 12, null, 12, 15, null, 17, 19, null, 17, 15, 12, null, 10, null, 12, null],
    bass: [0, 0, 12, 0, 0, 0, 12, 0, -4, -4, 8, -4, -4, -4, 8, -4, -7, -7, 5, -7, -7, -7, 5, -7, -5, -5, 7, -5, -5, -5, 7, -5],
  },
  boss: {
    bpm: 148,
    leadWave: 'sawtooth',
    drums: true,
    lead: [12, 13, 12, null, 15, 13, 12, 10, 12, null, 8, null, 7, null, 8, 10, 12, 13, 12, null, 15, 17, 18, 17, 15, null, 13, null, 12, null, null, null],
    bass: [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, -2, -2, -1, -1, 0, 0, 0, 0, 1, 1, 1, 1, 3, 3, 1, 1, 0, 0, -1, -1],
  },
}

let current: Track | null = null
let timer: number | null = null
let step = 0
let nextTime = 0

const freq = (semi: number) => 220 * Math.pow(2, semi / 12)

function schedule() {
  if (!ctx || !musicBus || !current) return
  const song = SONGS[current]
  const stepDur = 60 / song.bpm / 2
  while (nextTime < ctx.currentTime + 0.25) {
    const i = step % song.lead.length
    const at = nextTime - ctx.currentTime
    const lead = song.lead[i]
    const bass = song.bass[i]
    if (lead != null) tone(musicBus, song.leadWave, freq(lead), freq(lead), stepDur * 0.9, 0.09, at)
    if (bass != null) tone(musicBus, 'triangle', freq(bass - 12), freq(bass - 12), stepDur * 0.95, 0.16, at)
    if (song.drums && i % 4 === 0) hiss(musicBus, 0.05, 0.25, 6000, at)
    if (song.drums && i % 8 === 4) (tone(musicBus, 'square', 160, 50, 0.12, 0.18, at), hiss(musicBus, 0.1, 0.15, 1500, at))
    nextTime += stepDur
    step++
  }
}

export function playMusic(track: Track | null) {
  if (track === current) return
  current = track
  if (timer !== null) (window.clearInterval(timer), (timer = null))
  if (!track || !ctx) return
  step = 0
  nextTime = ctx.currentTime + 0.1
  timer = window.setInterval(schedule, 60)
}
