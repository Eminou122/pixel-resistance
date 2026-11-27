import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en.ts'
import { fr } from './locales/fr.ts'

export const LANGUAGES = ['fr', 'en'] as const
export type Language = (typeof LANGUAGES)[number]
const KEY = 'pixel-resistance-lang'

function savedLanguage(): Language {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'en' ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}

/** The game's own i18next instance; French unless the player chose English. */
export const i18n = i18next.createInstance()
void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: savedLanguage(),
  fallbackLng: 'fr',
  initAsync: false,
  interpolation: { escapeValue: false },
  returnObjects: true,
})

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(KEY, lng)
  } catch {
    // Private mode: the choice simply lasts for this visit.
  }
})

/** For lists stored as arrays in the locales. */
export const list = (key: string) => {
  const value = i18n.t(key, { returnObjects: true }) as unknown
  return Array.isArray(value) ? (value as string[]) : []
}
