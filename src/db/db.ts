import Dexie, { type EntityTable, type Transaction } from 'dexie'
import { defaultCategories, OTHER_CATEGORY_ID } from '../data/categories'
import type {
  Category,
  ExchangeRate,
  Expense,
  LearnedRule,
  Setting,
} from './types'

async function mergeDefaultKeywords(tx: Transaction) {
  const defaults = new Map(
    defaultCategories(Date.now()).map((c) => [c.id, c.keywords]),
  )
  await tx
    .table<Category, string>('categories')
    .toCollection()
    .modify((category) => {
      const extra = defaults.get(category.id)
      if (!category.builtin || !extra) return
      category.keywords = [...new Set([...category.keywords, ...extra])]
    })
}

// "Comida y restaurantes" se separó en Restaurantes y Cafetería, y
// Verdulería y Carnicería salieron de Supermercado
export async function splitFoodCategories(tx: Transaction, now = Date.now()) {
  const categories = tx.table<Category, string>('categories')
  const defaults = defaultCategories(now)
  const defaultById = new Map(defaults.map((c) => [c.id, c]))
  const existing = await categories.toArray()
  const byId = new Map(existing.map((c) => [c.id, c]))
  const food = byId.get('comida')

  await tx
    .table<Expense, string>('expenses')
    .where('categoryId')
    .equals('comida')
    .modify({ categoryId: 'restaurantes', updatedAt: now })
  await tx
    .table<LearnedRule, string>('rules')
    .filter((r) => r.categoryId === 'comida')
    .modify({ categoryId: 'restaurantes', updatedAt: now })

  for (const id of ['verduleria', 'carniceria', 'restaurantes', 'cafeteria']) {
    if (!byId.has(id)) byId.set(id, defaultById.get(id)!)
  }
  if (food) {
    byId.delete('comida')
    // Conserva lo que el usuario le había cambiado a "Comida"
    const cafe = new Set(defaultById.get('cafeteria')!.keywords)
    const restaurants = byId.get('restaurantes')!
    restaurants.color = food.color
    restaurants.keywords = [
      ...new Set([
        ...restaurants.keywords,
        ...food.keywords.filter((k) => !cafe.has(k)),
      ]),
    ]
  }
  const market = byId.get('supermercado')
  if (market?.builtin) {
    const moved = new Set([
      ...defaultById.get('verduleria')!.keywords,
      ...defaultById.get('carniceria')!.keywords,
    ])
    market.keywords = market.keywords.filter((k) => !moved.has(k))
    market.description = defaultById.get('supermercado')!.description
  }

  // Orden: las de fábrica, después las del usuario y "Otros" al final
  const rank = (c: Category) =>
    c.id === OTHER_CATEGORY_ID
      ? Infinity
      : defaultById.has(c.id)
        ? defaultById.get(c.id)!.order
        : defaults.length + c.order
  const sorted = [...byId.values()].sort((a, b) => rank(a) - rank(b))
  sorted.forEach((c, order) => Object.assign(c, { order, updatedAt: now }))

  if (food) await categories.delete('comida')
  await categories.bulkPut(sorted)
}

export class TallyDB extends Dexie {
  expenses!: EntityTable<Expense, 'id'>
  categories!: EntityTable<Category, 'id'>
  rules!: EntityTable<LearnedRule, 'id'>
  exchangeRates!: EntityTable<ExchangeRate, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor(name = 'tally') {
    super(name)
    this.version(1).stores({
      expenses: 'id, date, categoryId, [date+createdAt]',
      categories: 'id, order',
      rules: 'id, &pattern',
      exchangeRates: 'id, date',
      settings: 'key',
    })
    this.version(2).upgrade(mergeDefaultKeywords)
    this.version(3).upgrade(mergeDefaultKeywords)
    this.version(4).upgrade((tx) => splitFoodCategories(tx))
    this.on('populate', (tx) =>
      tx.table('categories').bulkAdd(defaultCategories(Date.now())),
    )
  }
}

export const db = new TallyDB()
