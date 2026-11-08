import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from '../../components/ScreenHeader'
import { db } from '../../db/db'
import { deleteExpense } from '../../db/expenses'
import { intlLocale } from '../../i18n'
import { formatLongDate } from '../../lib/dates'
import { formatARS } from '../../lib/money'
import { categoryLabel, useCategories } from '../categories/useCategories'
import { ConversionDetails } from '../currency/ConversionDetails'

interface Props {
  id: string
  onBack: () => void
  onEdit: (id: string) => void
}

export function ExpenseDetail({ id, onBack, onEdit }: Props) {
  const { t, i18n } = useTranslation()
  const locale = intlLocale(i18n.language)
  const { byId } = useCategories()
  const expense = useLiveQuery(
    async () => (await db.expenses.get(id)) ?? null,
    [id],
  )
  const [confirming, setConfirming] = useState(false)

  if (expense === undefined)
    return <ScreenHeader title={t('detail.title')} onBack={onBack} />

  if (expense === null) {
    return (
      <>
        <ScreenHeader title={t('detail.title')} onBack={onBack} />
        <p className="px-4 py-10 text-center text-muted">
          {t('detail.notFound')}
        </p>
      </>
    )
  }

  const category = byId.get(expense.categoryId)

  const handleDelete = async () => {
    await deleteExpense(expense.id)
    onBack()
  }

  return (
    <>
      <ScreenHeader title={t('detail.title')} onBack={onBack} />
      <div className="flex flex-col gap-4 px-4 pb-6">
        <div>
          <p className="font-mono text-4xl tabular-nums">
            {expense.amount === null ? '—' : formatARS(expense.amount, locale)}
          </p>
          <p className="text-sm text-muted">
            {formatLongDate(expense.date, locale)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-sm text-muted">{t('detail.description')}</dt>
            <dd className="font-semibold break-words">{expense.description}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{t('detail.category')}</dt>
            <dd className="flex items-center gap-2 font-semibold">
              <span
                className="size-2.5 flex-none rounded-full"
                style={{ background: category?.color }}
                aria-hidden="true"
              />
              {categoryLabel(category, t)}
            </dd>
          </div>
        </dl>

        <ConversionDetails expense={expense} />

        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="text-sm text-muted">{t('detail.origin')}</h2>
          {expense.rawTranscript ? (
            <p className="mt-2 rounded-lg bg-sunk px-3 py-2 font-mono text-sm">
              “{expense.rawTranscript}”
            </p>
          ) : (
            <p className="mt-1">{t('detail.manualEntry')}</p>
          )}
        </section>

        {confirming ? (
          <div
            role="alertdialog"
            aria-labelledby="confirm-delete"
            className="rounded-2xl border border-danger/40 bg-danger/5 p-4"
          >
            <p id="confirm-delete" className="mb-3 font-semibold">
              {t('detail.confirmDelete')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-xl border border-line bg-white py-3 font-semibold"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-danger py-3 font-semibold text-white"
              >
                {t('detail.confirmDeleteYes')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onEdit(expense.id)}
              className="rounded-xl border border-line bg-white py-3 font-semibold"
            >
              {t('detail.edit')}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-xl border border-line bg-white py-3 font-semibold text-danger"
            >
              {t('detail.delete')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
