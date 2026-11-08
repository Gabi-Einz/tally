import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from '../../components/ScreenHeader'
import { listExpensesInMonth } from '../../db/expenses'
import type { Expense } from '../../db/types'
import { intlLocale } from '../../i18n'
import {
  addMonths,
  formatDayHeading,
  formatMonth,
  monthOf,
  todayISO,
} from '../../lib/dates'
import { categoryLabel, useCategories } from '../categories/useCategories'
import { ExpenseRow } from './ExpenseRow'

interface Props {
  onAdd: () => void
  onOpen: (id: string) => void
}

export function ExpensesScreen({ onAdd, onOpen }: Props) {
  const { t, i18n } = useTranslation()
  const locale = intlLocale(i18n.language)
  const today = todayISO()
  const [month, setMonth] = useState(() => monthOf(today))
  const [filter, setFilter] = useState<string | null>(null)
  const { categories, byId } = useCategories()
  const expenses = useLiveQuery(() => listExpensesInMonth(month), [month])

  const visible =
    expenses?.filter((e) => !filter || e.categoryId === filter) ?? []
  const days = groupByDay(visible)
  const monthLabel = formatMonth(month, locale)
  const usedCategories = categories.filter((c) =>
    expenses?.some((e) => e.categoryId === c.id),
  )

  return (
    <>
      <ScreenHeader
        title={t('expenses.title')}
        action={
          <button
            type="button"
            onClick={onAdd}
            className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand"
          >
            + {t('expenses.addManual')}
          </button>
        }
      />
      <div className="flex flex-col gap-3 px-4 pb-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, -1))}
            aria-label={t('expenses.previousMonth')}
            className="grid size-10 place-items-center rounded-full text-2xl text-muted hover:bg-sunk"
          >
            ‹
          </button>
          <span className="font-semibold">{monthLabel}</span>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            aria-label={t('expenses.nextMonth')}
            className="grid size-10 place-items-center rounded-full text-2xl text-muted hover:bg-sunk"
          >
            ›
          </button>
        </div>

        {usedCategories.length > 0 && (
          <div
            role="group"
            aria-label={t('expenses.filterLabel')}
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
          >
            <FilterChip
              active={filter === null}
              onClick={() => setFilter(null)}
            >
              {t('expenses.filterAll')}
            </FilterChip>
            {usedCategories.map((c) => (
              <FilterChip
                key={c.id}
                active={filter === c.id}
                onClick={() => setFilter(c.id)}
              >
                {categoryLabel(c, t)}
              </FilterChip>
            ))}
          </div>
        )}

        {expenses && days.length === 0 && (
          <p className="py-10 text-center text-muted">
            {t(filter ? 'expenses.emptyFilter' : 'expenses.emptyMonth', {
              month: monthLabel.toLowerCase(),
            })}
          </p>
        )}

        {days.map(([date, items]) => (
          <section key={date}>
            <h2 className="mt-2 font-mono text-xs tracking-wider text-muted uppercase">
              {formatDayHeading(date, today, locale, {
                today: t('expenses.today'),
                yesterday: t('expenses.yesterday'),
              })}
            </h2>
            <ul>
              {items.map((e) => (
                <ExpenseRow
                  key={e.id}
                  expense={e}
                  category={byId.get(e.categoryId)}
                  onOpen={onOpen}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-none rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
        active ? 'bg-brand-soft font-semibold text-brand' : 'bg-sunk text-muted'
      }`}
    >
      {children}
    </button>
  )
}

/** Agrupa por fecha manteniendo el orden (la lista ya viene del más nuevo al más viejo) */
function groupByDay(expenses: Expense[]): [string, Expense[]][] {
  const groups = new Map<string, Expense[]>()
  for (const e of expenses) {
    const list = groups.get(e.date)
    if (list) list.push(e)
    else groups.set(e.date, [e])
  }
  return [...groups]
}
