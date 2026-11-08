import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from '../../components/ScreenHeader'
import { db } from '../../db/db'
import { createExpense, updateExpense } from '../../db/expenses'
import { confirmRule, learnCategory } from '../../db/rules'
import type { Expense, LearnedRule } from '../../db/types'
import { todayISO } from '../../lib/dates'
import { formatAmountInput, parseAmountInput } from '../../lib/money'
import { categoryLabel, useCategories } from '../categories/useCategories'
import { categorize, LOW_CONFIDENCE } from '../categorizer/categorize'
import type { ExpenseDraft } from './draft'

interface Props {
  id?: string
  draft?: ExpenseDraft
  onDone: () => void
  onRetry?: () => void
}

export function ExpenseForm({ id, draft, onDone, onRetry }: Props) {
  const { t } = useTranslation()
  const existing = useLiveQuery(
    async () => (id ? ((await db.expenses.get(id)) ?? null) : null),
    [id],
  )

  if (id && existing === undefined)
    return <ScreenHeader title={t('form.titleEdit')} onBack={onDone} />

  return (
    <ExpenseFormFields
      key={existing?.id ?? 'new'}
      existing={existing ?? null}
      draft={draft}
      onDone={onDone}
      onRetry={onRetry}
    />
  )
}

type Field = 'amount' | 'date' | 'description'

interface FieldsProps {
  existing: Expense | null
  draft?: ExpenseDraft
  onDone: () => void
  onRetry?: () => void
}

function initialAmount(existing: Expense | null, draft?: ExpenseDraft) {
  const cents = existing?.amount ?? draft?.amount
  return cents ? formatAmountInput(cents) : ''
}

function ExpenseFormFields({ existing, draft, onDone, onRetry }: FieldsProps) {
  const { t } = useTranslation()
  const { categories } = useCategories()
  const [amount, setAmount] = useState(() => initialAmount(existing, draft))
  const [date, setDate] = useState(existing?.date ?? draft?.date ?? todayISO())
  const [description, setDescription] = useState(
    existing?.description ?? draft?.description ?? '',
  )
  const rules = useLiveQuery(() => db.rules.toArray(), [], [] as LearnedRule[])
  const [chosenCategory, setChosenCategory] = useState<string | null>(
    existing?.categoryId ?? null,
  )
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [saving, setSaving] = useState(false)
  const transcript = existing?.rawTranscript || draft?.rawTranscript

  const suggestion = useMemo(
    () => categorize(description, categories, rules),
    [description, categories, rules],
  )
  const categoryId = chosenCategory ?? suggestion.categoryId
  const showSuggestion = chosenCategory === null && description.trim() !== ''
  const lowConfidence = showSuggestion && suggestion.confidence < LOW_CONFIDENCE

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const cents = parseAmountInput(amount)
    const next: Partial<Record<Field, string>> = {}
    if (cents === null) next.amount = t('form.errors.amount')
    if (!date) next.date = t('form.errors.date')
    if (!description.trim()) next.description = t('form.errors.description')
    setErrors(next)
    if (cents === null || Object.keys(next).length > 0) return

    setSaving(true)
    const input = { amount: cents, date, description, categoryId }
    const keptSuggestion = chosenCategory === null
    const classification = keptSuggestion
      ? { categorySource: suggestion.source, confidence: suggestion.confidence }
      : { categorySource: 'manual' as const, confidence: 1 }

    if (existing) {
      const changed = categoryId !== existing.categoryId
      await updateExpense(
        existing.id,
        input,
        Date.now(),
        changed ? classification : undefined,
      )
      if (changed) await learnCategory(description, categoryId)
    } else {
      await createExpense(input, Date.now(), {
        rawTranscript: draft?.rawTranscript ?? '',
        dictationLang: draft?.dictationLang ?? 'es-AR',
        ...classification,
      })
      if (!keptSuggestion && categoryId !== suggestion.categoryId)
        await learnCategory(description, categoryId)
      else if (suggestion.pattern) await confirmRule(suggestion.pattern)
    }
    onDone()
  }

  const inputClass = (field: Field) =>
    `w-full rounded-xl border bg-white px-3 py-3 text-base ${errors[field] ? 'border-danger' : 'border-line'}`

  const title = existing
    ? t('form.titleEdit')
    : draft
      ? t('form.titleConfirm')
      : t('form.titleNew')

  return (
    <>
      <ScreenHeader title={title} onBack={onDone} />
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4 px-4 pb-6"
      >
        {transcript && (
          <p className="rounded-xl bg-sunk px-3 py-2 font-mono text-sm">
            “{transcript}”
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">{t('form.amount')}</span>
            <input
              id="expense-amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder={t('form.amountPlaceholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={!!errors.amount}
              aria-describedby={
                errors.amount ? 'expense-amount-error' : undefined
              }
              className={`${inputClass('amount')} font-mono tabular-nums`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">{t('form.date')}</span>
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? 'expense-date-error' : undefined}
              className={inputClass('date')}
            />
          </label>
        </div>
        {errors.amount && (
          <p id="expense-amount-error" className="-mt-2 text-sm text-danger">
            {errors.amount}
          </p>
        )}
        {errors.date && (
          <p id="expense-date-error" className="-mt-2 text-sm text-danger">
            {errors.date}
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">{t('form.description')}</span>
          <input
            id="expense-description"
            autoComplete="off"
            placeholder={t('form.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? 'expense-description-error' : undefined
            }
            className={inputClass('description')}
          />
          {errors.description && (
            <span
              id="expense-description-error"
              className="text-sm text-danger"
            >
              {errors.description}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">{t('form.category')}</span>
          <select
            id="expense-category"
            value={categoryId}
            onChange={(e) => setChosenCategory(e.target.value)}
            aria-describedby="expense-category-hint"
            className={`w-full rounded-xl border bg-white px-3 py-3 text-base ${
              lowConfidence
                ? 'border-amber-500 ring-2 ring-amber-200'
                : 'border-line'
            }`}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryLabel(c, t)}
              </option>
            ))}
          </select>
        </label>
        <p
          id="expense-category-hint"
          aria-live="polite"
          className={`-mt-2 text-sm ${lowConfidence ? 'text-amber-700' : 'text-muted'}`}
        >
          {showSuggestion &&
            t(`form.suggestion.${suggestion.source}`, {
              percent: Math.round(suggestion.confidence * 100),
            })}
        </p>

        <div
          className={`grid gap-2 pt-2 ${onRetry ? 'grid-cols-[1fr_1fr_1.4fr]' : 'grid-cols-[1fr_1.4fr]'}`}
        >
          <button
            type="button"
            onClick={onDone}
            className="rounded-xl border border-line bg-white py-3 font-semibold"
          >
            {t('common.cancel')}
          </button>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl border border-line bg-white py-3 font-semibold"
            >
              {t('form.retry')}
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-60"
          >
            {existing ? t('form.saveChanges') : t('form.save')}
          </button>
        </div>
      </form>
    </>
  )
}
