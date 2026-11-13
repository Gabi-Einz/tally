export function parseAmountInput(text: string): number | null {
  const s = text.replace(/\$|\s/g, '')
  if (!/^[\d.,]+$/.test(s)) return null

  let intPart: string
  let decPart = ''
  if (s.includes(',')) {
    const i = s.lastIndexOf(',')
    intPart = s.slice(0, i)
    decPart = s.slice(i + 1)
    if (!/^\d{1,3}(\.\d{3})*$|^\d+$/.test(intPart)) return null
    intPart = intPart.replace(/\./g, '')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    intPart = s.replace(/\./g, '')
  } else if (/^\d+(\.\d{1,2})?$/.test(s)) {
    ;[intPart, decPart = ''] = s.split('.')
  } else {
    return null
  }

  if (!/^\d{0,2}$/.test(decPart) || intPart === '') return null
  const cents = Number(intPart) * 100 + Number(decPart.padEnd(2, '0') || 0)
  return cents > 0 && Number.isSafeInteger(cents) ? cents : null
}

// Los números siempre van con punto de miles y coma decimal, sin importar el idioma de la app
export const NUMBER_LOCALE = 'es-AR'

export function formatAmountInput(cents: number): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function formatARS(cents: number): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    style: 'currency',
    currency: 'ARS',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}
