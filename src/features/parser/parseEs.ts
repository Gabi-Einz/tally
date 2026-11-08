import { extractDate } from './dates'
import { readNumber } from './numbers'
import { remainingText, tokenize, type Token } from './tokens'

export interface ParsedExpense {
  amount: number | null
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

const CURRENCY_UNITS = new Set(['pesos', 'peso', 'mangos', 'mango'])

function extractAmount(tokens: Token[]): number | null {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].used) continue
    const match = readNumber(tokens, i)
    if (!match) continue
    let end = match.end
    if (CURRENCY_UNITS.has(tokens[end]?.norm ?? '')) end++
    for (let j = match.start; j < end; j++) tokens[j].used = true
    return Math.round(match.value * 100)
  }
  return null
}

export function parseExpenseEs(text: string, today: string): ParsedExpense {
  const tokens = tokenize(text)
  const date = extractDate(tokens, today) ?? today
  const amount = extractAmount(tokens)
  const description = remainingText(tokens, FILLERS, EDGE_WORDS)
  return { amount: amount && amount > 0 ? amount : null, date, description }
}
