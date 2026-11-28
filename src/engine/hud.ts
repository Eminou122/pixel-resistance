// Heads-up display drawn by Phaser at the game's native resolution, so it stays pixel-perfect.
import Phaser from 'phaser'
import { count, statsOf, xpProgress } from '../game/state.ts'
import { useGame } from '../game/store.ts'
import { currentObjective, type Notice } from '../game/story.ts'
import { i18n } from '../i18n.ts'
import { sfx } from './audio.ts'

const FONT = { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#f4f8ff', stroke: '#070a16', strokeThickness: 2 }

export function noticeText(n: Notice): string {
  const t = i18n.t.bind(i18n)
  const p = { ...n.params }
  if (typeof p.item === 'string') p.item = t(`items.${p.item}.name`)
  if (typeof p.quest === 'string') {
    if (typeof p.step === 'string') p.step = t(`quests.${p.quest}.steps.${p.step}`)
    p.quest = t(`quests.${p.quest}.title`)
  }
  if (typeof p.area === 'string') p.area = t(`areas.${p.area}`)
  return t(n.key, p)
}

export class HudScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics
  private hp!: Phaser.GameObjects.Text
  private en!: Phaser.GameObjects.Text
  private lv!: Phaser.GameObjects.Text
  private credits!: Phaser.GameObjects.Text
  private quick!: Phaser.GameObjects.Text[]
  private objective!: Phaser.GameObjects.Text
  private banner!: Phaser.GameObjects.Text
  private bannerBg!: Phaser.GameObjects.Graphics
  private areaTitle!: Phaser.GameObjects.Text
  private bossName!: Phaser.GameObjects.Text
  private showingUntil = 0
  private last = ''

  constructor() {
    super('hud')
  }

  create() {
    this.g = this.add.graphics()
    this.add.text(4, 4, 'HP', { ...FONT, color: '#ff8090' })
    this.add.text(4, 14, 'EN', { ...FONT, color: '#7ff6ff' })
    this.hp = this.add.text(96, 4, '', FONT)
    this.en = this.add.text(96, 14, '', FONT)
    this.lv = this.add.text(4, 24, '', { ...FONT, color: '#ffd27a' })
    this.add.image(352, 3, 'icons', 'credits').setOrigin(0)
    this.credits = this.add.text(349, 7, '', FONT).setOrigin(1, 0)
    // Quick items: [key] icon count, for the Healing Cell (1) and the Energy Cell (2).
    this.add.text(298, 26, '1', { ...FONT, color: '#a9b8d8' })
    this.add.image(306, 21, 'icons', 'healing_cell').setOrigin(0)
    this.add.text(340, 26, '2', { ...FONT, color: '#a9b8d8' })
    this.add.image(348, 21, 'icons', 'energy_cell').setOrigin(0)
    this.quick = [this.add.text(323, 26, '', FONT), this.add.text(365, 26, '', FONT)]
    this.objective = this.add.text(4, 36, '', { ...FONT, color: '#ffd27a', wordWrap: { width: 236 }, lineSpacing: 2 })
    this.bannerBg = this.add.graphics()
    this.banner = this.add.text(192, 76, '', { ...FONT, align: 'center', wordWrap: { width: 300 }, lineSpacing: 3 }).setOrigin(0.5, 0)
    this.areaTitle = this.add.text(192, 96, '', { ...FONT, fontSize: '16px', color: '#3ef0ff', strokeThickness: 4 }).setOrigin(0.5).setAlpha(0)
    this.bossName = this.add.text(192, 186, '', { ...FONT, color: '#ff8090' }).setOrigin(0.5, 0)
    this.scene.bringToTop()
  }

  override update(time: number) {
    const st = useGame.getState()
    const s = st.save
    const stats = statsOf(s)
    const xp = xpProgress(s.player.xp)
    const obj = currentObjective(s)
    const key = [s.player.hp, s.player.energy, s.player.xp, s.player.credits, stats.maxHp, stats.maxEnergy, count(s.inventory, 'healing_cell'), count(s.inventory, 'energy_cell'), obj?.step, st.boss?.hp, i18n.language].join('|')
    if (key !== this.last) {
      this.last = key
      const g = this.g.clear()
      const bar = (x: number, y: number, w: number, h: number, ratio: number, fill: number, back: number) => {
        g.fillStyle(0x070a16, 0.9).fillRect(x - 1, y - 1, w + 2, h + 2)
        g.fillStyle(back, 1).fillRect(x, y, w, h)
        g.fillStyle(fill, 1).fillRect(x, y, Math.round(w * Phaser.Math.Clamp(ratio, 0, 1)), h)
        g.fillStyle(0xffffff, 0.25).fillRect(x, y, Math.round(w * Phaser.Math.Clamp(ratio, 0, 1)), 1)
      }
      bar(22, 5, 70, 6, s.player.hp / stats.maxHp, s.player.hp / stats.maxHp < 0.3 ? 0xff4d5e : 0x59f39a, 0x3a1420)
      bar(22, 15, 70, 4, s.player.energy / stats.maxEnergy, 0x3ef0ff, 0x0f2a3a)
      bar(44, 27, 48, 2, xp.ratio, 0xffb347, 0x3a2a10)
      this.hp.setText(`${s.player.hp}/${stats.maxHp}`)
      this.en.setText(`${Math.floor(s.player.energy)}`)
      this.lv.setText(`LV${xp.level}`)
      this.credits.setText(`${s.player.credits}`)
      this.quick[0]!.setText(`${count(s.inventory, 'healing_cell')}`)
      this.quick[1]!.setText(`${count(s.inventory, 'energy_cell')}`)
      this.objective.setText(obj ? `> ${i18n.t(`quests.${obj.quest}.steps.${obj.step}`)}` : '')
      if (st.boss) {
        this.bossName.setText(i18n.t(st.boss.name === 'arbiter' ? 'hud.arbiter' : 'hud.boss'))
        bar(92, 198, 200, 6, st.boss.hp / st.boss.max, 0xff4d5e, 0x3a1420)
      } else this.bossName.setText('')
    }

    // Notices, one at a time.
    if (time > this.showingUntil && st.notices.length) {
      const n = st.notices[0]!
      st.dismissNotice(n.id)
      const text = noticeText(n)
      if (n.key === 'notice.area') {
        this.areaTitle.setText(text).setAlpha(1)
        this.tweens.add({ targets: this.areaTitle, alpha: 0, delay: 1400, duration: 700 })
        this.showingUntil = time + 400
      } else {
        this.banner.setText(text)
        const b = this.banner.getBounds()
        const color = n.kind === 'level' ? 0xffb347 : n.kind === 'quest' ? 0x3ef0ff : 0x6b7aa1
        this.bannerBg.clear().fillStyle(0x070a16, 0.85).fillRect(b.x - 6, b.y - 5, b.width + 12, b.height + 10).lineStyle(1, color, 1).strokeRect(b.x - 6, b.y - 5, b.width + 12, b.height + 10)
        this.showingUntil = time + (n.kind === 'item' ? 1300 : 2400)
        if (n.kind === 'level') sfx('level')
        if (n.kind === 'quest') sfx('quest')
      }
    } else if (time > this.showingUntil && this.banner.text) {
      this.banner.setText('')
      this.bannerBg.clear()
    }
  }
}
