# PIXEL RESISTANCE — ECHOES OF THE LAST SIGNAL

*Explore the galaxy. Fight the machines. Restore the signal.*

A top-down 16-bit science-fiction action RPG that runs in the browser, made for the Nuit de l'Info 2025 (challenge « On veut du gros pixel ! »). French by default, English available in the settings.

Year 2847. OVERLORD, an artificial intelligence, has seized THE NEXUS — the network linking humanity's colonies — and silences them one by one. NOVA-7 is the last free colony. Kael, a former Nexus engineer, follows an ancient transmission into the Forgotten Wilds. The story echoes the national subject — communities resisting centralised control — without turning the game into a lesson.

## Chapter 1 (this version)

- **Nova-7**, the colony hub: Commander Vey (main quest), Juno and her workbench (crafting and upgrades), Tamsin the archivist (lore and a hint).
- **The Forgotten Wilds**: grass, bioluminescent plants, a pond and bridge, a crystal field, a ruined outpost, a hidden grove behind a fake bush, and the Iron Warden's arena.
- **Real-time combat**: Pulse Blade (directional hits, knockback), Plasma Blaster (projectiles, uses energy), Energy Dash (invulnerable burst), damage numbers, hit sparks, screen shake.
- **Enemies with state-machine AI**: Scout Drones (patrol, spot, chase, telegraphed lunge) and Security Sentinels (track, keep their distance, charge then fire). Walls block their sight and their movement.
- **Mini-boss — the Iron Warden**: missile barrage (target rings), sweeping laser (stopped by pillars), charge (stunned if it hits a wall), a faster second phase, a death sequence and unique rewards.
- **Quests**: *The Lost Transmission* (leave the colony, explore, find Rook's device, defeat its guardians, report back) then *The Iron Warden*.
- **Progression**: XP and 7 levels (levelling up restores the player), credits, components, equipment slots (blade, blaster, armor, module), consumables, crafting.
- **Saves**: 3 slots, autosave on area changes and quest steps, manual save from the pause menu, delete with confirmation. Saves are versioned and validated: damaged, outdated or tampered data is detected or repaired, never trusted. Every enemy and pickup pays its reward only once per save.

## Controls

| Action | Keyboard / mouse | Touch |
| --- | --- | --- |
| Move | WASD, ZQSD or arrows | Joystick |
| Pulse Blade | J or left click | Blade |
| Plasma Blaster | K or right click (aims at the mouse) | Blast |
| Energy Dash | Space | Dash |
| Talk / interact | E | Use |
| Healing / Energy Cell | 1 / 2 | Heal |
| Inventory | I | Items |
| Pause | Esc | Pause |

Touch controls appear automatically on touch screens (Settings → Touch controls to force them on or off). In portrait they sit below the game; in landscape they occupy the corners.

## Architecture

```
src/
  game/              rules and data: no Phaser, no React (unit-tested with node:test)
    data.ts          items, enemies, levels, quests, recipes, player tuning
    maps.ts          Nova-7 (hand-drawn tile map) and the Forgotten Wilds (built from shapes), placements, reachability
    state.ts         save shape, stats, inventory, rewards (grant once), crafting
    story.ts         quests, conversations, world events
    save.ts          slots, settings, validation of untrusted LocalStorage data
    store.ts         Zustand store shared by Phaser and React
    game.test.ts     maps, combat maths, inventory, full chapter playthrough, saves, texts
  engine/            Phaser 3
    art.ts           all pixel art, drawn in code (tiles, characters, machines, boss, effects, icons)
    audio.ts         sound effects and chiptune music synthesised with Web Audio
    boot.ts          textures, animations, game config (384 x 216, pixel-perfect)
    world.ts         tile maps, collisions, camera, combat, pickups, interactions, triggers
    actors.ts        Kael, drones, sentinels, the Iron Warden
    hud.ts           in-canvas HUD (health, energy, XP, credits, quick items, objective, boss bar)
    input.ts         touch-control state read by the game loop
  app/               React screens: title, slots, settings, controls, credits, dialogue, pause,
                     inventory, character, journal, workbench, game over, touch controls
  locales/           French (default) and English texts
```

Phaser renders the world at 384 × 216 and scales it by a whole number whenever that fills the screen well (nearest-neighbour). React only re-renders for menus; the game loop never goes through React.

## Commands

Requires Node.js 22 or newer.

```powershell
npm install
```

```powershell
npm run dev
```

```powershell
npm run typecheck
```

```powershell
npm test
```

```powershell
npm run build
```

```powershell
npm run preview
```

## Licences and credits

- Code: [MIT](LICENSE).
- Pixel art, sound effects and music: original, created in code for this project, under the same MIT licence. No asset, sprite, character or music from a commercial game is used.
- [Phaser 3](https://phaser.io) (MIT), React, Zustand, i18next (MIT).
- Fonts: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P), [VT323](https://fonts.google.com/specimen/VT323) and [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans) (SIL Open Font License 1.1), loaded from Google Fonts.
