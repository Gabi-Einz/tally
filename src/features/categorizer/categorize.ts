import { OTHER_CATEGORY_ID } from '../../data/categories'
import type { Category, CategorySource, LearnedRule } from '../../db/types'
import { normalizeWord } from '../parser/tokens'

export interface CategoryGuess {
  categoryId: string
  source: CategorySource
  confidence: number
  pattern?: string
}

export const RULE_CONFIDENCE = 0.95
export const KEYWORD_CONFIDENCE = 0.8
export const LOW_CONFIDENCE = 0.5

const STOPWORDS = new Set([
  'a',
  'al',
  'con',
  'de',
  'del',
  'el',
  'en',
  'la',
  'las',
  'lo',
  'los',
  'para',
  'por',
  'que',
  'un',
  'una',
  'unos',
  'unas',
  'y',
  'mi',
  'mis',
  'su',
  'sus',
])

export function keyWords(description: string): string[] {
  const words = normalizeWord(description)
    .split(/[^a-z0-9ñ]+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
  return [...new Set(words)]
}

function stem(word: string): string {
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1)
  return word
}

export function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      prev = tmp
    }
  }
  return row[b.length]
}

function wordMatchesKeyword(word: string, keyword: string): boolean {
  if (word === keyword || stem(word) === stem(keyword)) return true
  return keyword.length >= 5 && levenshtein(word, keyword) <= 1
}

export function matchRule(
  words: string[],
  rules: LearnedRule[],
): LearnedRule | null {
  let best: LearnedRule | null = null
  for (const rule of rules) {
    if (!words.includes(rule.pattern)) continue
    if (!best || rule.hits > best.hits) best = rule
  }
  return best
}

export function matchKeywords(
  description: string,
  words: string[],
  categories: Category[],
): string | null {
  const phrase = ` ${words.join(' ')} `
  let bestId: string | null = null
  let bestScore = 0
  for (const category of categories) {
    let score = 0
    for (const raw of category.keywords) {
      const keyword = normalizeWord(raw)
      if (keyword.includes(' ')) {
        if (phrase.includes(` ${keyword} `)) score += 2
      } else if (words.some((w) => wordMatchesKeyword(w, keyword))) {
        score += 1
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestId = category.id
    }
  }
  return description.trim() ? bestId : null
}

export function categorize(
  description: string,
  categories: Category[],
  rules: LearnedRule[],
): CategoryGuess {
  const words = keyWords(description)
  const rule = matchRule(words, rules)
  if (rule && categories.some((c) => c.id === rule.categoryId))
    return {
      categoryId: rule.categoryId,
      source: 'rule',
      confidence: RULE_CONFIDENCE,
      pattern: rule.pattern,
    }

  const keywordId = matchKeywords(description, words, categories)
  if (keywordId)
    return {
      categoryId: keywordId,
      source: 'keyword',
      confidence: KEYWORD_CONFIDENCE,
    }

  return { categoryId: OTHER_CATEGORY_ID, source: 'fallback', confidence: 0 }
}
