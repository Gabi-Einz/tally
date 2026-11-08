import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from '../../components/ScreenHeader'
import {
  listExpensesInMonth,
  recentExpenses,
  totalAmount,
} from '../../db/expenses'
import { intlLocale } from '../../i18n'
import { addDays, formatMonth, monthOf, todayISO } from '../../lib/dates'
import { formatARS } from '../../lib/money'
import { useCategories } from '../categories/useCategories'
import { ExpenseRow } from '../expenses/ExpenseRow'
import { MicIcon } from '../voice/VoiceSheet'
import { formatUSD, formatUSDT } from '../currency/format'
import { STALE_BACKUP_MS, useDriveState } from '../backup/driveBackup'

interface Props {
  voiceAvailable: boolean
  canInstall: boolean
  onInstall: () => void
  onSpeak: () => void
  onAdd: () => void
  onOpen: (id: string) => void
}

export function HomeScreen({
  voiceAvailable,
  canInstall,
  onInstall,
  onSpeak,
  onAdd,
  onOpen,
}: Props) {
  const { t, i18n } = useTranslation()
  const locale = intlLocale(i18n.language)
  const today = todayISO()
  const month = monthOf(today)
  const { byId } = useCategories()
  const monthExpenses = useLiveQuery(() => listExpensesInMonth(month), [month])
  const recent = useLiveQuery(() => recentExpenses(5), [])
  const drive = useDriveState()
  const [openedAt] = useState(() => Date.now())
  const backupStale =
    !!drive?.connected && openedAt - (drive.lastBackupAt ?? 0) > STALE_BACKUP_MS

  const dayNote = (date: string) =>
    date === today
      ? t('expenses.today').toLowerCase()
      : date === addDays(today, -1)
        ? t('expenses.yesterday').toLowerCase()
        : undefined

  return (
    <>
      <ScreenHeader
        title="Tally"
        action={
          canInstall ? (
            <button
              type="button"
              onClick={onInstall}
              className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand"
            >
              {t('home.install')}
            </button>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-5 px-4 pb-6">
        <section className="rounded-2xl border border-line bg-white p-4">
          <p className="text-sm text-muted">
            {t('home.monthTotal', {
              month: formatMonth(month, locale).toLowerCase(),
            })}
          </p>
          <p className="font-mono text-3xl tabular-nums">
            {monthExpenses
              ? formatARS(totalAmount(monthExpenses), locale)
              : '…'}
          </p>
          {monthExpenses && monthExpenses.some((e) => e.usdBlue) && (
            <p className="font-mono text-sm text-muted tabular-nums">
              {formatUSD(
                monthExpenses.reduce((s, e) => s + (e.usdBlue?.amount ?? 0), 0),
                locale,
              )}{' '}
              {t('currency.blue')} ·{' '}
              {formatUSDT(
                monthExpenses.reduce(
                  (s, e) => s + (e.usdCripto?.amount ?? 0),
                  0,
                ),
                locale,
              )}
            </p>
          )}
        </section>

        {backupStale && (
          <p
            role="status"
            className="rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-800"
          >
            {t('home.backupStale')}
          </p>
        )}

        <div className="flex flex-col items-center gap-3">
          {voiceAvailable ? (
            <>
              <button
                type="button"
                onClick={onSpeak}
                aria-label={t('home.speak')}
                className="grid size-24 place-items-center rounded-full bg-brand text-white shadow-md ring-8 ring-brand-soft active:opacity-90"
              >
                <MicIcon className="size-10" />
              </button>
              <p className="text-center text-sm text-muted">
                {t('home.speak')}
                <br />
                {t('home.speakHint')}
              </p>
            </>
          ) : (
            <p className="text-center text-sm text-muted">
              {t('home.voiceUnsupported')}
            </p>
          )}
          <button
            type="button"
            onClick={onAdd}
            className={
              voiceAvailable
                ? 'rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold'
                : 'w-full rounded-2xl bg-brand px-4 py-4 text-lg font-semibold text-white'
            }
          >
            + {t('home.manual')}
          </button>
        </div>

        <section>
          <h2 className="mb-1 font-mono text-xs tracking-wider text-muted uppercase">
            {t('home.recent')}
          </h2>
          {recent && recent.length === 0 && (
            <p className="py-6 text-center text-muted">{t('home.empty')}</p>
          )}
          <ul>
            {recent?.map((e) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                category={byId.get(e.categoryId)}
                note={dayNote(e.date)}
                onOpen={onOpen}
              />
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
