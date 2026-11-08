import Dexie, { type EntityTable, type Transaction } from 'dexie'
import { defaultCategories } from '../data/categories'
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
    this.on('populate', (tx) =>
      tx.table('categories').bulkAdd(defaultCategories(Date.now())),
    )
  }
}

export const db = new TallyDB()
