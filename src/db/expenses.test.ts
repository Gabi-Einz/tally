import { describe, expect, it } from 'vitest'
import { OTHER_CATEGORY_ID } from '../data/categories'
import { db } from './db'
import {
  createExpense,
  deleteExpense,
  listExpensesInMonth,
  recentExpenses,
  totalAmount,
  updateExpense,
} from './expenses'

const base = {
  amount: 230000,
  date: '2026-11-08',
  description: 'Farmacia',
  categoryId: 'salud',
}

describe('base de datos', () => {
  it('crea las 13 categorías por defecto, con "Otros" al final', async () => {
    const categories = await db.categories.orderBy('order').toArray()
    expect(categories).toHaveLength(13)
    expect(categories.at(-1)?.id).toBe(OTHER_CATEGORY_ID)
    expect(categories.every((c) => c.builtin && c.name === null)).toBe(true)
  })

  it('guarda un gasto manual en pesos, sin dólares todavía', async () => {
    const created = await createExpense(
      { ...base, description: '  Farmacia  ' },
      1000,
    )
    const stored = await db.expenses.get(created.id)
    expect(stored).toMatchObject({
      amount: 230000,
      originalAmount: 230000,
      originalCurrency: 'ARS',
      description: 'Farmacia',
      categorySource: 'manual',
      usdBlue: null,
      usdCripto: null,
      createdAt: 1000,
      updatedAt: 1000,
    })
  })

  it('edita y elimina', async () => {
    const { id } = await createExpense(base, 1000)
    await updateExpense(
      id,
      { ...base, amount: 500000, description: 'Médico' },
      2000,
    )
    expect(await db.expenses.get(id)).toMatchObject({
      amount: 500000,
      originalAmount: 500000,
      description: 'Médico',
      updatedAt: 2000,
    })

    await deleteExpense(id)
    expect(await db.expenses.get(id)).toBeUndefined()
  })

  it('lista solo el mes pedido, del más nuevo al más viejo', async () => {
    await createExpense(
      { ...base, date: '2026-10-31', description: 'Octubre' },
      1,
    )
    await createExpense(
      { ...base, date: '2026-11-01', description: 'Primero' },
      2,
    )
    await createExpense(
      { ...base, date: '2026-11-30', description: 'Último' },
      3,
    )
    await createExpense(
      { ...base, date: '2026-11-01', description: 'Primero, más tarde' },
      4,
    )
    await createExpense(
      { ...base, date: '2026-12-01', description: 'Diciembre' },
      5,
    )

    const november = await listExpensesInMonth('2026-11')
    expect(november.map((e) => e.description)).toEqual([
      'Último',
      'Primero, más tarde',
      'Primero',
    ])
    expect(totalAmount(november)).toBe(690000)
  })

  it('devuelve los últimos gastos por fecha y hora de carga', async () => {
    await createExpense({ ...base, date: '2026-11-05', description: 'A' }, 1)
    await createExpense({ ...base, date: '2026-11-08', description: 'B' }, 2)
    await createExpense({ ...base, date: '2026-11-08', description: 'C' }, 3)
    const recent = await recentExpenses(2)
    expect(recent.map((e) => e.description)).toEqual(['C', 'B'])
  })

  it('no suma los gastos sin monto en pesos', () => {
    expect(
      totalAmount([
        { amount: 100 },
        { amount: null },
        { amount: 250 },
      ] as never),
    ).toBe(350)
  })
})
