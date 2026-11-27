import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { modules } from '../game/content.ts'
import { play } from '../game/sound.ts'
import { useGame } from '../game/store.ts'
import { list } from '../i18n.ts'
import { PixelBadge, PixelButton, SectionTitle } from '../ui.tsx'

type Module = (typeof modules)[number]

export function WorkshopPage() {
  const { t } = useTranslation()
  const { hash } = useLocation()
  const mastered = useGame((s) => s.progress.modules)
  const [open, setOpen] = useState<string | null>(null)

  // Links like atelier#privacy open (and scroll to) that module.
  useEffect(() => {
    const id = hash.slice(1)
    if (!modules.some((mo) => mo.id === id)) return
    setOpen(id)
    requestAnimationFrame(() => document.getElementById(`module-${id}`)?.scrollIntoView({ block: 'start' }))
  }, [hash])

  return (
    <div>
      <SectionTitle sub={t('workshop.intro')}>{t('workshop.title')}</SectionTitle>
      <p className="font-pixel mb-5 text-[0.6rem] text-px-cream">{t('workshop.mastered', { count: mastered.length, total: modules.length })}</p>

      <ul className="space-y-4">
        {modules.map((mod, i) => {
          const isOpen = open === mod.id
          const done = mastered.includes(mod.id)
          return (
            <li key={mod.id} id={`module-${mod.id}`} className="scroll-mt-40">
              <div className="px-frame px-card">
                <h2>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`module-body-${mod.id}`}
                    onClick={() => {
                      play('click')
                      setOpen(isOpen ? null : mod.id)
                    }}
                    className="flex w-full items-center gap-4 p-4 text-left hover:bg-white sm:p-5"
                  >
                    <span className="font-pixel flex size-10 shrink-0 items-center justify-center bg-px-navy text-xs text-px-gold" aria-hidden="true">
                      {done ? <Check className="size-5 text-px-green" /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-pixel block text-[0.65rem] leading-relaxed sm:text-xs">{t(`modules.${mod.id}.title`)}</span>
                      <span className="mt-1 block text-sm text-px-ink/75">{t(`modules.${mod.id}.tagline`)}</span>
                    </span>
                    {done && (
                      <span className="hidden sm:inline-flex">
                        <PixelBadge color="#63B75D">{t('workshop.masteredBadge')}</PixelBadge>
                      </span>
                    )}
                    <ChevronDown aria-hidden="true" className={`size-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </h2>
                {isOpen && (
                  <div id={`module-body-${mod.id}`} className="border-t-4 border-px-ink/15 p-4 sm:p-6">
                    <ModuleBody mod={mod} done={done} />
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ModuleBody({ mod, done }: { mod: Module; done: boolean }) {
  const { t } = useTranslation()
  const discover = useGame((s) => s.discover)
  const [choice, setChoice] = useState<number | null>(null)
  const base = `modules.${mod.id}`
  const correct = choice === mod.answer

  const answer = (index: number) => {
    setChoice(index)
    if (index === mod.answer) {
      play('good')
      discover('modules', mod.id)
    } else play('bad')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <section>
          <h3 className="font-pixel mb-2 text-[0.6rem] text-px-blue-dark">{t('workshop.sections.what')}</h3>
          <p className="leading-relaxed">{t(`${base}.what`)}</p>
        </section>
        <section>
          <h3 className="font-pixel mb-2 text-[0.6rem] text-[#2E6B2A]">{t('workshop.sections.benefits')}</h3>
          <ul className="list-disc space-y-1 pl-5">
            {list(`${base}.benefits`).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="font-pixel mb-2 text-[0.6rem] text-px-red-dark">{t('workshop.sections.watchouts')}</h3>
          <ul className="list-disc space-y-1 pl-5">
            {list(`${base}.watchouts`).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="bg-px-gold/25 p-3">
          <h3 className="font-pixel mb-1 text-[0.6rem]">{t('workshop.sections.firstStep')}</h3>
          <p className="font-semibold">{t(`${base}.firstStep`)}</p>
        </section>
      </div>

      <section className="px-frame px-card--dark h-fit p-4 sm:p-5" aria-labelledby={`quiz-${mod.id}`}>
        <h3 id={`quiz-${mod.id}`} className="font-pixel text-[0.6rem] text-px-gold">
          {t('workshop.check')}
        </h3>
        <p className="mt-2 font-semibold">{t(`${base}.quiz.question`)}</p>
        <ul className="mt-3 space-y-2">
          {list(`${base}.quiz.options`).map((label, index) => {
            const chosen = choice === index
            const reveal = (done || correct) && index === mod.answer
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={correct || done}
                  onClick={() => answer(index)}
                  aria-pressed={chosen}
                  className={`w-full p-3 text-left text-[0.95rem] leading-snug ${
                    reveal ? 'bg-px-green text-px-ink' : chosen ? 'bg-px-red-dark text-white' : 'bg-px-navy text-px-cream hover:bg-px-blue-dark'
                  }`}
                  style={{ boxShadow: '0 0 0 3px #1B1F2E' }}
                >
                  <span className="font-pixel mr-2 text-[0.6rem]" aria-hidden="true">
                    {'ABC'[index]}
                  </span>
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
        <div aria-live="polite" className="mt-4">
          {(correct || done) && (
            <p>
              <span className="font-pixel block text-[0.6rem] text-px-green">{t('workshop.right')}</span>
              <span className="mt-1 block text-px-cream/90">{t(`${base}.quiz.explain`)}</span>
            </p>
          )}
          {choice !== null && !correct && !done && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-pixel text-[0.6rem] text-[#FF8A93]">{t('workshop.wrong')}</p>
              <PixelButton small tone="ghost" onClick={() => setChoice(null)}>
                {t('workshop.retry')}
              </PixelButton>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
