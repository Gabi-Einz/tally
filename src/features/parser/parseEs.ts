import { extractDate } from './dates'
import { readNumber } from './numbers'
import type { CurrencyCode } from '../../db/types'
import { extractAmount, type CurrencyWords } from './amount'
import { remainingText, tokenize } from './tokens'

export interface ParsedExpense {
  amount: number | null
  currency: CurrencyCode
  date: string
  description: string
}

const FILLERS = new Set([
  '$',
  'gaste',
  'gastamos',
  'gasto',
  'pague',
  'pagamos',
  'pago',
  'compre',
  'compramos',
  'me',
  'nos',
  'salio',
  'salieron',
  'costo',
  'cobraron',
  'fueron',
  'fue',
  'cargue',
  'puse',
  'deje',
])

const EDGE_WORDS = new Set([
  'en',
  'de',
  'del',
  'la',
  'el',
  'los',
  'las',
  'un',
  'una',
  'unos',
  'unas',
  'por',
  'para',
  'al',
  'a',
  'y',
  'con',
  'que',
  'lo',
  'pesos',
  'peso',
  'mangos',
  'mango',
])

const CURRENCY_WORDS: CurrencyWords = {
  ars: new Set(['pesos', 'peso', 'mangos', 'mango']),
  usd: new Set(['dolares', 'dolar', 'usd', 'verdes', 'u$s', 'us$']),
}

export function parseExpenseEs(text: string, today: string): ParsedExpense {
  const tokens = tokenize(text)
  const date = extractDate(tokens, today) ?? today
  const { cents, currency } = extractAmount(tokens, readNumber, CURRENCY_WORDS)
  const description = remainingText(tokens, FILLERS, EDGE_WORDS)
  return { amount: cents, currency, date, description }
}
