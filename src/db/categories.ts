import { OTHER_CATEGORY_ID } from '../data/categories'
import { newId } from '../lib/id'
import { db } from './db'
import type { Category } from './types'

export interface CategoryInput {
  name: string
  color: string
  keywords: string[]
}

export async function addCategory(
  input: CategoryInput,
  now = Date.now(),
): Promise<Category> {
  const name = input.name.trim()
  if (!name) throw new Error('La categoría necesita un nombre')
  const keywords = [
    ...new Set(input.keywords.map((k) => k.trim().toLowerCase())),
  ].filter(Boolean)

  return db.transaction('rw', db.categories, async () => {
    const all = await db.categories.orderBy('order').toArray()
    const other = all.find((c) => c.id === OTHER_CATEGORY_ID)
    const order = other ? other.order : (all.at(-1)?.order ?? -1) + 1
    // "Otros" queda siempre al final
    if (other) await db.categories.update(other.id, { order: order + 1 })
    const category: Category = {
      id: newId(),
      name,
      color: input.color,
      keywords,
      description: '',
      builtin: false,
      order,
      updatedAt: now,
    }
    await db.categories.add(category)
    return category
  })
}
