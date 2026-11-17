import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Expense, UsdConversion } from '../../db/types'
import { intlLocale } from '../../i18n'
import { formatLongDate } from '../../lib/dates'
import { formatRate, formatUSD, formatUSDT } from './format'
import { hasHistory } from './rates'

export function ConversionDetails({ expense }: { expense: Expense }) {
  const { t, i18n } = useTranslation()
  const locale = intlLocale(i18n.language)
  const criptoUnavailable = !hasHistory('cripto', expense.date)

  const source = (c: UsdConversion) =>
    t(`currency.sources.${c.rateSource}`, {
      date: formatLongDate(c.rateDate, locale).toLowerCase(),
      time: new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(c.capturedAt)),
    })

  const pending = (
    <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
      {t('currency.pending')}
    </span>
  )
  const unavailable = (
    <span className="text-sm text-muted">{t('currency.unavailable')}</span>
  )

  const rateRow = (
    label: string,
    conversion: UsdConversion | null,
    missing: ReactNode,
  ) => (
    <tr>
      <th scope="row" className="py-0.5 text-left font-normal">
        {label}
      </th>
      {conversion ? (
        <>
          <td className="pl-3 text-right font-mono tabular-nums">
            {conversion.buy ? formatRate(conversion.buy) : '—'}
          </td>
          <td className="pl-3 text-right font-mono tabular-nums">
            {formatRate(conversion.rate)}
          </td>
        </>
      ) : (
        <td colSpan={2} className="text-right">
          {missing}
        </td>
      )}
    </tr>
  )

  return (
    <>
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-sm text-muted">{t('currency.rates')}</h2>
        <table className="mt-1 w-full">
          <thead>
            <tr className="text-xs text-muted">
              <td />
              <th scope="col" className="text-right font-normal">
                {t('currency.buy')}
              </th>
              <th scope="col" className="text-right font-normal">
                {t('currency.sell')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rateRow(t('currency.usdBlue'), expense.usdBlue, pending)}
            {rateRow(
              t('currency.usdt'),
              expense.usdCripto,
              criptoUnavailable ? unavailable : pending,
            )}
          </tbody>
        </table>
        {expense.usdBlue && (
          <p className="mt-1 text-xs text-muted">
            {source(expense.usdBlue)}. {t('currency.sellNote')}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-sm text-muted">{t('currency.equivalents')}</h2>
        <dl className="mt-1 flex flex-col gap-1">
          <div className="flex justify-between gap-2">
            <dt>{t('currency.usdBlue')}</dt>
            <dd className="font-mono tabular-nums">
              {expense.usdBlue ? formatUSD(expense.usdBlue.amount) : pending}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>{t('currency.usdt')}</dt>
            <dd className="font-mono tabular-nums">
              {expense.usdCripto
                ? formatUSDT(expense.usdCripto.amount)
                : criptoUnavailable
                  ? unavailable
                  : pending}
            </dd>
          </div>
        </dl>
      </section>
    </>
  )
}
