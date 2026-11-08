import type { Expense } from '../db/types'

export interface CategoryShare {
  categoryId: string
  amount: number
  percent: number
}

export interface MonthSummary {
  total: number
  shares: CategoryShare[]
  missing: number
}

export function summarizeByCategory(
  expenses: Expense[],
  valueOf: (expense: Expense) => number | null,
): MonthSummary {
  const totals = new Map<string, number>()
  let missing = 0
  for (const e of expenses) {
    const value = valueOf(e)
    if (value === null) {
      missing++
      continue
    }
    totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + value)
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0)
  const shares = [...totals]
    .filter(([, amount]) => amount > 0)
    .map(([categoryId, amount]) => ({
      categoryId,
      amount,
      percent: total ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
  return { total, shares, missing }
}

export function formatPercent(percent: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(percent / 100)
}
