import type { CategorySource, DictationLang } from '../../db/types'

export interface ExpenseDraft {
  rawTranscript: string
  dictationLang: DictationLang
  amount?: number | null
  date?: string
  description?: string
  categoryId?: string
  categorySource?: CategorySource
  confidence?: number
}

export function draftFromTranscript(
  rawTranscript: string,
  dictationLang: DictationLang,
): ExpenseDraft {
  return { rawTranscript, dictationLang, description: rawTranscript }
}
