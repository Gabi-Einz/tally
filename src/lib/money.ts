// Los montos se guardan en centavos (enteros) para evitar errores de punto flotante.

/**
 * Convierte lo que el usuario escribe en el campo Monto a centavos.
 * Formato argentino: punto para miles y coma para decimales ("2.300,50").
 * También acepta "2300.5" (punto decimal) cuando no puede ser separador de miles.
 * Devuelve null si el texto no es un monto válido mayor a 0.
 */
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

/** Centavos → texto para volver a editar en el campo Monto ("2.300,50", "2.300") */
export function formatAmountInput(cents: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

/** Centavos de ARS → "$ 23.000" (es-AR) / "$23,000" (en-US); muestra decimales solo si los hay */
export function formatARS(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'ARS',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}
