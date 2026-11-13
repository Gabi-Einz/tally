import { useLiveQuery } from 'dexie-react-hooks'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { db } from '../../db/db'
import type { Category } from '../../db/types'
import i18n, { type AppLanguage } from '../../i18n'
import type es from '../../locales/es'

export function useCategories() {
  const categories = useLiveQuery(
    () => db.categories.orderBy('order').toArray(),
    [],
    [] as Category[],
  )
  const byId = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )
  return { categories, byId }
}

export function categoryLabel(
  category: Category | undefined,
  t: TFunction,
): string {
  if (!category) return ''
  const custom = category.names?.[appLanguage()] ?? category.name
  if (custom) return custom
  return t(`categories.${category.id as keyof typeof es.categories}`)
}

export function appLanguage(): AppLanguage {
  return i18n.language.startsWith('en') ? 'en' : 'es'
}
