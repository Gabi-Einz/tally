import type { Expense } from '../../db/types'
import { formatARS, NUMBER_LOCALE } from '../../lib/money'

export type DisplayCurrency = 'ARS' | 'USD_BLUE' | 'USD_CRIPTO'

function decimals(value: number, digits: number): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatUSD(cents: number): string {
  return `US$ ${decimals(cents / 100, 2)}`
}

export function formatUSDT(cents: number): string {
  return `USDT ${decimals(cents / 100, 2)}`
}

export function formatRate(sell: number): string {
  return formatARS(Math.round(sell * 100))
}

export function valueIn(
  expense: Expense,
  currency: DisplayCurrency,
): number | null {
  if (currency === 'ARS') return expense.amount
  if (currency === 'USD_BLUE') return expense.usdBlue?.amount ?? null
  return expense.usdCripto?.amount ?? null
}

export function formatIn(cents: number, currency: DisplayCurrency): string {
  if (currency === 'ARS') return formatARS(cents)
  if (currency === 'USD_BLUE') return formatUSD(cents)
  return formatUSDT(cents)
}
