import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getModelStatus,
  subscribeModelStatus,
} from '../categorizer/embeddingsClient'

export function ModelStatusSection() {
  const { t } = useTranslation()
  const status = useSyncExternalStore(subscribeModelStatus, getModelStatus)

  const label =
    status.state === 'loading'
      ? t('settings.models.loading', { percent: Math.round(status.progress) })
      : t(`settings.models.${status.state}`)

  return (
    <section aria-labelledby="models-title">
      <h2 id="models-title" className="font-semibold">
        {t('settings.models.title')}
      </h2>
      <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
        <span>
          <span className="block">{t('settings.models.e5')}</span>
          <span className="block text-sm text-muted">
            {t('settings.models.e5Help')}
          </span>
        </span>
        <span
          className={`text-right text-sm ${status.state === 'ready' ? 'font-semibold text-brand' : 'text-muted'}`}
        >
          {label}
        </span>
      </div>
    </section>
  )
}
