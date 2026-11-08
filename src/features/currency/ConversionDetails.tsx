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
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
      {t('currency.pending')}
    </span>
  )
  const unavailable = (
    <span className="text-sm text-muted">{t('currency.unavailable')}</span>
  )

  return (
    <>
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="text-sm text-muted">{t('currency.rates')}</h2>
        <dl className="mt-1 flex flex-col gap-1 font-mono tabular-nums">
          <div className="flex gap-2">
            <dt>1 USD =</dt>
            <dd>
              {expense.usdBlue
                ? formatRate(expense.usdBlue.rate, locale)
                : pending}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt>1 USDT =</dt>
            <dd>
              {expense.usdCripto
                ? formatRate(expense.usdCripto.rate, locale)
                : criptoUnavailable
                  ? unavailable
                  : pending}
            </dd>
          </div>
        </dl>
        {expense.usdBlue && (
          <p className="mt-1 text-xs text-muted">{source(expense.usdBlue)}</p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="text-sm text-muted">{t('currency.equivalents')}</h2>
        <dl className="mt-1 flex flex-col gap-1">
          <div className="flex justify-between gap-2">
            <dt>{t('currency.usdBlue')}</dt>
            <dd className="font-mono tabular-nums">
              {expense.usdBlue
                ? formatUSD(expense.usdBlue.amount, locale)
                : pending}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>{t('currency.usdt')}</dt>
            <dd className="font-mono tabular-nums">
              {expense.usdCripto
                ? formatUSDT(expense.usdCripto.amount, locale)
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
