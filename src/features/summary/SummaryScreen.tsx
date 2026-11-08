import { ArcElement, Chart as ChartJS, Tooltip } from 'chart.js'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'
import { MonthNav } from '../../components/MonthNav'
import { ScreenHeader } from '../../components/ScreenHeader'
import { listExpensesInMonth } from '../../db/expenses'
import { intlLocale } from '../../i18n'
import { formatMonth, monthOf, todayISO } from '../../lib/dates'
import { formatARS } from '../../lib/money'
import { formatPercent, summarizeByCategory } from '../../lib/summary'
import { categoryLabel, useCategories } from '../categories/useCategories'

ChartJS.register(ArcElement, Tooltip)

interface Props {
  onSelectCategory: (month: string, categoryId: string) => void
}

export function SummaryScreen({ onSelectCategory }: Props) {
  const { t, i18n } = useTranslation()
  const locale = intlLocale(i18n.language)
  const [month, setMonth] = useState(() => monthOf(todayISO()))
  const { byId } = useCategories()
  const expenses = useLiveQuery(() => listExpensesInMonth(month), [month])
  const summary = expenses
    ? summarizeByCategory(expenses, (e) => e.amount)
    : null

  const labels =
    summary?.shares.map((s) => categoryLabel(byId.get(s.categoryId), t)) ?? []
  const totalLabel = summary ? formatARS(summary.total, locale) : '…'

  return (
    <>
      <ScreenHeader title={t('summary.title')} />
      <div className="flex flex-col gap-4 px-4 pb-6">
        <MonthNav month={month} onChange={setMonth} />

        {summary && summary.shares.length === 0 && (
          <p className="py-10 text-center text-muted">
            {t('summary.empty', {
              month: formatMonth(month, locale).toLowerCase(),
            })}
          </p>
        )}

        {summary && summary.shares.length > 0 && (
          <>
            <figure
              className="relative mx-auto aspect-square w-full max-w-64"
              aria-label={t('summary.chartLabel', { total: totalLabel })}
            >
              <Doughnut
                data={{
                  labels,
                  datasets: [
                    {
                      data: summary.shares.map((s) => s.amount / 100),
                      backgroundColor: summary.shares.map(
                        (s) => byId.get(s.categoryId)?.color ?? '#8a978f',
                      ),
                      borderColor: '#f3f5f2',
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  cutout: '68%',
                  maintainAspectRatio: true,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (item) => {
                          const share = summary.shares[item.dataIndex]
                          return `${formatARS(share.amount, locale)} · ${formatPercent(share.percent, locale)}`
                        },
                      },
                    },
                  },
                  onClick: (_event, elements) => {
                    const index = elements[0]?.index
                    if (index !== undefined)
                      onSelectCategory(month, summary.shares[index].categoryId)
                  },
                }}
              />
              <figcaption className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm text-muted">{t('summary.total')}</span>
                <span className="font-mono text-xl tabular-nums">
                  {totalLabel}
                </span>
              </figcaption>
            </figure>

            <ul aria-label={t('summary.legend')}>
              {summary.shares.map((share) => {
                const category = byId.get(share.categoryId)
                return (
                  <li key={share.categoryId}>
                    <button
                      type="button"
                      onClick={() => onSelectCategory(month, share.categoryId)}
                      className="flex w-full items-center gap-3 border-b border-line py-3 text-left"
                    >
                      <span
                        className="size-2.5 flex-none rounded-full"
                        style={{ background: category?.color }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {categoryLabel(category, t)}
                      </span>
                      <span className="text-right">
                        <span className="block font-mono tabular-nums">
                          {formatARS(share.amount, locale)}
                        </span>
                        <span className="block font-mono text-sm text-muted tabular-nums">
                          {formatPercent(share.percent, locale)}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
