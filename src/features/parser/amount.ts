import type { CurrencyCode } from '../../db/types'
import { parseNumericToken, type NumberMatch } from './numbers'
import type { Token } from './tokens'

export type NumberReader = (
  tokens: Token[],
  start: number,
) => NumberMatch | null

export interface CurrencyWords {
  ars: Set<string>
  usd: Set<string>
}

export interface ParsedAmount {
  cents: number | null
  currency: CurrencyCode
}

const USD_PREFIX = /^(us\$|u\$s|usd)(.+)$/

function splitUsdPrefix(token: Token): boolean {
  const match = USD_PREFIX.exec(token.norm)
  if (!match || parseNumericToken(match[2]) === null) return false
  token.norm = match[2]
  return true
}

export function extractAmount(
  tokens: Token[],
  read: NumberReader,
  words: CurrencyWords,
): ParsedAmount {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].used) continue
    let start = i
    let currency: CurrencyCode | null = null

    if (splitUsdPrefix(tokens[i])) currency = 'USD'
    else if (words.usd.has(tokens[i].norm) && tokens[i + 1]) {
      const after = read(tokens, i + 1)
      if (after) {
        tokens[i].used = true
        start = i + 1
        currency = 'USD'
      }
    }

    const match = read(tokens, start)
    if (!match) continue
    let end = match.end
    const unit = tokens[end]?.norm ?? ''
    if (words.usd.has(unit)) {
      currency = 'USD'
      end++
    } else if (words.ars.has(unit)) {
      currency ??= 'ARS'
      end++
    }
    for (let j = match.start; j < end; j++) tokens[j].used = true

    if (!currency) {
      const mention = tokens.find((t) => !t.used && words.usd.has(t.norm))
      if (mention) {
        mention.used = true
        currency = 'USD'
      }
    }

    const cents = Math.round(match.value * 100)
    return { cents: cents > 0 ? cents : null, currency: currency ?? 'ARS' }
  }
  return { cents: null, currency: 'ARS' }
}
