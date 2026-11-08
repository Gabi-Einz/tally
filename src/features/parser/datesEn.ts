import { addDays, parseISODate, toISODate } from '../../lib/dates'
import type { Token } from './tokens'

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
}

const DATE_LEADERS = new Set(['on', 'last', 'this', 'the'])

function dayNumber(norm: string | undefined): number | null {
  const match = /^(\d{1,2})(st|nd|rd|th)?$/.exec(norm ?? '')
  if (!match) return null
  const day = Number(match[1])
  return day >= 1 && day <= 31 ? day : null
}

function mark(tokens: Token[], from: number, to: number) {
  for (let i = from; i < to; i++) tokens[i].used = true
}

function withLeaders(tokens: Token[], index: number): number {
  let from = index
  while (
    from > 0 &&
    DATE_LEADERS.has(tokens[from - 1].norm) &&
    !tokens[from - 1].used
  )
    from--
  return from
}

function resolveDay(
  today: string,
  day: number,
  month: number | null,
): string | null {
  const t = parseISODate(today)
  let y = t.getFullYear()
  let m = month ?? t.getMonth() + 1
  if (month === null && day > t.getDate()) {
    m -= 1
    if (m === 0) {
      m = 12
      y -= 1
    }
  }
  const candidate = new Date(y, m - 1, day)
  if (candidate.getDate() !== day) return null
  if (month !== null && toISODate(candidate) > today)
    candidate.setFullYear(y - 1)
  return toISODate(candidate)
}

export function extractDateEn(tokens: Token[], today: string): string | null {
  for (let i = 0; i < tokens.length; i++) {
    const norm = tokens[i].norm
    if (norm === 'today') {
      mark(tokens, i, i + 1)
      return today
    }
    if (norm === 'yesterday') {
      const before =
        tokens[i - 1]?.norm === 'before' && tokens[i - 2]?.norm === 'day'
      const from = before ? withLeaders(tokens, i - 2) : i
      mark(tokens, from, i + 1)
      return addDays(today, before ? -2 : -1)
    }
    const weekday = WEEKDAYS[norm]
    if (weekday !== undefined) {
      const back = (parseISODate(today).getDay() - weekday + 7) % 7 || 7
      mark(tokens, withLeaders(tokens, i), i + 1)
      return addDays(today, -back)
    }
    const month = MONTHS[norm]
    if (month !== undefined) {
      const after = dayNumber(tokens[i + 1]?.norm)
      const before =
        tokens[i - 1]?.norm === 'of' ? dayNumber(tokens[i - 2]?.norm) : null
      if (after !== null) {
        const iso = resolveDay(today, after, month)
        if (iso) {
          mark(tokens, withLeaders(tokens, i), i + 2)
          return iso
        }
      }
      if (before !== null) {
        const iso = resolveDay(today, before, month)
        if (iso) {
          mark(tokens, withLeaders(tokens, i - 2), i + 1)
          return iso
        }
      }
    }
    if (norm === 'the' && /(st|nd|rd|th)$/.test(tokens[i + 1]?.norm ?? '')) {
      const day = dayNumber(tokens[i + 1].norm)
      const ofMonth =
        tokens[i + 2]?.norm === 'of'
          ? (MONTHS[tokens[i + 3]?.norm ?? ''] ?? null)
          : null
      if (day !== null) {
        const iso = resolveDay(today, day, ofMonth)
        if (iso) {
          mark(tokens, withLeaders(tokens, i), ofMonth ? i + 4 : i + 2)
          return iso
        }
      }
    }
  }
  return null
}
