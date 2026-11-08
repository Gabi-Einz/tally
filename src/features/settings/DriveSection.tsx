import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { intlLocale } from '../../i18n'
import { todayISO } from '../../lib/dates'
import {
  backupNow,
  connectDrive,
  disconnectDrive,
  restoreFromDrive,
  useDriveState,
} from '../backup/driveBackup'
import { formatBackupTime } from '../backup/formatBackupTime'
import { isDriveConfigured } from '../backup/googleAuth'

type Message = { tone: 'ok' | 'error'; text: string } | null

export function DriveSection() {
  const { t, i18n } = useTranslation()
  const state = useDriveState()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<Message>(null)
  const [offerRestore, setOfferRestore] = useState(false)

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setMessage(null)
    try {
      await action()
    } catch {
      setMessage({ tone: 'error', text: t('settings.drive.authFailed') })
    } finally {
      setBusy(false)
    }
  }

  const connect = () =>
    run(async () => {
      const { hasRemoteBackup } = await connectDrive()
      setOfferRestore(hasRemoteBackup)
      if (!hasRemoteBackup) await backupNow(true)
    })

  const backup = () =>
    run(async () => {
      const ok = await backupNow(true)
      setMessage(
        ok
          ? { tone: 'ok', text: t('settings.drive.backedUp') }
          : { tone: 'error', text: t('settings.drive.backupFailed') },
      )
    })

  const restore = () =>
    run(async () => {
      const result = await restoreFromDrive()
      setOfferRestore(false)
      setMessage(
        result
          ? {
              tone: 'ok',
              text: t('settings.drive.restored', { count: result.expenses }),
            }
          : { tone: 'error', text: t('settings.drive.noBackup') },
      )
    })

  const button =
    'rounded-xl border border-line bg-card px-3 py-2.5 text-sm font-semibold disabled:opacity-50'

  if (!isDriveConfigured()) {
    return (
      <section aria-labelledby="drive-title">
        <h2 id="drive-title" className="font-semibold">
          {t('settings.drive.title')}
        </h2>
        <p className="mt-2 rounded-2xl border border-line bg-card p-4 text-sm text-muted">
          {t('settings.drive.notConfigured')}
        </p>
      </section>
    )
  }

  const last = state?.lastBackupAt
    ? formatBackupTime(
        state.lastBackupAt,
        intlLocale(i18n.language),
        todayISO(),
      )
    : null

  return (
    <section aria-labelledby="drive-title">
      <h2 id="drive-title" className="font-semibold">
        {t('settings.drive.title')}
      </h2>
      <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
        {!state?.connected ? (
          <>
            <p className="text-sm text-muted">{t('settings.drive.help')}</p>
            <button
              type="button"
              disabled={busy}
              onClick={connect}
              className="rounded-xl bg-brand py-3 font-semibold text-on-brand disabled:opacity-60"
            >
              {t('settings.drive.connect')}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm" aria-live="polite">
              {last
                ? last.kind === 'today'
                  ? t('settings.drive.lastToday', { time: last.time })
                  : t('settings.drive.lastDate', { date: last.time })
                : t('settings.drive.never')}
            </p>
            {state.lastError && (
              <p role="alert" className="text-sm text-danger">
                {t(`settings.drive.errors.${state.lastError}`)}
              </p>
            )}
            {offerRestore && (
              <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand">
                {t('settings.drive.remoteFound')}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {state.lastError === 'auth' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={backup}
                  className={button}
                >
                  {t('settings.drive.reconnect')}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={backup}
                  className={button}
                >
                  {t('settings.drive.backupNow')}
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={restore}
                className={button}
              >
                {t('settings.drive.restore')}
              </button>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(disconnectDrive)}
              className="self-start text-sm font-semibold text-muted underline"
            >
              {t('settings.drive.disconnect')}
            </button>
          </>
        )}
        {message && (
          <p
            role="status"
            className={`text-sm ${message.tone === 'ok' ? 'text-brand' : 'text-danger'}`}
          >
            {message.text}
          </p>
        )}
      </div>
    </section>
  )
}
