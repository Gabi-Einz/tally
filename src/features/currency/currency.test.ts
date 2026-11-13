import { describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { createExpense, updateExpense } from '../../db/expenses'
import { convertExpense, convertPending, isPendingConversion } from './convert'
import { formatRate, formatUSD, formatUSDT } from './format'

const TODAY = '2026-11-08'
const NOW = Date.UTC(2026, 10, 8, 17, 31)

type Routes = Record<string, { venta: number } | 404>

function mockFetch(routes: Routes) {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input)
    const key = Object.keys(routes).find((k) => url.endsWith(k))
    if (!key) throw new Error(`sin red: ${url}`)
    const route = routes[key]
    if (route === 404) return new Response('', { status: 404 })
    return new Response(JSON.stringify(route), { status: 200 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const base = { description: 'Farmacia', categoryId: 'salud' }

describe('conversión a dólares', () => {
  it('un gasto de hoy usa la cotización del momento (DolarAPI)', async () => {
    mockFetch({
      '/dolares/blue': { venta: 1565 },
      '/dolares/cripto': { venta: 1643.99 },
    })
    const { id } = await createExpense({
      ...base,
      amount: 2300000,
      date: TODAY,
    })
    expect(await convertExpense(id, TODAY, NOW)).toBe(true)

    const saved = await db.expenses.get(id)
    expect(saved?.usdBlue).toEqual({
      rate: 1565,
      amount: 1470,
      rateDate: TODAY,
      rateSource: 'dolarapi',
      capturedAt: NOW,
    })
    expect(saved?.usdCripto).toMatchObject({ rate: 1643.99, amount: 1399 })
  })

  it('un gasto de un día anterior usa ArgentinaDatos de esa fecha', async () => {
    const fetchMock = mockFetch({
      '/blue/2026/11/01': { venta: 1550 },
      '/cripto/2026/11/01': { venta: 1630 },
    })
    const { id } = await createExpense({
      ...base,
      amount: 230000,
      date: '2026-11-01',
    })
    await convertExpense(id, TODAY, NOW)
    const saved = await db.expenses.get(id)
    expect(saved?.usdBlue).toMatchObject({
      rate: 1550,
      amount: 148,
      rateDate: '2026-11-01',
      rateSource: 'argentinadatos',
    })
    expect(await db.exchangeRates.get('2026-11-01:blue')).toMatchObject({
      sell: 1550,
    })
    const calls = fetchMock.mock.calls.length
    const other = await createExpense({
      ...base,
      amount: 100000,
      date: '2026-11-01',
    })
    await convertExpense(other.id, TODAY, NOW)
    expect(fetchMock.mock.calls.length).toBe(calls)
  })

  it('si no hay cotización ese día usa el último día anterior con dato', async () => {
    mockFetch({
      '/blue/2026/11/01': 404,
      '/blue/2026/10/31': { venta: 1540 },
      '/cripto/2026/11/01': 404,
      '/cripto/2026/10/31': { venta: 1620 },
    })
    const { id } = await createExpense({
      ...base,
      amount: 154000,
      date: '2026-11-01',
    })
    await convertExpense(id, TODAY, NOW)
    expect((await db.expenses.get(id))?.usdBlue).toMatchObject({
      rate: 1540,
      amount: 100,
      rateDate: '2026-10-31',
    })
  })

  it('antes de febrero de 2023 no hay dólar cripto', async () => {
    mockFetch({ '/blue/2022/05/10': { venta: 200 } })
    const { id } = await createExpense({
      ...base,
      amount: 100000,
      date: '2022-05-10',
    })
    expect(await convertExpense(id, TODAY, NOW)).toBe(true)
    const saved = await db.expenses.get(id)
    expect(saved?.usdBlue?.amount).toBe(500)
    expect(saved?.usdCripto).toBeNull()
    expect(isPendingConversion(saved!)).toBe(false)
  })

  it('sin conexión queda pendiente y se completa después', async () => {
    const { id } = await createExpense({
      ...base,
      amount: 2300000,
      date: TODAY,
    })
    expect(await convertExpense(id, TODAY, NOW)).toBe(false)
    expect(isPendingConversion((await db.expenses.get(id))!)).toBe(true)

    mockFetch({
      '/dolares/blue': { venta: 1565 },
      '/dolares/cripto': { venta: 1643.99 },
    })
    expect(await convertPending(TODAY, NOW)).toBe(true)
    expect(isPendingConversion((await db.expenses.get(id))!)).toBe(false)
  })

  it('al editar: el monto recalcula con la cotización guardada y la fecha la vuelve a buscar', async () => {
    mockFetch({
      '/dolares/blue': { venta: 1565 },
      '/dolares/cripto': { venta: 1643.99 },
    })
    const { id } = await createExpense({
      ...base,
      amount: 2300000,
      date: TODAY,
    })
    await convertExpense(id, TODAY, NOW)

    await updateExpense(id, { ...base, amount: 3130000, date: TODAY })
    expect((await db.expenses.get(id))?.usdBlue).toMatchObject({
      rate: 1565,
      amount: 2000,
    })

    await updateExpense(id, { ...base, amount: 3130000, date: '2026-11-01' })
    const moved = await db.expenses.get(id)
    expect(moved?.usdBlue).toBeNull()
    expect(moved?.usdCripto).toBeNull()
  })

  it('formatea dólares y cotizaciones', () => {
    expect(formatUSD(1470)).toBe('US$ 14,70')
    expect(formatUSDT(1399)).toBe('USDT 13,99')
    expect(formatRate(1643.99).replace(/\s/g, ' ')).toBe('$ 1.643,99')
    expect(formatRate(1565).replace(/\s/g, ' ')).toBe('$ 1.565')
  })
})
