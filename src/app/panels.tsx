// In-game windows: inventory and equipment, character sheet, quest journal, Juno's workbench.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ITEMS, ITEM_IDS, QUESTS, QUEST_IDS, RECIPES, SLOTS, type Bonus, type ItemId } from '../game/data.ts'
import { canCraft, count, statsFor, statsOf, useItem, xpProgress } from '../game/state.ts'
import { live, useGame } from '../game/store.ts'
import { sfx } from '../engine/audio.ts'
import { Button, Icon, Meter, Panel, formatTime } from './ui.tsx'

const BONUS_LABEL: Record<keyof Bonus, string> = {
  attack: 'character.attack',
  ranged: 'character.ranged',
  defense: 'character.defense',
  maxHp: 'character.hp',
  maxEnergy: 'character.energy',
  regen: 'character.regen',
}

export function Inventory({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const save = useGame((s) => s.save)
  const st = useGame.getState()
  const owned = ITEM_IDS.filter((id) => count(save.inventory, id) > 0)
  const [picked, setPicked] = useState<ItemId | null>(owned[0] ?? null)
  const def = picked ? ITEMS[picked] : null
  const equippedIn = picked && def?.slot ? save.inventory.equipped[def.slot] === picked : false

  // What would change if the picked item were equipped.
  const preview = (() => {
    if (!picked || !def?.slot || equippedIn) return []
    const now = statsOf(save)
    const then = statsFor(save.player.xp, { ...save.inventory.equipped, [def.slot]: picked })
    return (Object.keys(BONUS_LABEL) as (keyof Bonus)[]).filter((k) => then[k] !== now[k]).map((k) => ({ k, d: then[k] - now[k] }))
  })()

  return (
    <Panel title={t('inventory.title')} onClose={onClose} wide>
      <div className="er-inv">
        <div>
          <h3 className="er-h3">{t('inventory.equipped')}</h3>
          <ul className="er-equip">
            {SLOTS.map((slot) => {
              const id = save.inventory.equipped[slot]
              return (
                <li key={slot}>
                  <span className="er-equip__slot">{t(`inventory.slots.${slot}`)}</span>
                  {id ? (
                    <button type="button" className="er-chip" onClick={() => setPicked(id)}>
                      <Icon id={id} size={24} /> {t(`items.${id}.name`)}
                    </button>
                  ) : (
                    <span className="er-muted">{t('inventory.none')}</span>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="er-credits">
            <Icon id="credits" size={24} /> {save.player.credits} {t('inventory.credits')}
          </p>
        </div>
        <div>
          <ul className="er-grid" aria-label={t('inventory.title')}>
            {owned.map((id) => (
              <li key={id}>
                <button type="button" className={`er-cell ${picked === id ? 'is-picked' : ''}`} aria-pressed={picked === id} onClick={() => (setPicked(id), sfx('ui'))}>
                  <Icon id={id} label={t(`items.${id}.name`)} />
                  {ITEMS[id].max > 1 && <span className="er-cell__n">{count(save.inventory, id)}</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="er-detail" aria-live="polite">
            {picked && def ? (
              <>
                <h3 className="er-h3">
                  {t(`items.${picked}.name`)} <span className="er-muted">{t(`inventory.kinds.${def.kind}`)}</span>
                </h3>
                <p>{t(`items.${picked}.desc`)}</p>
                {def.bonus && (
                  <p className="er-bonus">
                    {Object.entries(def.bonus)
                      .map(([k, v]) => `+${v} ${t(BONUS_LABEL[k as keyof Bonus])}`)
                      .join(' · ')}
                  </p>
                )}
                {preview.length > 0 && (
                  <p className="er-muted">
                    {t('inventory.effect')} {preview.map(({ k, d }) => `${t(BONUS_LABEL[k])} ${d > 0 ? '+' : ''}${d}`).join(' · ')}
                  </p>
                )}
                <div className="er-row">
                  {def.kind === 'consumable' && (
                    <Button
                      disabled={!useItem(save, picked)}
                      onClick={() => {
                        if (st.useItem(picked)) sfx('heal')
                      }}
                    >
                      {t('inventory.use')}
                    </Button>
                  )}
                  {def.slot &&
                    (equippedIn ? (
                      <Button tone="ghost" onClick={() => st.unequip(def.slot!)}>
                        {t('inventory.unequip')}
                      </Button>
                    ) : (
                      <Button onClick={() => (st.equip(picked), sfx('confirm'))}>{t('inventory.equip')}</Button>
                    ))}
                </div>
              </>
            ) : (
              <p className="er-muted">{t('inventory.pick')}</p>
            )}
          </div>
        </div>
      </div>
    </Panel>
  )
}

export function Character({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const save = useGame((s) => s.save)
  const s = statsOf(save)
  const xp = xpProgress(save.player.xp)
  const rows: [string, string | number][] = [
    [t('character.hp'), `${save.player.hp} / ${s.maxHp}`],
    [t('character.energy'), `${Math.floor(save.player.energy)} / ${s.maxEnergy}`],
    [t('character.attack'), s.attack],
    [t('character.ranged'), s.ranged],
    [t('character.defense'), s.defense],
    [t('character.regen'), s.regen],
    [t('character.credits'), save.player.credits],
    [t('character.time'), formatTime(live.playTime)],
  ]
  return (
    <Panel title={t('character.title')} onClose={onClose}>
      <p className="er-h3">
        {t('character.level')} {xp.level}
      </p>
      <Meter value={xp.next === undefined ? 1 : save.player.xp - xp.floor} max={xp.next === undefined ? 1 : xp.next - xp.floor} color="#ffb347" label={t('character.xp')} />
      <p className="er-muted">{xp.next === undefined ? t('character.max') : t('character.next', { n: xp.next - save.player.xp })}</p>
      <dl className="er-stats">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}

export function Journal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const quests = useGame((s) => s.save.quests)
  const active = QUEST_IDS.filter((q) => quests[q] && !quests[q]!.done)
  const done = QUEST_IDS.filter((q) => quests[q]?.done)
  return (
    <Panel title={t('journal.title')} onClose={onClose}>
      {!active.length && !done.length && <p className="er-muted">{t('journal.none')}</p>}
      {active.length > 0 && <h3 className="er-h3">{t('journal.active')}</h3>}
      {active.map((q) => (
        <article key={q} className="er-quest">
          <h4>{t(`quests.${q}.title`)}</h4>
          <p className="er-muted">{t(`quests.${q}.summary`)}</p>
          <ol>
            {QUESTS[q].steps.slice(0, quests[q]!.step + 1).map((step, i) => (
              <li key={step} className={i < quests[q]!.step ? 'is-done' : 'is-current'}>
                {i < quests[q]!.step ? '✓ ' : '▸ '}
                {t(`quests.${q}.steps.${step}`)}
              </li>
            ))}
          </ol>
        </article>
      ))}
      {done.length > 0 && <h3 className="er-h3">{t('journal.done')}</h3>}
      {done.map((q) => (
        <article key={q} className="er-quest is-done">
          <h4>✓ {t(`quests.${q}.title`)}</h4>
          <p className="er-muted">{t(`quests.${q}.summary`)}</p>
        </article>
      ))}
    </Panel>
  )
}

export function Bench({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const save = useGame((s) => s.save)
  return (
    <Panel title={t('bench.title')} onClose={onClose}>
      <p>{t('bench.intro')}</p>
      <p className="er-muted">{t('bench.have', { components: count(save.inventory, 'components'), credits: save.player.credits })}</p>
      <ul className="er-recipes">
        {RECIPES.map((r) => {
          const maxed = count(save.inventory, r.gives) >= ITEMS[r.gives].max
          return (
            <li key={r.id}>
              <Icon id={r.gives} />
              <div>
                <b>{t(`items.${r.gives}.name`)}</b>
                <span className="er-muted">{maxed ? t('bench.maxed') : t('bench.cost', { components: r.components, credits: r.credits })}</span>
              </div>
              <Button disabled={!canCraft(save, r)} onClick={() => useGame.getState().craft(r.id) && sfx('confirm')}>
                {t('bench.craft')}
              </Button>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
