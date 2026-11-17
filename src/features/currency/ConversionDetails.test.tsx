import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Expense } from '../../db/types'
import { ConversionDetails } from './ConversionDetails'

const conversion = {
  amount: 147,
  rateDate: '2026-11-01',
  rateSource: 'argentinadatos' as const,
  capturedAt: 0,
}

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: 'g1',
    amount: 230000,
    currency: 'ARS',
    originalAmount: 230000,
    originalCurrency: 'ARS',
    dictationLang: 'es-AR',
    usdBlue: null,
    usdCripto: null,
    description: 'Farmacia',
    categoryId: 'salud',
    date: '2026-11-01',
    rawTranscript: '',
    categorySource: 'manual',
    confidence: 1,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

const row = (name: string) =>
  screen.getByRole('rowheader', { name }).closest('tr')!

describe('Cotizaciones guardadas', () => {
  it('muestra compra y venta de USD blue y USDT', () => {
    render(
      <ConversionDetails
        expense={expense({
          usdBlue: { ...conversion, rate: 1565, buy: 1545 },
          usdCripto: { ...conversion, rate: 1643.99, buy: null },
        })}
      />,
    )
    expect(screen.getByRole('columnheader', { name: 'Compra' })).toBeVisible()
    expect(row('USD blue')).toHaveTextContent(/\$\s1\.545.*\$\s1\.565/)
    expect(row('USDT')).toHaveTextContent(/—.*\$\s1\.643,99/)
    expect(
      screen.getByText(/Los equivalentes usan la venta\./),
    ).toBeInTheDocument()
  })

  it('marca como pendiente lo que todavía no tiene cotización', () => {
    render(<ConversionDetails expense={expense({})} />)
    expect(row('USD blue')).toHaveTextContent('USD pendiente')
  })
})
