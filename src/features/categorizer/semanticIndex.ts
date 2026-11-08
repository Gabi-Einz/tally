import { db } from '../../db/db'
import type { Category } from '../../db/types'
import type { CategoryGuess } from './categorize'
import { embed, warmUpModel } from './embeddingsClient'
import {
  bestSemanticMatch,
  EMBEDDING_MODEL,
  examplesFor,
  passage,
  query,
  SEMANTIC_MIN_SIMILARITY,
  semanticConfidence,
  type SemanticEntry,
} from './semantic'

const INDEX_KEY = 'semanticIndex'

interface StoredIndex {
  signature: string
  entries: SemanticEntry[]
}

function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

let building: { signature: string; promise: Promise<SemanticEntry[]> } | null =
  null

export function loadSemanticIndex(
  categories: Category[],
): Promise<SemanticEntry[]> {
  const examples = examplesFor(categories)
  const signature = hash(
    `${EMBEDDING_MODEL}|${examples.map((e) => `${e.categoryId}:${e.text}`).join('|')}`,
  )
  if (building?.signature === signature) return building.promise

  const promise = (async () => {
    const stored = (await db.settings.get(INDEX_KEY))?.value as
      StoredIndex | undefined
    if (stored?.signature === signature) return stored.entries
    const vectors = await embed(examples.map((e) => passage(e.text)))
    const entries = examples.map((e, i) => ({
      categoryId: e.categoryId,
      vector: vectors[i],
    }))
    await db.settings.put({ key: INDEX_KEY, value: { signature, entries } })
    return entries
  })()
  building = { signature, promise }
  promise.catch(() => {
    if (building?.promise === promise) building = null
  })
  return promise
}

export async function semanticGuess(
  description: string,
  categories: Category[],
): Promise<CategoryGuess | null> {
  if (!description.trim() || categories.length === 0) return null
  const index = await loadSemanticIndex(categories)
  const [vector] = await embed([query(description)])
  const match = bestSemanticMatch(vector, index)
  if (!match || match.similarity < SEMANTIC_MIN_SIMILARITY) return null
  return {
    categoryId: match.categoryId,
    source: 'embedding',
    confidence: semanticConfidence(match.similarity),
  }
}

export function scheduleSemanticWarmUp(delayMs = 1500): void {
  setTimeout(async () => {
    warmUpModel()
    const categories = await db.categories.toArray()
    loadSemanticIndex(categories).catch(() => {})
  }, delayMs)
}
