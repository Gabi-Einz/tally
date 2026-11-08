import { useLiveQuery } from 'dexie-react-hooks'
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

interface Props {
  onAdd: () => void
  onOpen: (id: string) => void
}

export function HomeScreen({ onAdd, onOpen }: Props) {
  const { t, i18n } = useTranslation()
  const locale = intlLocale(i18n.language)
  const today = todayISO()
  const month = monthOf(today)
  const { byId } = useCategories()
  const monthExpenses = useLiveQuery(() => listExpensesInMonth(month), [month])
  const recent = useLiveQuery(() => recentExpenses(5), [])

  const dayNote = (date: string) =>
    date === today
      ? t('expenses.today').toLowerCase()
      : date === addDays(today, -1)
        ? t('expenses.yesterday').toLowerCase()
        : undefined

  return (
    <>
      <ScreenHeader title="Tally" />
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
        </section>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onAdd}
            className="w-full rounded-2xl bg-brand px-4 py-4 text-lg font-semibold text-white shadow-sm active:opacity-90"
          >
            + {t('home.add')}
          </button>
          <p className="text-center text-sm text-muted">
            {t('home.voiceSoon')}
          </p>
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
