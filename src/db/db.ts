import Dexie, { type EntityTable } from 'dexie'
import { defaultCategories } from '../data/categories'
import type {
  Category,
  ExchangeRate,
  Expense,
  LearnedRule,
  Setting,
} from './types'

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
    this.on('populate', (tx) =>
      tx.table('categories').bulkAdd(defaultCategories(Date.now())),
    )
  }
}

export const db = new TallyDB()
