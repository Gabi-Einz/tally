import type { Token } from './tokens'

const SMALL: Record<string, number> = {
  cero: 0,
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  veintiun: 21,
  veintiuno: 21,
  veintiuna: 21,
  veintidos: 22,
  veintitres: 23,
  veinticuatro: 24,
  veinticinco: 25,
  veintiseis: 26,
  veintisiete: 27,
  veintiocho: 28,
  veintinueve: 29,
}

const TENS: Record<string, number> = {
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
}

const HUNDREDS: Record<string, number> = {
  cien: 100,
  ciento: 100,
  doscientos: 200,
  doscientas: 200,
  trescientos: 300,
  trescientas: 300,
  cuatrocientos: 400,
  cuatrocientas: 400,
  quinientos: 500,
  quinientas: 500,
  seiscientos: 600,
  seiscientas: 600,
  setecientos: 700,
  setecientas: 700,
  ochocientos: 800,
  ochocientas: 800,
  novecientos: 900,
  novecientas: 900,
}

const THOUSAND_WORDS = new Set(['mil', 'luca', 'lucas', 'k'])
const MILLION_WORDS = new Set(['millon', 'millones'])
const ARTICLE_WORDS = new Set(['un', 'una'])

export function parseNumericToken(raw: string): number | null {
  const s = raw.replace(/^\$/, '')
  let m = /^(\d+(?:[.,]\d+)?)k$/.exec(s)
  if (m) return Number(m[1].replace(',', '.')) * 1000
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s))
    return Number(s.replace(/\./g, '').replace(',', '.'))
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s))
    return Number(s.replace(/,/g, ''))
  m = /^\d+([.,]\d{1,2})?$/.exec(s)
  if (m) return Number(s.replace(',', '.'))
  return null
}

function wordValue(norm: string): number | null {
  return SMALL[norm] ?? TENS[norm] ?? HUNDREDS[norm] ?? null
}

export interface NumberMatch {
  value: number
  start: number
  end: number
}

export function readNumber(tokens: Token[], start: number): NumberMatch | null {
  let total = 0
  let current = 0
  let i = start
  let consumedNumber = false
  let onlyArticles = true
  let lastWasTens = false

  while (i < tokens.length && !tokens[i].used) {
    const norm = tokens[i].norm
    const numeric = parseNumericToken(norm)
    const word = wordValue(norm)

    if (numeric !== null && !consumedNumber) {
      current = numeric
      consumedNumber = true
      onlyArticles = false
      lastWasTens = false
    } else if (word !== null && (!consumedNumber || current < 1000)) {
      if (consumedNumber && word >= current % 1000 && current % 1000 !== 0)
        break
      current += word
      consumedNumber = true
      if (!ARTICLE_WORDS.has(norm)) onlyArticles = false
      lastWasTens = norm in TENS
    } else if (
      norm === 'y' &&
      lastWasTens &&
      i + 1 < tokens.length &&
      SMALL[tokens[i + 1].norm] !== undefined &&
      SMALL[tokens[i + 1].norm] < 10
    ) {
      lastWasTens = false
    } else if (THOUSAND_WORDS.has(norm) && (consumedNumber || norm === 'mil')) {
      total += (current || 1) * 1000
      current = 0
      consumedNumber = true
      onlyArticles = false
      lastWasTens = false
    } else if (MILLION_WORDS.has(norm) && consumedNumber) {
      total += (current || 1) * 1_000_000
      current = 0
      onlyArticles = false
      lastWasTens = false
    } else {
      break
    }
    i++
  }

  if (!consumedNumber || onlyArticles) return null
  return { value: total + current, start, end: i }
}
