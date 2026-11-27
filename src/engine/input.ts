// Touch controls write here; the world scene reads it every frame (no React re-render involved).
export const touch = {
  /** Joystick direction, each axis in [-1, 1]. */
  x: 0,
  y: 0,
  // One-shot buttons: set on press, cleared by the game once handled.
  melee: false,
  ranged: false,
  dash: false,
  interact: false,
  heal: false,
}

export type TouchButton = 'melee' | 'ranged' | 'dash' | 'interact' | 'heal'

export function takeTouch(b: TouchButton): boolean {
  const v = touch[b]
  touch[b] = false
  return v
}
