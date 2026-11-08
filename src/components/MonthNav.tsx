import { useTranslation } from 'react-i18next'
import { intlLocale } from '../i18n'
import { addMonths, formatMonth } from '../lib/dates'

interface Props {
  month: string
  onChange: (month: string) => void
}

export function MonthNav({ month, onChange }: Props) {
  const { t, i18n } = useTranslation()
  const buttonClass =
    'grid size-10 place-items-center rounded-full text-2xl text-muted hover:bg-sunk'
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => onChange(addMonths(month, -1))}
        aria-label={t('expenses.previousMonth')}
        className={buttonClass}
      >
        ‹
      </button>
      <span className="font-semibold">
        {formatMonth(month, intlLocale(i18n.language))}
      </span>
      <button
        type="button"
        onClick={() => onChange(addMonths(month, 1))}
        aria-label={t('expenses.nextMonth')}
        className={buttonClass}
      >
        ›
      </button>
    </div>
  )
}
