import { useTranslation } from 'react-i18next'
import { PixelCard, PixelLink } from '../ui.tsx'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <PixelCard className="mx-auto mt-10 max-w-lg p-6 text-center">
      <h1 className="font-pixel text-sm">{t('notFound.title')}</h1>
      <p className="mt-3">{t('notFound.text')}</p>
      <PixelLink to="/" className="mt-5">
        {t('notFound.back')}
      </PixelLink>
    </PixelCard>
  )
}
