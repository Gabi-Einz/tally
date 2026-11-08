import type { DictationLang } from '../../db/types'
import { todayISO } from '../../lib/dates'
import { parseExpenseEs } from '../parser/parseEs'

export interface ExpenseDraft {
  rawTranscript: string
  dictationLang: DictationLang
  amount?: number | null
  date?: string
  description?: string
}

export function draftFromTranscript(
  rawTranscript: string,
  dictationLang: DictationLang,
  today = todayISO(),
): ExpenseDraft {
  const parsed = parseExpenseEs(rawTranscript, today)
  return {
    rawTranscript,
    dictationLang,
    amount: parsed.amount,
    date: parsed.date,
    description: parsed.description,
  }
}
