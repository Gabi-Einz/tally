import { recalculate } from '../features/currency/convert'
import { monthRange } from '../lib/dates'
import { newId } from '../lib/id'
import { db } from './db'
import type {
  CategorySource,
  CurrencyCode,
  DictationLang,
  Expense,
} from './types'

export interface ExpenseInput {
  amount: number
  currency?: CurrencyCode
  date: string
  description: string
  categoryId: string
}

export interface ExpenseOrigin {
  rawTranscript: string
  dictationLang: DictationLang
  categorySource: CategorySource
  confidence: number
}

const MANUAL_ORIGIN: ExpenseOrigin = {
  rawTranscript: '',
  dictationLang: 'es-AR',
  categorySource: 'manual',
  confidence: 1,
}

export async function createExpense(
  input: ExpenseInput,
  now = Date.now(),
  origin: ExpenseOrigin = MANUAL_ORIGIN,
): Promise<Expense> {
  const expense: Expense = {
    id: newId(),
    amount: input.currency === 'USD' ? null : input.amount,
    currency: 'ARS',
    originalAmount: input.amount,
    originalCurrency: input.currency ?? 'ARS',
    dictationLang: origin.dictationLang,
    usdBlue: null,
    usdCripto: null,
    description: input.description.trim(),
    categoryId: input.categoryId,
    date: input.date,
    rawTranscript: origin.rawTranscript,
    categorySource: origin.categorySource,
    confidence: origin.confidence,
    createdAt: now,
    updatedAt: now,
  }
  await db.expenses.add(expense)
  return expense
}

export async function updateExpense(
  id: string,
  input: ExpenseInput,
  now = Date.now(),
  classification?: Pick<ExpenseOrigin, 'categorySource' | 'confidence'>,
): Promise<void> {
  const existing = await db.expenses.get(id)
  if (!existing) return
  await db.expenses.update(id, {
    ...amountsAfterEdit(existing, input),
    description: input.description.trim(),
    categoryId: input.categoryId,
    date: input.date,
    updatedAt: now,
    ...classification,
  })
}

function amountsAfterEdit(
  existing: Expense,
  input: ExpenseInput,
): Pick<
  Expense,
  'amount' | 'originalAmount' | 'originalCurrency' | 'usdBlue' | 'usdCripto'
> {
  const dateChanged = existing.date !== input.date
  if (input.currency !== 'USD') {
    return {
      amount: input.amount,
      originalAmount: input.amount,
      originalCurrency: 'ARS',
      usdBlue: dateChanged ? null : recalculate(existing.usdBlue, input.amount),
      usdCripto: dateChanged
        ? null
        : recalculate(existing.usdCripto, input.amount),
    }
  }
  const blue = dateChanged ? null : existing.usdBlue
  if (!blue)
    return {
      amount: null,
      originalAmount: input.amount,
      originalCurrency: 'USD',
      usdBlue: null,
      usdCripto: null,
    }
  const amount = Math.round(input.amount * blue.rate)
  return {
    amount,
    originalAmount: input.amount,
    originalCurrency: 'USD',
    usdBlue: { ...blue, amount: input.amount },
    usdCripto: recalculate(existing.usdCripto, amount),
  }
}

export async function deleteExpense(id: string): Promise<void> {
  await db.expenses.delete(id)
}

export async function listExpensesInMonth(month: string): Promise<Expense[]> {
  const [first, last] = monthRange(month)
  const list = await db.expenses
    .where('date')
    .between(first, last, true, true)
    .toArray()
  return list.sort(byNewest)
}

export async function recentExpenses(limit: number): Promise<Expense[]> {
  return db.expenses
    .orderBy('[date+createdAt]')
    .reverse()
    .limit(limit)
    .toArray()
}

export function totalAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0)
}

function byNewest(a: Expense, b: Expense): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  return b.createdAt - a.createdAt
}
