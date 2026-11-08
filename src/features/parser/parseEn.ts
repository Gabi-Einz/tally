import { extractAmount, type CurrencyWords } from './amount'
import { extractDateEn } from './datesEn'
import { readNumberEn } from './numbersEn'
import type { ParsedExpense } from './parseEs'
import { remainingText, tokenize } from './tokens'

const FILLERS = new Set([
  '$',
  'i',
  'we',
  'spent',
  'spend',
  'paid',
  'pay',
  'bought',
  'buy',
  'got',
  'it',
  'cost',
  'costs',
  'was',
  'were',
  'just',
  'me',
  'charged',
])

const EDGE_WORDS = new Set([
  'on',
  'at',
  'for',
  'in',
  'the',
  'a',
  'an',
  'of',
  'to',
  'and',
  'with',
  'from',
  'my',
  'some',
  'pesos',
  'peso',
])

const CURRENCY_WORDS: CurrencyWords = {
  ars: new Set(['pesos', 'peso']),
  usd: new Set(['dollars', 'dollar', 'bucks', 'usd', 'us$', 'u$s']),
}

export function parseExpenseEn(text: string, today: string): ParsedExpense {
  const tokens = tokenize(text.replace(/([a-z])-([a-z])/gi, '$1 $2'))
  const date = extractDateEn(tokens, today) ?? today
  const { cents, currency } = extractAmount(
    tokens,
    readNumberEn,
    CURRENCY_WORDS,
  )
  const description = remainingText(tokens, FILLERS, EDGE_WORDS)
  return { amount: cents, currency, date, description }
}
