import { useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { todayISO } from '../../lib/dates'
import { createSnapshot, isSnapshot, restoreSnapshot } from '../backup/snapshot'

export function BackupFileSection() {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{
    tone: 'ok' | 'error'
    text: string
  } | null>(null)

  const exportFile = async () => {
    const snapshot = await createSnapshot()
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(snapshot, null, 2)], {
        type: 'application/json',
      }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `tally-respaldo-${todayISO()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const data: unknown = JSON.parse(await file.text())
      if (!isSnapshot(data)) throw new Error('invalid')
      const result = await restoreSnapshot(data)
      setMessage({
        tone: 'ok',
        text: t('settings.file.imported', { count: result.expenses }),
      })
    } catch {
      setMessage({ tone: 'error', text: t('settings.file.invalid') })
    }
  }

  const button =
    'rounded-xl border border-line bg-card px-3 py-2.5 text-sm font-semibold'

  return (
    <section aria-labelledby="file-title">
      <h2 id="file-title" className="font-semibold">
        {t('settings.file.title')}
      </h2>
      <p className="mb-2 text-sm text-muted">{t('settings.file.help')}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={exportFile} className={button}>
          {t('settings.file.export')}
        </button>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={button}
        >
          {t('settings.file.import')}
        </button>
      </div>
      <input
        ref={input}
        id="backup-file"
        type="file"
        accept="application/json,.json"
        onChange={importFile}
        aria-label={t('settings.file.import')}
        className="hidden"
      />
      {message && (
        <p
          role="status"
          className={`mt-2 text-sm ${message.tone === 'ok' ? 'text-brand' : 'text-danger'}`}
        >
          {message.text}
        </p>
      )}
    </section>
  )
}
