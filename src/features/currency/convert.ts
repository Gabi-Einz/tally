import { db } from '../../db/db'
import type { DollarType, Expense, UsdConversion } from '../../db/types'
import { todayISO } from '../../lib/dates'
import { getRate, hasHistory, RateUnavailableError } from './rates'

const FIELDS: Record<DollarType, 'usdBlue' | 'usdCripto'> = {
  blue: 'usdBlue',
  cripto: 'usdCripto',
}

export function toUsdCents(arsCents: number, rate: number): number {
  return Math.round(arsCents / rate)
}

export function recalculate(
  conversion: UsdConversion | null,
  arsCents: number | null,
): UsdConversion | null {
  if (!conversion || arsCents === null) return conversion
  return { ...conversion, amount: toUsdCents(arsCents, conversion.rate) }
}

export function isPendingConversion(expense: Expense): boolean {
  return (
    expense.amount !== null &&
    (expense.usdBlue === null ||
      (expense.usdCripto === null && hasHistory('cripto', expense.date)))
  )
}

export async function convertExpense(
  id: string,
  today = todayISO(),
  now = Date.now(),
): Promise<boolean> {
  const expense = await db.expenses.get(id)
  if (!expense || expense.amount === null) return true
  const updates: Partial<Expense> = {}
  let complete = true

  for (const type of ['blue', 'cripto'] as const) {
    const field = FIELDS[type]
    if (expense[field] !== null || !hasHistory(type, expense.date)) continue
    try {
      const rate = await getRate(type, expense.date, today, now)
      updates[field] = {
        rate: rate.sell,
        amount: toUsdCents(expense.amount, rate.sell),
        rateDate: rate.rateDate,
        rateSource: rate.source,
        capturedAt: rate.capturedAt,
      }
    } catch (error) {
      if (!(error instanceof RateUnavailableError)) complete = false
    }
  }

  if (Object.keys(updates).length > 0) {
    await db.transaction('rw', db.expenses, async () => {
      const latest = await db.expenses.get(id)
      if (
        latest &&
        latest.date === expense.date &&
        latest.amount === expense.amount
      )
        await db.expenses.update(id, updates)
    })
  }
  return complete
}

export async function convertPending(
  today = todayISO(),
  now = Date.now(),
): Promise<boolean> {
  const pending = (await db.expenses.toArray()).filter(isPendingConversion)
  let complete = true
  for (const expense of pending) {
    if (!(await convertExpense(expense.id, today, now))) complete = false
  }
  return complete
}
