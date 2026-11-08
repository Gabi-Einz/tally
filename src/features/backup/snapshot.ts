import { db } from '../../db/db'
import type { Category, Expense, LearnedRule, Setting } from '../../db/types'

export const BACKUP_VERSION = 1
const LOCAL_ONLY_SETTINGS = new Set(['semanticIndex', 'drive'])

export interface BackupSnapshot {
  app: 'tally'
  version: number
  exportedAt: number
  expenses: Expense[]
  categories: Category[]
  rules: LearnedRule[]
  settings: Setting[]
}

export async function createSnapshot(
  now = Date.now(),
): Promise<BackupSnapshot> {
  const [expenses, categories, rules, settings] = await Promise.all([
    db.expenses.toArray(),
    db.categories.toArray(),
    db.rules.toArray(),
    db.settings.toArray(),
  ])
  return {
    app: 'tally',
    version: BACKUP_VERSION,
    exportedAt: now,
    expenses,
    categories,
    rules,
    settings: settings.filter((s) => !LOCAL_ONLY_SETTINGS.has(s.key)),
  }
}

export function isSnapshot(value: unknown): value is BackupSnapshot {
  const v = value as Partial<BackupSnapshot> | null
  return (
    !!v &&
    v.app === 'tally' &&
    typeof v.version === 'number' &&
    Array.isArray(v.expenses) &&
    Array.isArray(v.categories) &&
    Array.isArray(v.rules) &&
    Array.isArray(v.settings)
  )
}

function newerById<T extends { updatedAt: number }>(
  local: T[],
  remote: T[],
  key: (item: T) => string,
): T[] {
  const localById = new Map(local.map((item) => [key(item), item]))
  return remote.filter((item) => {
    const current = localById.get(key(item))
    return !current || item.updatedAt > current.updatedAt
  })
}

export interface RestoreResult {
  expenses: number
  categories: number
  rules: number
}

export async function restoreSnapshot(
  snapshot: BackupSnapshot,
): Promise<RestoreResult> {
  return db.transaction(
    'rw',
    [db.expenses, db.categories, db.rules, db.settings],
    async () => {
      const expenses = newerById(
        await db.expenses.toArray(),
        snapshot.expenses,
        (e) => e.id,
      )
      const categories = newerById(
        await db.categories.toArray(),
        snapshot.categories,
        (c) => c.id,
      )
      const rules = newerById(
        await db.rules.toArray(),
        snapshot.rules,
        (r) => r.pattern,
      )
      for (const rule of rules) {
        const existing = await db.rules
          .where('pattern')
          .equals(rule.pattern)
          .first()
        if (existing) await db.rules.delete(existing.id)
      }
      await db.expenses.bulkPut(expenses)
      await db.categories.bulkPut(categories)
      await db.rules.bulkPut(rules)
      for (const setting of snapshot.settings) {
        if (LOCAL_ONLY_SETTINGS.has(setting.key)) continue
        if (!(await db.settings.get(setting.key)))
          await db.settings.put(setting)
      }
      return {
        expenses: expenses.length,
        categories: categories.length,
        rules: rules.length,
      }
    },
  )
}
