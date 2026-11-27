import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { useGame } from '../game/store.ts'
import { i18n } from '../i18n.ts'
import { playMusic, setVolumes } from '../engine/audio.ts'
import { GameView } from './GameView.tsx'
import { Title } from './Title.tsx'

export function App() {
  const screen = useGame((s) => s.screen)
  const settings = useGame((s) => s.settings)

  useEffect(() => {
    void i18n.changeLanguage(settings.lang)
    document.documentElement.lang = settings.lang
    document.title = i18n.t('meta.title')
    setVolumes(settings)
  }, [settings])

  useEffect(() => {
    if (screen === 'title') playMusic('title')
  }, [screen])

  return (
    <I18nextProvider i18n={i18n}>
      <div className={`er-root ${settings.reducedMotion ? 'er-calm' : ''}`}>{screen === 'title' ? <Title /> : <GameView />}</div>
    </I18nextProvider>
  )
}
