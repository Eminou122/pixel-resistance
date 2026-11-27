import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import './index.css'

type Page = keyof typeof import('./pages/index.ts')
/** Each screen is its own chunk, loaded on first visit. */
const page = (name: Page) => async () => ({ Component: (await import('./pages/index.ts'))[name] })

const router = createBrowserRouter([
  {
    path: '/',
    lazy: page('PixelLayout'),
    children: [
      { index: true, lazy: page('MenuPage') },
      { path: 'village', lazy: page('VillagePage') },
      { path: 'missions', lazy: page('MissionsPage') },
      { path: 'missions/:id', lazy: page('MissionPlayPage') },
      { path: 'ennemis', lazy: page('EnemiesPage') },
      { path: 'atelier', lazy: page('WorkshopPage') },
      { path: 'qg', lazy: page('ProfilePage') },
      { path: 'victoire', lazy: page('VictoryPage') },
      { path: '*', lazy: page('NotFoundPage') },
    ],
  },
])

const root = document.getElementById('root')
if (!root) throw new Error('Élément #root introuvable')

createRoot(root).render(
  <StrictMode>
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
)
