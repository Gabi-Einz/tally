export type CurrencyCode = 'ARS' | 'USD'
export type DictationLang = 'es-AR' | 'en-US'
export type CategorySource =
  'rule' | 'keyword' | 'embedding' | 'manual' | 'fallback'
export type DollarType = 'blue' | 'cripto'

export interface UsdConversion {
  rate: number
  amount: number
  rateDate: string
  rateSource: 'dolarapi' | 'argentinadatos'
  capturedAt: number
}

export interface Expense {
  id: string
  amount: number | null
  currency: 'ARS'
  originalAmount: number
  originalCurrency: CurrencyCode
  dictationLang: DictationLang
  usdBlue: UsdConversion | null
  usdCripto: UsdConversion | null
  description: string
  categoryId: string
  date: string
  rawTranscript: string
  categorySource: CategorySource
  confidence: number
  createdAt: number
  updatedAt: number
}

export interface Category {
  id: string
  name: string | null
  color: string
  keywords: string[]
  description: string
  builtin: boolean
  order: number
  updatedAt: number
}

export interface LearnedRule {
  id: string
  pattern: string
  categoryId: string
  hits: number
  updatedAt: number
}

export interface ExchangeRate {
  id: string
  date: string
  type: DollarType
  sell: number
  fetchedAt: number
}

export interface Setting {
  key: string
  value: unknown
}
