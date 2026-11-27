import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en.ts'
import { fr } from './locales/fr.ts'

export const LANGUAGES = ['fr', 'en'] as const

/** The game's own i18next instance. The language itself is kept in the settings (see game/store.ts). */
export const i18n = i18next.createInstance()
void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: 'fr',
  fallbackLng: 'fr',
  // React escapes text itself, and these strings never become HTML.
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
})

/** An array of lines from the locales (dialogue, credits…). */
export const lines = (key: string): string[] => {
  const v = i18n.t(key, { returnObjects: true }) as unknown
  return Array.isArray(v) ? (v as string[]) : [String(v)]
}
