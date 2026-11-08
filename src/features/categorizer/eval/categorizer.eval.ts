import { pipeline } from '@huggingface/transformers'
import { expect, it } from 'vitest'
import { defaultCategories, OTHER_CATEGORY_ID } from '../../../data/categories'
import { categorize } from '../categorize'
import {
  bestSemanticMatch,
  EMBEDDING_MODEL,
  examplesFor,
  passage,
  query,
  SEMANTIC_MIN_SIMILARITY,
} from '../semantic'
import { EVAL_PHRASES } from './fixtures'

const TARGET_ACCURACY = 0.85

it(
  'acierta al menos el 85 % de las frases de prueba',
  async () => {
    const categories = defaultCategories(0)
    const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL, {
      dtype: 'q8',
    })
    const embed = async (texts: string[]) =>
      (
        await extractor(texts, { pooling: 'mean', normalize: true })
      ).tolist() as number[][]

    const examples = examplesFor(categories)
    const vectors = await embed(examples.map((e) => passage(e.text)))
    const index = examples.map((e, i) => ({
      categoryId: e.categoryId,
      vector: vectors[i],
    }))

    const bySource = new Map<string, { ok: number; total: number }>()
    const misses: string[] = []
    let ok = 0
    for (const [text, expected] of EVAL_PHRASES) {
      let guess = categorize(text, categories, [])
      let source: string = guess.source
      if (guess.source === 'fallback') {
        const [vector] = await embed([query(text)])
        const match = bestSemanticMatch(vector, index)
        if (match && match.similarity >= SEMANTIC_MIN_SIMILARITY) {
          guess = { ...guess, categoryId: match.categoryId }
          source = 'embedding'
        } else {
          guess = { ...guess, categoryId: OTHER_CATEGORY_ID }
        }
      }
      const hit = guess.categoryId === expected
      if (hit) ok++
      else
        misses.push(
          `${text} → ${guess.categoryId} (${source}), esperado ${expected}`,
        )
      const stats = bySource.get(source) ?? { ok: 0, total: 0 }
      stats.total++
      if (hit) stats.ok++
      bySource.set(source, stats)
    }

    const accuracy = ok / EVAL_PHRASES.length
    console.log(
      `\nAciertos: ${ok}/${EVAL_PHRASES.length} (${(accuracy * 100).toFixed(1)} %)`,
    )
    for (const [source, s] of bySource)
      console.log(`  ${source}: ${s.ok}/${s.total}`)
    console.log(`Fallos:\n  ${misses.join('\n  ')}`)
    expect(accuracy).toBeGreaterThanOrEqual(TARGET_ACCURACY)
  },
  10 * 60_000,
)
