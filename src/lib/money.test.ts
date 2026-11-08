import { describe, expect, it } from 'vitest'
import { formatAmountInput, formatARS, parseAmountInput } from './money'

describe('parseAmountInput', () => {
  it.each([
    ['2300', 230000],
    ['2.300', 230000],
    ['1.234.567', 123456700],
    ['2.300,50', 230050],
    ['2300,5', 230050],
    ['2300.5', 230050],
    ['2.30', 230],
    ['$ 2.300', 230000],
    [' 15 ', 1500],
    ['0,99', 99],
  ])('convierte "%s" en %i centavos', (text, cents) => {
    expect(parseAmountInput(text)).toBe(cents)
  })

  it.each([
    '',
    '0',
    '0,00',
    'abc',
    '2,3,4',
    '12.34.5',
    '2300,555',
    '-50',
    '1.2345',
  ])('rechaza "%s"', (text) => {
    expect(parseAmountInput(text)).toBeNull()
  })
})

describe('formatAmountInput', () => {
  it('muestra decimales solo si los hay', () => {
    expect(formatAmountInput(230000)).toBe('2.300')
    expect(formatAmountInput(230050)).toBe('2.300,50')
  })

  it('vuelve a leerse igual', () => {
    for (const cents of [99, 1500, 230050, 123456700]) {
      expect(parseAmountInput(formatAmountInput(cents))).toBe(cents)
    }
  })
})

describe('formatARS', () => {
  it('formatea en pesos según el idioma', () => {
    expect(formatARS(2300000, 'es-AR').replace(/\s/g, ' ')).toBe('$ 23.000')
    expect(formatARS(2300050, 'es-AR').replace(/\s/g, ' ')).toBe('$ 23.000,50')
    expect(formatARS(2300000, 'en-US')).toBe('$23,000')
  })
})
