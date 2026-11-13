import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { defaultCategories, OTHER_CATEGORY_ID } from '../data/categories'
import { TallyDB } from './db'
import type { Category } from './types'

const NAME = 'tally-migracion'

async function createV3Database() {
  await Dexie.delete(NAME)
  const old = new Dexie(NAME)
  old.version(3).stores({
    expenses: 'id, date, categoryId, [date+createdAt]',
    categories: 'id, order',
    rules: 'id, &pattern',
    exchangeRates: 'id, date',
    settings: 'key',
  })
  const base = defaultCategories(0).filter(
    (c) =>
      !['verduleria', 'carniceria', 'restaurantes', 'cafeteria'].includes(c.id),
  )
  const food: Category = {
    id: 'comida',
    name: null,
    color: '#123456',
    keywords: ['pizza', 'cafe', 'choripan'],
    description: '',
    builtin: true,
    order: 1,
    updatedAt: 0,
  }
  const market = base.find((c) => c.id === 'supermercado')!
  market.keywords = [...market.keywords, 'verduleria', 'carniceria', 'frutas']
  const custom: Category = {
    ...food,
    id: 'propia',
    name: 'Deportes',
    builtin: false,
    order: 50,
  }
  await old.table('categories').bulkAdd([...base, food, custom])
  await old.table('expenses').add({
    id: 'g1',
    categoryId: 'comida',
    date: '2026-11-01',
    createdAt: 0,
    updatedAt: 0,
  })
  await old.table('rules').add({
    id: 'r1',
    pattern: 'choripan',
    categoryId: 'comida',
    hits: 2,
    updatedAt: 0,
  })
  old.close()
}

describe('migración a la versión 4', () => {
  it('separa "Comida y restaurantes" y saca verdulería y carnicería de Supermercado', async () => {
    await createV3Database()
    const db = new TallyDB(NAME)
    await db.open()

    const categories = await db.categories.orderBy('order').toArray()
    expect(categories.map((c) => c.id)).toEqual([
      ...defaultCategories(0)
        .map((c) => c.id)
        .filter((id) => id !== OTHER_CATEGORY_ID),
      'propia',
      OTHER_CATEGORY_ID,
    ])
    expect(await db.categories.get('comida')).toBeUndefined()
    expect((await db.expenses.get('g1'))?.categoryId).toBe('restaurantes')
    expect((await db.rules.get('r1'))?.categoryId).toBe('restaurantes')

    const restaurants = await db.categories.get('restaurantes')
    expect(restaurants?.color).toBe('#123456')
    expect(restaurants?.keywords).toContain('choripan')
    expect(restaurants?.keywords).not.toContain('cafe')

    const market = await db.categories.get('supermercado')
    expect(market?.keywords).not.toContain('verduleria')
    expect(market?.keywords).not.toContain('frutas')
    db.close()
    await Dexie.delete(NAME)
  })
})
