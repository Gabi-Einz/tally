import { ArcElement, Chart as ChartJS, Tooltip, type Plugin } from 'chart.js'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'
import { MonthNav } from '../../components/MonthNav'
import { ScreenHeader } from '../../components/ScreenHeader'
import { listExpensesInMonth } from '../../db/expenses'
import { intlLocale } from '../../i18n'
import { formatMonth, monthOf, todayISO } from '../../lib/dates'
import { formatPercent, summarizeByCategory } from '../../lib/summary'
import { categoryLabel, useCategories } from '../categories/useCategories'
import { formatIn, valueIn, type DisplayCurrency } from '../currency/format'

const CURRENCIES: DisplayCurrency[] = ['ARS', 'USD_BLUE', 'USD_CRIPTO']

ChartJS.register(ArcElement, Tooltip)

// Por debajo de este porcentaje la porción es muy angosta para el texto
const MIN_LABEL_PERCENT = 5

const percentLabels: Plugin<'doughnut'> = {
  id: 'percentLabels',
  afterDatasetsDraw(chart) {
    const values = chart.data.datasets[0].data as number[]
    const total = values.reduce((sum, v) => sum + v, 0)
    if (!total) return
    const { ctx } = chart
    ctx.save()
    ctx.font = `600 11px ${ChartJS.defaults.font.family}`
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    ctx.shadowBlur = 2
    chart.getDatasetMeta(0).data.forEach((arc, i) => {
      const percent = (values[i] / total) * 100
      if (percent < MIN_LABEL_PERCENT) return
      const { x, y } = arc.tooltipPosition(true)
      if (x === null || y === null) return
      ctx.fillText(formatPercent(percent), x, y)
    })
    ctx.restore()
  },
}

interface Props {
  onSelectCategory: (month: string, categoryId: string) => void
}

export function SummaryScreen({ onSelectCategory }: Props) {
  const { t, i18n } = useTranslation()
  const locale = intlLocale(i18n.language)
  const [month, setMonth] = useState(() => monthOf(todayISO()))
  const [currency, setCurrency] = useState<DisplayCurrency>('ARS')
  const { byId } = useCategories()
  const expenses = useLiveQuery(() => listExpensesInMonth(month), [month])
  const summary = expenses
    ? summarizeByCategory(expenses, (e) => valueIn(e, currency))
    : null

  const labels =
    summary?.shares.map((s) => categoryLabel(byId.get(s.categoryId), t)) ?? []
  const totalLabel = summary ? formatIn(summary.total, currency) : '…'

  return (
    <>
      <ScreenHeader title={t('summary.title')} />
      <div className="flex flex-col gap-4 px-4 pb-6">
        <MonthNav month={month} onChange={setMonth} />
        <div
          role="group"
          aria-label={t('summary.currencyLabel')}
          className="flex gap-1 rounded-xl bg-sunk p-1"
        >
          {CURRENCIES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={currency === option}
              onClick={() => setCurrency(option)}
              className={`flex-1 rounded-lg px-2 py-2 text-sm ${
                currency === option
                  ? 'bg-card font-semibold shadow-sm'
                  : 'text-muted'
              }`}
            >
              {t(`summary.currencies.${option}`)}
            </button>
          ))}
        </div>
        {summary && summary.missing > 0 && (
          <p
            role="status"
            className="rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn"
          >
            {t('summary.missing', { count: summary.missing })}
          </p>
        )}

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
                plugins={[percentLabels]}
                data={{
                  labels,
                  datasets: [
                    {
                      data: summary.shares.map((s) => s.amount / 100),
                      backgroundColor: summary.shares.map(
                        (s) => byId.get(s.categoryId)?.color ?? '#8a978f',
                      ),
                      borderWidth: 0,
                      spacing: 2,
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
                          return `${formatIn(share.amount, currency)} · ${formatPercent(share.percent)}`
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
                          {formatIn(share.amount, currency)}
                        </span>
                        <span className="block font-mono text-sm text-muted tabular-nums">
                          {formatPercent(share.percent)}
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
