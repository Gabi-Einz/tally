import { addDays, parseISODate, toISODate } from '../../lib/dates'
import { readNumber } from './numbers'
import type { Token } from './tokens'

const WEEKDAYS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
}

const MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
}

function mark(tokens: Token[], from: number, to: number) {
  for (let i = from; i < to; i++) tokens[i].used = true
}

function previousWeekday(today: string, weekday: number): string {
  const current = parseISODate(today).getDay()
  const back = (current - weekday + 7) % 7 || 7
  return addDays(today, -back)
}

function dayOfMonth(
  today: string,
  day: number,
  month: number | null,
  year: number | null,
): string | null {
  const t = parseISODate(today)
  let y = year ?? t.getFullYear()
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
  if (month !== null && year === null && toISODate(candidate) > today)
    candidate.setFullYear(y - 1)
  return toISODate(candidate)
}

export function extractDate(tokens: Token[], today: string): string | null {
  for (let i = 0; i < tokens.length; i++) {
    const norm = tokens[i].norm
    const next = tokens[i + 1]?.norm

    if (norm === 'hoy') {
      mark(tokens, i, i + 1)
      return today
    }
    if (norm === 'ayer') {
      mark(tokens, i, i + 1)
      return addDays(today, -1)
    }
    if (norm === 'anteayer' || norm === 'antier') {
      mark(tokens, i, i + 1)
      return addDays(today, -2)
    }
    if (norm === 'antes' && next === 'de' && tokens[i + 2]?.norm === 'ayer') {
      mark(tokens, i, i + 3)
      return addDays(today, -2)
    }

    const weekdayAt = norm === 'el' ? i + 1 : i
    const weekday = WEEKDAYS[tokens[weekdayAt]?.norm ?? '']
    if (weekday !== undefined && (norm === 'el' || weekdayAt === i)) {
      let end = weekdayAt + 1
      if (tokens[end]?.norm === 'pasado') end++
      mark(tokens, i, end)
      return previousWeekday(today, weekday)
    }

    if (norm === 'el' && next !== undefined) {
      const day = readNumber(tokens, i + 1)
      if (
        !day ||
        day.value < 1 ||
        day.value > 31 ||
        !Number.isInteger(day.value)
      )
        continue
      let end = day.end
      let month: number | null = null
      let year: number | null = null
      if (tokens[end]?.norm === 'de' && MONTHS[tokens[end + 1]?.norm ?? '']) {
        month = MONTHS[tokens[end + 1].norm]
        end += 2
        const y = /^\d{4}$/.test(tokens[end + 1]?.norm ?? '')
        if (tokens[end]?.norm === 'de' && y) {
          year = Number(tokens[end + 1].norm)
          end += 2
        }
      } else if (MONTHS[tokens[end]?.norm ?? '']) {
        continue
      }
      const iso = dayOfMonth(today, day.value, month, year)
      if (!iso) continue
      mark(tokens, i, end)
      return iso
    }
  }
  return null
}
