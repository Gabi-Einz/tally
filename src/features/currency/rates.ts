import { db } from '../../db/db'
import type { DollarType, UsdConversion } from '../../db/types'
import { addDays } from '../../lib/dates'

export const CRIPTO_HISTORY_START = '2023-02-07'
const MAX_DAYS_BACK = 7
const ARGENTINA_DATOS = 'https://api.argentinadatos.com/v1/cotizaciones/dolares'
const DOLAR_API = 'https://dolarapi.com/v1/dolares'

export interface Rate {
  sell: number
  rateDate: string
  source: UsdConversion['rateSource']
  capturedAt: number
}

export class RateUnavailableError extends Error {}

async function getJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url)
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`HTTP ${response.status} en ${url}`)
  return (await response.json()) as T
}

function rateId(date: string, type: DollarType): string {
  return `${date}:${type}`
}

export function hasHistory(type: DollarType, date: string): boolean {
  return type === 'blue' || date >= CRIPTO_HISTORY_START
}

async function historicalRate(
  type: DollarType,
  date: string,
  now: number,
): Promise<Rate> {
  for (let back = 0; back <= MAX_DAYS_BACK; back++) {
    const day = addDays(date, -back)
    const cached = await db.exchangeRates.get(rateId(day, type))
    if (cached)
      return {
        sell: cached.sell,
        rateDate: day,
        source: 'argentinadatos',
        capturedAt: cached.fetchedAt,
      }
    const [y, m, d] = day.split('-')
    const data = await getJson<{ venta: number }>(
      `${ARGENTINA_DATOS}/${type}/${y}/${m}/${d}`,
    )
    if (data && data.venta > 0) {
      await db.exchangeRates.put({
        id: rateId(day, type),
        date: day,
        type,
        sell: data.venta,
        fetchedAt: now,
      })
      return {
        sell: data.venta,
        rateDate: day,
        source: 'argentinadatos',
        capturedAt: now,
      }
    }
  }
  throw new RateUnavailableError(`Sin cotización ${type} para ${date}`)
}

async function currentRate(
  type: DollarType,
  today: string,
  now: number,
): Promise<Rate> {
  try {
    const data = await getJson<{ venta: number }>(`${DOLAR_API}/${type}`)
    if (data && data.venta > 0)
      return {
        sell: data.venta,
        rateDate: today,
        source: 'dolarapi',
        capturedAt: now,
      }
  } catch {
    return historicalRate(type, today, now)
  }
  return historicalRate(type, today, now)
}

export async function getRate(
  type: DollarType,
  date: string,
  today: string,
  now = Date.now(),
): Promise<Rate> {
  if (!hasHistory(type, date))
    throw new RateUnavailableError(`Sin histórico ${type} para ${date}`)
  return date === today
    ? currentRate(type, today, now)
    : historicalRate(type, date, now)
}

export async function prefetchRecentRates(
  today: string,
  now = Date.now(),
  days = 62,
): Promise<void> {
  const since = addDays(today, -days)
  for (const type of ['blue', 'cripto'] as const) {
    const list = await getJson<{ venta: number; fecha: string }[]>(
      `${ARGENTINA_DATOS}/${type}`,
    )
    if (!list) continue
    const recent = list.filter((r) => r.fecha >= since && r.venta > 0)
    await db.exchangeRates.bulkPut(
      recent.map((r) => ({
        id: rateId(r.fecha, type),
        date: r.fecha,
        type,
        sell: r.venta,
        fetchedAt: now,
      })),
    )
  }
}
