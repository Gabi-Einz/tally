import type { DictationLang } from '../../db/types'
import { parseExpenseEn } from './parseEn'
import { parseExpenseEs, type ParsedExpense } from './parseEs'

export function parseExpense(
  text: string,
  lang: DictationLang,
  today: string,
): ParsedExpense {
  return lang === 'en-US'
    ? parseExpenseEn(text, today)
    : parseExpenseEs(text, today)
}
