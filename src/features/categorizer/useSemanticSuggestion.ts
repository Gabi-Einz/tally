import { useEffect, useState } from 'react'
import type { Category } from '../../db/types'
import type { CategoryGuess } from './categorize'
import { semanticGuess } from './semanticIndex'

const DEBOUNCE_MS = 250

export function useSemanticSuggestion(
  description: string,
  categories: Category[],
  enabled: boolean,
): CategoryGuess | null {
  const [result, setResult] = useState<{
    text: string
    guess: CategoryGuess | null
  } | null>(null)

  useEffect(() => {
    if (!enabled || !description.trim()) return
    let cancelled = false
    const timer = setTimeout(() => {
      semanticGuess(description, categories)
        .then((guess) => {
          if (!cancelled) setResult({ text: description, guess })
        })
        .catch(() => {})
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [description, categories, enabled])

  return enabled && result?.text === description ? result.guess : null
}
