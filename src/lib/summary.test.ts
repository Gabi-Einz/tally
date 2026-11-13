import { describe, expect, it } from 'vitest'
import type { Expense } from '../db/types'
import { formatPercent, summarizeByCategory } from './summary'

const expense = (categoryId: string, amount: number | null) =>
  ({ categoryId, amount }) as Expense

describe('summarizeByCategory', () => {
  it('suma por categoría, ordena de mayor a menor y calcula porcentajes', () => {
    const summary = summarizeByCategory(
      [
        expense('comida', 1000),
        expense('supermercado', 3000),
        expense('comida', 1000),
        expense('salud', 0),
      ],
      (e) => e.amount,
    )
    expect(summary.total).toBe(5000)
    expect(summary.shares).toEqual([
      { categoryId: 'supermercado', amount: 3000, percent: 60 },
      { categoryId: 'comida', amount: 2000, percent: 40 },
    ])
    expect(summary.missing).toBe(0)
  })

  it('cuenta aparte los gastos sin valor', () => {
    const summary = summarizeByCategory(
      [expense('comida', 1000), expense('comida', null)],
      (e) => e.amount,
    )
    expect(summary.total).toBe(1000)
    expect(summary.missing).toBe(1)
  })

  it('los porcentajes suman 100', () => {
    const summary = summarizeByCategory(
      [expense('a', 1), expense('b', 1), expense('c', 1)],
      (e) => e.amount,
    )
    const sum = summary.shares.reduce((s, x) => s + x.percent, 0)
    expect(sum).toBeCloseTo(100)
  })

  it('formatea el porcentaje con un decimal', () => {
    expect(formatPercent(39.4085).replace(/\s/g, ' ')).toBe('39,4%')
  })
})
