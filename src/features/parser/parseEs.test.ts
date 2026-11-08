import { describe, expect, it } from 'vitest'
import { parseNumericToken } from './numbers'
import { parseExpenseEs } from './parseEs'

const TODAY = '2026-11-08'

const amountOf = (text: string) => parseExpenseEs(text, TODAY).amount

describe('montos en palabras', () => {
  it.each([
    ['cero', null],
    ['once', 11],
    ['dieciséis', 16],
    ['veintidós', 22],
    ['cuarenta y dos', 42],
    ['noventa y nueve', 99],
    ['cien', 100],
    ['ciento cincuenta', 150],
    ['doscientos', 200],
    ['quinientos', 500],
    ['setecientos cincuenta', 750],
    ['novecientos noventa y nueve', 999],
    ['mil', 1000],
    ['mil quinientos', 1500],
    ['mil doscientos treinta y cuatro', 1234],
    ['dos mil trescientos', 2300],
    ['tres mil', 3000],
    ['diez mil', 10000],
    ['veintiún mil', 21000],
    ['treinta y cinco mil', 35000],
    ['cien mil', 100000],
    ['ciento veinte mil', 120000],
    ['doscientos cincuenta mil', 250000],
    ['un millón', 1000000],
    ['un millón doscientos mil', 1200000],
    ['dos millones', 2000000],
    ['una luca', 1000],
    ['dos lucas', 2000],
    ['quince lucas', 15000],
    ['14 lucas', 14000],
    ['85 mil', 85000],
  ])('"%s" → %s', (text, pesos) => {
    expect(amountOf(`gasté ${text} en el súper`)).toBe(
      pesos === null ? null : pesos * 100,
    )
  })
})

describe('montos en cifras', () => {
  it.each([
    ['2300', 2300],
    ['2.300', 2300],
    ['2.300,50', 2300.5],
    ['2300,50', 2300.5],
    ['2300.5', 2300.5],
    ['5,000', 5000],
    ['1,234,567', 1234567],
    ['$5.000', 5000],
    ['$ 5000', 5000],
    ['2k', 2000],
    ['1.5k', 1500],
    ['0,99', 0.99],
  ])('"%s" → %s', (text, pesos) => {
    expect(amountOf(`pagué ${text} de luz`)).toBe(Math.round(pesos * 100))
  })

  it('reconoce cifras sueltas', () => {
    expect(parseNumericToken('abc')).toBeNull()
    expect(parseNumericToken('12.34.5')).toBeNull()
  })
})

describe('fechas', () => {
  it.each([
    ['gasté 500 hoy en el kiosco', '2026-11-08'],
    ['ayer gasté 500 en el kiosco', '2026-11-07'],
    ['anteayer pagué 500 de taxi', '2026-11-06'],
    ['antes de ayer pagué 500 de taxi', '2026-11-06'],
    ['el lunes gasté 500 en el súper', '2026-11-02'],
    ['el sábado pagué 500 de cine', '2026-11-07'],
    ['el domingo gasté 500', '2026-11-01'],
    ['el viernes pasado pagué 500', '2026-11-06'],
    ['el miércoles 500 de nafta', '2026-11-04'],
    ['martes 500 de nafta', '2026-11-03'],
    ['el 3 pagué 500 de luz', '2026-11-03'],
    ['el 15 pagué 500 de luz', '2026-10-15'],
    ['el quince pagué 500 de luz', '2026-10-15'],
    ['el 3 de octubre pagué 500 de luz', '2026-10-03'],
    ['el 20 de diciembre gasté 500 en regalos', '2025-12-20'],
    ['el 1 de noviembre gasté 500', '2026-11-01'],
    ['el 31 de octubre de 2026 gasté 500', '2026-10-31'],
    ['gasté 500 en el súper', '2026-11-08'],
  ])('"%s" → %s', (text, date) => {
    expect(parseExpenseEs(text, TODAY).date).toBe(date)
  })

  it('no confunde el día con el monto', () => {
    expect(parseExpenseEs('el 15 pagué 3000 de luz', TODAY)).toMatchObject({
      date: '2026-10-15',
      amount: 300000,
    })
  })
})

describe('frases completas', () => {
  it.each([
    ['gasté 5000 en la SUBE', 5000, '2026-11-08', 'SUBE'],
    ['Gasté 5000 en la SUBE.', 5000, '2026-11-08', 'SUBE'],
    [
      'ayer pagué dos mil trescientos en la farmacia',
      2300,
      '2026-11-07',
      'Farmacia',
    ],
    ['pagué 31.500 de luz a Edenor', 31500, '2026-11-08', 'Luz a Edenor'],
    ['ayer 14 lucas en Rappi', 14000, '2026-11-07', 'Rappi'],
    ['compré zapatillas por 85 mil', 85000, '2026-11-08', 'Zapatillas'],
    ['8000 de nafta en YPF', 8000, '2026-11-08', 'Nafta en YPF'],
    ['gasté 23 mil en el Coto', 23000, '2026-11-08', 'Coto'],
    ['me salió 4500 el corte de pelo', 4500, '2026-11-08', 'Corte de pelo'],
    ['el lunes pagué 12000 pesos de expensas', 12000, '2026-11-02', 'Expensas'],
    ['cargué 15 lucas de nafta', 15000, '2026-11-08', 'Nafta'],
    ['gasté mil quinientos en el kiosco', 1500, '2026-11-08', 'Kiosco'],
    ['Netflix 7.500', 7500, '2026-11-08', 'Netflix'],
    ['veterinaria 18 mil', 18000, '2026-11-08', 'Veterinaria'],
    ['compramos una pizza por 9000', 9000, '2026-11-08', 'Pizza'],
    ['gasté 2300,50 en la farmacia', 2300.5, '2026-11-08', 'Farmacia'],
    ['pagué el alquiler 350 mil', 350000, '2026-11-08', 'Alquiler'],
    ['Uber 3200 ayer', 3200, '2026-11-07', 'Uber'],
    ['el 3 de octubre gasté 40 lucas en ropa', 40000, '2026-10-03', 'Ropa'],
    ['gasté 6000 mangos en el cine', 6000, '2026-11-08', 'Cine'],
    ['pagué 25 mil de internet', 25000, '2026-11-08', 'Internet'],
    ['gasté 3.200 en el chino', 3200, '2026-11-08', 'Chino'],
    ['ayer gasté 1200 en el colectivo', 1200, '2026-11-07', 'Colectivo'],
    ['pagué 45 lucas de prepaga', 45000, '2026-11-08', 'Prepaga'],
    ['Spotify 3.999', 3999, '2026-11-08', 'Spotify'],
    ['gasté 7 mil en la verdulería', 7000, '2026-11-08', 'Verdulería'],
    ['el viernes gasté 16 mil en el bar', 16000, '2026-11-06', 'Bar'],
    ['taxi 5500', 5500, '2026-11-08', 'Taxi'],
    ['pagué 2 mil de estacionamiento', 2000, '2026-11-08', 'Estacionamiento'],
    ['compré libros por 30 mil', 30000, '2026-11-08', 'Libros'],
    ['gasté doce mil en PedidosYa', 12000, '2026-11-08', 'PedidosYa'],
    ['anteayer gasté 900 en el kiosco', 900, '2026-11-06', 'Kiosco'],
    ['gasté 1.250.000 en la heladera', 1250000, '2026-11-08', 'Heladera'],
    [
      'pagué la cuota del gimnasio 28 mil',
      28000,
      '2026-11-08',
      'Cuota del gimnasio',
    ],
    [
      'regalo de cumpleaños 20 lucas',
      20000,
      '2026-11-08',
      'Regalo de cumpleaños',
    ],
    ['gasté 4 mil en el peaje', 4000, '2026-11-08', 'Peaje'],
    ['me cobraron 9500 en el dentista', 9500, '2026-11-08', 'Dentista'],
    ['gasté 600 en un café', 600, '2026-11-08', 'Café'],
    ['el martes pagué 80 mil de alquiler', 80000, '2026-11-03', 'Alquiler'],
    ['pagué 3500 de agua a AySA', 3500, '2026-11-08', 'Agua a AySA'],
  ])('"%s"', (text, pesos, date, description) => {
    expect(parseExpenseEs(text, TODAY)).toEqual({
      amount: Math.round(pesos * 100),
      date,
      description,
    })
  })

  it('sin monto devuelve null y deja la descripción', () => {
    expect(parseExpenseEs('gasté en la farmacia', TODAY)).toEqual({
      amount: null,
      date: TODAY,
      description: 'Farmacia',
    })
  })

  it('sin descripción la deja vacía', () => {
    expect(parseExpenseEs('gasté 2000', TODAY).description).toBe('')
  })
})
