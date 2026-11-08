import { keyWords } from '../features/categorizer/categorize'
import { newId } from '../lib/id'
import { db } from './db'

export async function learnCategory(
  description: string,
  categoryId: string,
  now = Date.now(),
): Promise<void> {
  const patterns = keyWords(description).filter((w) => w.length >= 3)
  await db.transaction('rw', db.rules, async () => {
    for (const pattern of patterns) {
      const existing = await db.rules.where('pattern').equals(pattern).first()
      if (!existing) {
        await db.rules.add({
          id: newId(),
          pattern,
          categoryId,
          hits: 1,
          updatedAt: now,
        })
      } else if (existing.categoryId === categoryId) {
        await db.rules.update(existing.id, {
          hits: existing.hits + 1,
          updatedAt: now,
        })
      } else {
        await db.rules.update(existing.id, {
          categoryId,
          hits: 1,
          updatedAt: now,
        })
      }
    }
  })
}

export async function confirmRule(pattern: string, now = Date.now()) {
  const rule = await db.rules.where('pattern').equals(pattern).first()
  if (rule)
    await db.rules.update(rule.id, { hits: rule.hits + 1, updatedAt: now })
}

export async function deleteRule(id: string): Promise<void> {
  await db.rules.delete(id)
}
