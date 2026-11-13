import { OTHER_CATEGORY_ID } from '../data/categories'
import { newId } from '../lib/id'
import { db } from './db'
import type { Category } from './types'

export interface CategoryInput {
  // null mantiene el nombre traducido de una categoría de fábrica
  name: string | null
  color: string
  keywords: string[]
}

function clean(input: CategoryInput): CategoryInput {
  const name = input.name?.trim() ?? null
  if (name === '') throw new Error('La categoría necesita un nombre')
  const keywords = [
    ...new Set(input.keywords.map((k) => k.trim().toLowerCase())),
  ].filter(Boolean)
  return { name, color: input.color, keywords }
}

export async function addCategory(
  input: CategoryInput,
  now = Date.now(),
): Promise<Category> {
  const { name, color, keywords } = clean(input)
  if (!name) throw new Error('La categoría necesita un nombre')

  return db.transaction('rw', db.categories, async () => {
    const all = await db.categories.orderBy('order').toArray()
    const other = all.find((c) => c.id === OTHER_CATEGORY_ID)
    const order = other ? other.order : (all.at(-1)?.order ?? -1) + 1
    // "Otros" queda siempre al final
    if (other) await db.categories.update(other.id, { order: order + 1 })
    const category: Category = {
      id: newId(),
      name,
      color,
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

export async function updateCategory(
  id: string,
  input: CategoryInput,
  now = Date.now(),
): Promise<void> {
  await db.categories.update(id, { ...clean(input), updatedAt: now })
}

// Los gastos de la categoría pasan a "Otros" y se borran sus reglas aprendidas
export async function deleteCategory(
  id: string,
  now = Date.now(),
): Promise<void> {
  if (id === OTHER_CATEGORY_ID) throw new Error('"Otros" no se puede borrar')
  await db.transaction('rw', db.categories, db.expenses, db.rules, async () => {
    await db.expenses
      .where('categoryId')
      .equals(id)
      .modify({ categoryId: OTHER_CATEGORY_ID, updatedAt: now })
    const rules = await db.rules.filter((r) => r.categoryId === id).toArray()
    await db.rules.bulkDelete(rules.map((r) => r.id))
    await db.categories.delete(id)
  })
}
