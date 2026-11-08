export type CurrencyCode = 'ARS' | 'USD'
export type DictationLang = 'es-AR' | 'en-US'
export type CategorySource = 'rule' | 'keyword' | 'embedding' | 'manual'
export type DollarType = 'blue' | 'cripto'

export interface UsdConversion {
  /** Cuántos ARS vale 1 USD blue o 1 USDT (venta), ej. 1565 */
  rate: number
  /** Equivalente del gasto en centavos de USD/USDT */
  amount: number
  /** Fecha de la cotización usada (ISO, normalmente la del gasto) */
  rateDate: string
  rateSource: 'dolarapi' | 'argentinadatos'
  /** Momento en que se obtuvo la cotización */
  capturedAt: number
}

export interface Expense {
  id: string
  /** Centavos de ARS; null si se dictó en USD y falta la cotización */
  amount: number | null
  currency: 'ARS'
  /** Monto tal como se dictó, en centavos de su moneda */
  originalAmount: number
  originalCurrency: CurrencyCode
  dictationLang: DictationLang
  usdBlue: UsdConversion | null
  usdCripto: UsdConversion | null
  description: string
  categoryId: string
  /** Fecha ISO local, ej. "2026-11-08" */
  date: string
  /** Texto dictado; vacío en la carga manual */
  rawTranscript: string
  categorySource: CategorySource
  confidence: number
  createdAt: number
  updatedAt: number
}

export interface Category {
  id: string
  /** Nombre elegido por el usuario; null usa la traducción de la categoría por defecto */
  name: string | null
  color: string
  keywords: string[]
  /** Texto que describe la categoría (para el modelo de embeddings) */
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
  /** "2026-11-02:blue" */
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
