import { useTranslation } from 'react-i18next'
import type { Category, Expense } from '../../db/types'
import { intlLocale } from '../../i18n'
import { formatARS } from '../../lib/money'
import { categoryLabel } from '../categories/useCategories'

interface Props {
  expense: Expense
  category: Category | undefined
  note?: string
  onOpen: (id: string) => void
}

export function ExpenseRow({ expense, category, note, onOpen }: Props) {
  const { t, i18n } = useTranslation()
  const label = categoryLabel(category, t)
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(expense.id)}
        className="flex w-full items-center gap-3 border-b border-line py-3 text-left last:border-b-0"
      >
        <span
          className="size-2.5 flex-none rounded-full"
          style={{ background: category?.color }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">
            {expense.description || label}
          </span>
          <span className="block truncate text-sm text-muted">
            {note ? `${label} · ${note}` : label}
          </span>
        </span>
        <span className="font-mono tabular-nums">
          {expense.amount === null
            ? '—'
            : formatARS(expense.amount, intlLocale(i18n.language))}
        </span>
      </button>
    </li>
  )
}
