import type { CurrencyCode, DictationLang } from '../../db/types'
import { todayISO } from '../../lib/dates'
import { parseExpense } from '../parser/parse'

export interface ExpenseDraft {
  rawTranscript: string
  dictationLang: DictationLang
  amount?: number | null
  currency?: CurrencyCode
  date?: string
  description?: string
}

export function draftFromTranscript(
  rawTranscript: string,
  dictationLang: DictationLang,
  today = todayISO(),
): ExpenseDraft {
  const parsed = parseExpense(rawTranscript, dictationLang, today)
  return {
    rawTranscript,
    dictationLang,
    amount: parsed.amount,
    currency: parsed.currency,
    date: parsed.date,
    description: parsed.description,
  }
}
