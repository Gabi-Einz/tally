import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { createExpense } from '../../db/expenses'
import { db } from '../../db/db'
import { todayISO } from '../../lib/dates'

vi.mock('react-chartjs-2', () => ({
  Doughnut: ({ data }: { data: { labels: string[] } }) => (
    <div data-testid="doughnut">{data.labels.join(',')}</div>
  ),
}))

describe('Resumen', () => {
  it('muestra el total y el porcentaje por categoría del mes', async () => {
    const date = todayISO()
    await createExpense({
      amount: 3000000,
      date,
      description: 'Coto',
      categoryId: 'supermercado',
    })
    await createExpense({
      amount: 1000000,
      date,
      description: 'Rappi',
      categoryId: 'restaurantes',
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Resumen' }))

    expect(await screen.findByTestId('doughnut')).toHaveTextContent(
      'Supermercado,Restaurantes',
    )
    expect(screen.getByText('$ 40.000')).toBeInTheDocument()
    const legend = screen.getByRole('list', { name: 'Gastos por categoría' })
    const rows = within(legend).getAllByRole('button')
    expect(rows[0]).toHaveTextContent(/Supermercado.*\$ 30\.000.*75,0/)
    expect(rows[1]).toHaveTextContent(/Restaurantes.*\$ 10\.000.*25,0/)
  })

  it('al tocar una categoría abre Gastos filtrado por esa categoría', async () => {
    const date = todayISO()
    await createExpense({
      amount: 3000000,
      date,
      description: 'Coto',
      categoryId: 'supermercado',
    })
    await createExpense({
      amount: 1000000,
      date,
      description: 'Rappi',
      categoryId: 'restaurantes',
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Resumen' }))
    const legend = await screen.findByRole('list', {
      name: 'Gastos por categoría',
    })
    await user.click(
      within(legend).getByRole('button', { name: /Restaurantes/ }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Gastos' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /Rappi/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Coto/ }),
    ).not.toBeInTheDocument()
  })

  it('avisa cuando el mes no tiene gastos', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Resumen' }))
    expect(await screen.findByText(/No hay gastos en/)).toBeInTheDocument()
  })
})

describe('Resumen en dólares', () => {
  it('muestra el total en USD blue y avisa de los gastos sin cotización', async () => {
    const date = todayISO()
    const { id } = await createExpense({
      amount: 2300000,
      date,
      description: 'Coto',
      categoryId: 'supermercado',
    })
    await createExpense({
      amount: 500000,
      date,
      description: 'SUBE',
      categoryId: 'transporte',
    })
    const conversion = {
      rateDate: date,
      rateSource: 'dolarapi' as const,
      capturedAt: Date.now(),
    }
    await db.expenses.update(id, {
      usdBlue: { ...conversion, rate: 1565, amount: 1470 },
      usdCripto: { ...conversion, rate: 1643.99, amount: 1399 },
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Resumen' }))
    const currency = await screen.findByRole('group', {
      name: 'Moneda del gráfico',
    })
    await user.click(within(currency).getByRole('button', { name: 'USD blue' }))

    expect(await screen.findAllByText('US$ 14,70')).not.toHaveLength(0)
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 gasto todavía no tiene cotización',
    )

    await user.click(
      within(currency).getByRole('button', { name: 'USD cripto' }),
    )
    expect(await screen.findAllByText('USDT 13,99')).not.toHaveLength(0)
  })

  it('el detalle muestra las cotizaciones guardadas y los equivalentes', async () => {
    const date = todayISO()
    const { id } = await createExpense({
      amount: 230000,
      date,
      description: 'Farmacia',
      categoryId: 'salud',
    })
    await db.expenses.update(id, {
      usdBlue: {
        rate: 1565,
        amount: 147,
        rateDate: date,
        rateSource: 'dolarapi',
        capturedAt: Date.now(),
      },
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /Farmacia/ }))

    expect(
      await screen.findByText('Cotizaciones guardadas'),
    ).toBeInTheDocument()
    expect(screen.getByText('US$ 1,47')).toBeInTheDocument()
    expect(screen.getAllByText('USD pendiente')).toHaveLength(2)
  })
})
