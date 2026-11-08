import { parseNumericToken, type NumberMatch } from './numbers'
import type { Token } from './tokens'

const SMALL: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
}

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
}

const THOUSAND_WORDS = new Set(['thousand', 'k', 'grand'])
const MILLION_WORDS = new Set(['million', 'millions'])

export function readNumberEn(
  tokens: Token[],
  start: number,
): NumberMatch | null {
  let total = 0
  let current = 0
  let i = start
  let consumed = false
  let lastUnit: number | null = null

  while (i < tokens.length && !tokens[i].used) {
    const norm = tokens[i].norm
    const next = tokens[i + 1]?.norm ?? ''
    const numeric = parseNumericToken(norm)
    const word = SMALL[norm] ?? TENS[norm]

    if (numeric !== null && !consumed) {
      current = numeric
      consumed = true
      lastUnit = null
    } else if (word !== undefined) {
      if (lastUnit !== null && (lastUnit < 20 || word >= 10)) break
      current += word
      consumed = true
      lastUnit = word
    } else if (
      norm === 'a' &&
      !consumed &&
      (next === 'hundred' ||
        THOUSAND_WORDS.has(next) ||
        MILLION_WORDS.has(next))
    ) {
      current = 1
    } else if (norm === 'hundred' && (consumed || current === 1)) {
      current = (current || 1) * 100
      consumed = true
      lastUnit = null
    } else if (
      norm === 'and' &&
      consumed &&
      current % 100 === 0 &&
      current > 0 &&
      (SMALL[next] !== undefined || TENS[next] !== undefined)
    ) {
      lastUnit = null
    } else if (THOUSAND_WORDS.has(norm) && (consumed || current === 1)) {
      total += (current || 1) * 1000
      current = 0
      consumed = true
      lastUnit = null
    } else if (MILLION_WORDS.has(norm) && (consumed || current === 1)) {
      total += (current || 1) * 1_000_000
      current = 0
      consumed = true
      lastUnit = null
    } else {
      break
    }
    i++
  }

  if (!consumed) return null
  return { value: total + current, start, end: i }
}
