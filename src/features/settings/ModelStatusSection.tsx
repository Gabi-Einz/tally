import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import type { ModelStatus } from '../../lib/modelWorker'
import {
  getModelStatus,
  subscribeModelStatus,
} from '../categorizer/embeddingsClient'
import {
  getWhisperStatus,
  subscribeWhisperStatus,
} from '../voice/whisperClient'

export function ModelStatusSection() {
  const { t } = useTranslation()
  const e5 = useSyncExternalStore(subscribeModelStatus, getModelStatus)
  const whisper = useSyncExternalStore(subscribeWhisperStatus, getWhisperStatus)

  return (
    <section aria-labelledby="models-title">
      <h2 id="models-title" className="font-semibold">
        {t('settings.models.title')}
      </h2>
      <ul className="mt-2 rounded-2xl border border-line bg-card px-4">
        <ModelRow
          name={t('settings.models.whisper')}
          help={t('settings.models.whisperHelp')}
          status={whisper}
        />
        <ModelRow
          name={t('settings.models.e5')}
          help={t('settings.models.e5Help')}
          status={e5}
        />
      </ul>
    </section>
  )
}

function ModelRow({
  name,
  help,
  status,
}: {
  name: string
  help: string
  status: ModelStatus
}) {
  const { t } = useTranslation()
  const label =
    status.state === 'loading'
      ? t('settings.models.loading', { percent: Math.round(status.progress) })
      : t(`settings.models.${status.state}`)
  return (
    <li className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
      <span>
        <span className="block">{name}</span>
        <span className="block text-sm text-muted">{help}</span>
      </span>
      <span
        className={`text-right text-sm ${status.state === 'ready' ? 'font-semibold text-brand' : 'text-muted'}`}
      >
        {label}
      </span>
    </li>
  )
}
