import type { Expense } from '../../db/types'
import { formatARS } from '../../lib/money'

export type DisplayCurrency = 'ARS' | 'USD_BLUE' | 'USD_CRIPTO'

function decimals(locale: string, value: number, digits: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatUSD(cents: number, locale: string): string {
  return `US$ ${decimals(locale, cents / 100, 2)}`
}

export function formatUSDT(cents: number, locale: string): string {
  return `USDT ${decimals(locale, cents / 100, 2)}`
}

export function formatRate(sell: number, locale: string): string {
  return formatARS(Math.round(sell * 100), locale)
}

export function valueIn(
  expense: Expense,
  currency: DisplayCurrency,
): number | null {
  if (currency === 'ARS') return expense.amount
  if (currency === 'USD_BLUE') return expense.usdBlue?.amount ?? null
  return expense.usdCripto?.amount ?? null
}

export function formatIn(
  cents: number,
  currency: DisplayCurrency,
  locale: string,
): string {
  if (currency === 'ARS') return formatARS(cents, locale)
  if (currency === 'USD_BLUE') return formatUSD(cents, locale)
  return formatUSDT(cents, locale)
}
