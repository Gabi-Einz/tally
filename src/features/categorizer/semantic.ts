import { OTHER_CATEGORY_ID } from '../../data/categories'
import type { Category } from '../../db/types'

export const EMBEDDING_MODEL = 'Xenova/multilingual-e5-small'
export const SEMANTIC_MIN_SIMILARITY = 0.83
const SEMANTIC_FULL_SIMILARITY = 0.93
const SEMANTIC_MAX_CONFIDENCE = 0.85

export interface SemanticEntry {
  categoryId: string
  vector: number[]
}

export interface SemanticMatch {
  categoryId: string
  similarity: number
}

export function categoryExamples(category: Category): string[] {
  const fromDescription = category.description
    .split(/[,:]|\by\b/)
    .map((s) => s.trim())
    .filter(Boolean)
  const examples = [...fromDescription, ...category.keywords]
  if (category.name) examples.unshift(category.name)
  return [...new Set(examples.map((e) => e.toLowerCase()))]
}

export function examplesFor(
  categories: Category[],
): { categoryId: string; text: string }[] {
  return categories
    .filter((c) => c.id !== OTHER_CATEGORY_ID)
    .flatMap((c) =>
      categoryExamples(c).map((text) => ({ categoryId: c.id, text })),
    )
}

export function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

export function bestSemanticMatch(
  query: number[],
  index: SemanticEntry[],
): SemanticMatch | null {
  let best: SemanticMatch | null = null
  for (const entry of index) {
    const similarity = dot(query, entry.vector)
    if (!best || similarity > best.similarity)
      best = { categoryId: entry.categoryId, similarity }
  }
  return best
}

export function semanticConfidence(similarity: number): number {
  if (similarity < SEMANTIC_MIN_SIMILARITY) return 0
  const ratio =
    (similarity - SEMANTIC_MIN_SIMILARITY) /
    (SEMANTIC_FULL_SIMILARITY - SEMANTIC_MIN_SIMILARITY)
  return Math.min(SEMANTIC_MAX_CONFIDENCE, 0.3 + ratio * 0.55)
}

export function passage(text: string): string {
  return `passage: ${text}`
}

export function query(text: string): string {
  return `query: ${text}`
}
