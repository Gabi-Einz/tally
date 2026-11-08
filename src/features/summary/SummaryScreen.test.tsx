import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { createExpense } from '../../db/expenses'
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
      categoryId: 'comida',
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Resumen' }))

    expect(await screen.findByTestId('doughnut')).toHaveTextContent(
      'Supermercado,Comida y restaurantes',
    )
    expect(screen.getByText('$ 40.000')).toBeInTheDocument()
    const legend = screen.getByRole('list', { name: 'Gastos por categoría' })
    const rows = within(legend).getAllByRole('button')
    expect(rows[0]).toHaveTextContent(/Supermercado.*\$ 30\.000.*75,0/)
    expect(rows[1]).toHaveTextContent(/Comida y restaurantes.*\$ 10\.000.*25,0/)
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
      categoryId: 'comida',
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Resumen' }))
    const legend = await screen.findByRole('list', {
      name: 'Gastos por categoría',
    })
    await user.click(
      within(legend).getByRole('button', { name: /Comida y restaurantes/ }),
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
