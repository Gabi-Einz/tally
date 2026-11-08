import { recalculate } from '../features/currency/convert'
import { monthRange } from '../lib/dates'
import { newId } from '../lib/id'
import { db } from './db'
import type { CategorySource, DictationLang, Expense } from './types'

export interface ExpenseInput {
  amount: number
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
    amount: input.amount,
    currency: 'ARS',
    originalAmount: input.amount,
    originalCurrency: 'ARS',
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
  const dateChanged = existing.date !== input.date
  await db.expenses.update(id, {
    usdBlue: dateChanged ? null : recalculate(existing.usdBlue, input.amount),
    usdCripto: dateChanged
      ? null
      : recalculate(existing.usdCripto, input.amount),
    amount: input.amount,
    originalAmount: input.amount,
    originalCurrency: 'ARS',
    description: input.description.trim(),
    categoryId: input.categoryId,
    date: input.date,
    updatedAt: now,
    ...classification,
  })
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
