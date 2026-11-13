import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from '../../components/ScreenHeader'
import { db } from '../../db/db'
import { createExpense, updateExpense } from '../../db/expenses'
import { convertSoon } from '../currency/pendingConversions'
import { confirmRule, learnCategory } from '../../db/rules'
import type { CurrencyCode, Expense, LearnedRule } from '../../db/types'
import { formatARS } from '../../lib/money'
import { formatRate } from '../currency/format'
import { useBlueRate } from '../currency/useBlueRate'
import { todayISO } from '../../lib/dates'
import { formatAmountInput, parseAmountInput } from '../../lib/money'
import { categoryLabel, useCategories } from '../categories/useCategories'
import { categorize, LOW_CONFIDENCE } from '../categorizer/categorize'
import { useSemanticSuggestion } from '../categorizer/useSemanticSuggestion'
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
  const cents = existing ? existing.originalAmount : draft?.amount
  return cents ? formatAmountInput(cents) : ''
}

function ExpenseFormFields({ existing, draft, onDone, onRetry }: FieldsProps) {
  const { t } = useTranslation()
  const { categories } = useCategories()
  const [amount, setAmount] = useState(() => initialAmount(existing, draft))
  const [currency, setCurrency] = useState<CurrencyCode>(
    existing?.originalCurrency ?? draft?.currency ?? 'ARS',
  )
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

  const baseSuggestion = useMemo(
    () => categorize(description, categories, rules),
    [description, categories, rules],
  )
  const semanticSuggestion = useSemanticSuggestion(
    description,
    categories,
    baseSuggestion.source === 'fallback',
  )
  const suggestion = semanticSuggestion ?? baseSuggestion
  const categoryId = chosenCategory ?? suggestion.categoryId
  const showSuggestion = chosenCategory === null && description.trim() !== ''
  const lowConfidence = showSuggestion && suggestion.confidence < LOW_CONFIDENCE
  const blueRate = useBlueRate(date, currency === 'USD')
  const usdCents = currency === 'USD' ? parseAmountInput(amount) : null
  const estimate =
    blueRate?.state === 'ready'
      ? usdCents
        ? t('form.estimate', {
            amount: formatARS(Math.round(usdCents * blueRate.rate)),
            rate: formatRate(blueRate.rate),
          })
        : t('form.estimateRate', { rate: formatRate(blueRate.rate) })
      : blueRate?.state === 'unavailable'
        ? t('form.estimateOffline')
        : ''

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
    const input = { amount: cents, currency, date, description, categoryId }
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
      convertSoon(existing.id)
    } else {
      const created = await createExpense(input, Date.now(), {
        rawTranscript: draft?.rawTranscript ?? '',
        dictationLang: draft?.dictationLang ?? 'es-AR',
        ...classification,
      })
      if (!keptSuggestion && categoryId !== suggestion.categoryId)
        await learnCategory(description, categoryId)
      else if (suggestion.pattern) await confirmRule(suggestion.pattern)
      convertSoon(created.id)
    }
    onDone()
  }

  const inputClass = (field: Field) =>
    `w-full rounded-xl border bg-card px-3 py-3 text-base ${errors[field] ? 'border-danger' : 'border-line'}`

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
        <div
          role="group"
          aria-label={t('form.currency')}
          className="-mt-1 flex items-center gap-2"
        >
          {(['ARS', 'USD'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={currency === option}
              onClick={() => setCurrency(option)}
              className={`rounded-full px-3 py-1 text-sm ${
                currency === option
                  ? 'bg-brand-soft font-semibold text-brand'
                  : 'bg-sunk text-muted'
              }`}
            >
              {t(`form.currencies.${option}`)}
            </button>
          ))}
          {currency === 'USD' && (
            <span aria-live="polite" className="text-sm text-muted">
              {estimate}
            </span>
          )}
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
            className={`w-full rounded-xl border bg-card px-3 py-3 text-base ${
              lowConfidence
                ? 'border-warn ring-2 ring-warn-soft'
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
          className={`-mt-2 text-sm ${lowConfidence ? 'text-warn' : 'text-muted'}`}
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
            className="rounded-xl border border-line bg-card py-3 font-semibold"
          >
            {t('common.cancel')}
          </button>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl border border-line bg-card py-3 font-semibold"
            >
              {t('form.retry')}
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand py-3 font-semibold text-on-brand disabled:opacity-60"
          >
            {existing ? t('form.saveChanges') : t('form.save')}
          </button>
        </div>
      </form>
    </>
  )
}
