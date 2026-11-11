import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { db } from '../../db/db'
import { createExpense, updateExpense } from '../../db/expenses'
import { addDays, todayISO } from '../../lib/dates'
import { convertExpense, isPendingConversion } from './convert'

const TODAY = '2026-11-08'

function mockRates() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith('/dolares/blue')) return Response.json({ venta: 1565 })
      if (url.endsWith('/dolares/cripto'))
        return Response.json({ venta: 1643.99 })
      throw new Error(`sin red: ${url}`)
    }),
  )
}

describe('gastos en dólares', () => {
  it('se guarda el monto en dólares y los pesos quedan pendientes', async () => {
    const { id } = await createExpense({
      amount: 2000,
      currency: 'USD',
      date: TODAY,
      description: 'Spotify',
      categoryId: 'suscripciones',
    })
    const saved = await db.expenses.get(id)
    expect(saved).toMatchObject({
      amount: null,
      originalAmount: 2000,
      originalCurrency: 'USD',
    })
    expect(isPendingConversion(saved!)).toBe(true)
  })

  it('se pasa a pesos con el blue del día y calcula el USDT desde los pesos', async () => {
    mockRates()
    const { id } = await createExpense({
      amount: 2000,
      currency: 'USD',
      date: TODAY,
      description: 'Spotify',
      categoryId: 'suscripciones',
    })
    expect(await convertExpense(id, TODAY)).toBe(true)
    const saved = await db.expenses.get(id)
    expect(saved?.amount).toBe(3130000)
    expect(saved?.usdBlue).toMatchObject({ rate: 1565, amount: 2000 })
    expect(saved?.usdCripto).toMatchObject({ rate: 1643.99, amount: 1904 })
    expect(isPendingConversion(saved!)).toBe(false)

    await updateExpense(id, {
      amount: 3000,
      currency: 'USD',
      date: TODAY,
      description: 'Spotify',
      categoryId: 'suscripciones',
    })
    expect((await db.expenses.get(id))?.amount).toBe(4695000)
  })
})

class FakeRecognition {
  static last: FakeRecognition | null = null
  lang = ''
  interimResults = false
  continuous = false
  maxAlternatives = 1
  onresult: ((event: unknown) => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn(() => this.onend?.())
  abort = vi.fn(() => this.onend?.())

  constructor() {
    FakeRecognition.last = this
  }

  say(text: string) {
    this.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: text } }],
    })
  }
}

describe('dictado', () => {
  beforeEach(async () => {
    Object.assign(window, { webkitSpeechRecognition: FakeRecognition })
    await db.settings.put({ key: 'micExplained', value: true })
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'webkitSpeechRecognition')
  })

  async function dictate(text: string) {
    const user = userEvent.setup()
    render(<App />)
    await user.click(
      await screen.findByRole('button', { name: 'Decí tu gasto' }),
    )
    await screen.findByRole('button', { name: 'Listo' })
    act(() => FakeRecognition.last!.say(text))
    await user.click(screen.getByRole('button', { name: 'Listo' }))
    await screen.findByRole('heading', { name: 'Confirmá el gasto' })
    return user
  }

  it('en inglés, aunque la app esté en español', async () => {
    await db.settings.put({ key: 'dictationLang', value: 'en-US' })
    await dictate('I spent 1500 on the bus yesterday')

    expect(FakeRecognition.last?.lang).toBe('en-US')
    expect(screen.getByLabelText('Monto')).toHaveValue('1.500')
    expect(screen.getByLabelText('Fecha')).toHaveValue(addDays(todayISO(), -1))
    expect(screen.getByLabelText('Descripción')).toHaveValue('Bus')
    await waitFor(() =>
      expect(screen.getByLabelText('Categoría')).toHaveValue('transporte'),
    )
  })

  it('"20 dólares" se confirma en dólares con la estimación en pesos', async () => {
    mockRates()
    const user = await dictate('gasté 20 dólares en Spotify')
    const currency = screen.getByRole('group', { name: 'Moneda del monto' })

    expect(
      within(currency).getByRole('button', { name: 'Dólares' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Monto')).toHaveValue('20')
    expect(
      await within(currency).findByText(/≈ \$\s31\.300 \(blue \$\s1\.565\)/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await screen.findByRole('heading', { name: 'Tally' })
    const [saved] = await db.expenses.toArray()
    expect(saved).toMatchObject({
      originalAmount: 2000,
      originalCurrency: 'USD',
      categoryId: 'suscripciones',
    })
  })
})
