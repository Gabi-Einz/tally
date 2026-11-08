import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { db } from './db/db'
import { todayISO } from './lib/dates'

describe('App', () => {
  it('muestra el nombre de la app', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Tally' })).toBeInTheDocument()
  })

  it('carga un gasto a mano, lo edita y lo elimina', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '+ Cargar a mano' }))
    await user.type(await screen.findByLabelText('Monto'), '2.300')
    await user.type(screen.getByLabelText('Descripción'), 'Farmacia')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'salud')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    const row = await screen.findByRole('button', { name: /Farmacia/ })
    expect(row).toHaveTextContent('Salud · hoy')
    expect(row).toHaveTextContent('$ 2.300')
    const stored = await db.expenses.toArray()
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({
      amount: 230000,
      date: todayISO(),
      categoryId: 'salud',
    })

    await user.click(row)
    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    const amount = await screen.findByLabelText('Monto')
    expect(amount).toHaveValue('2.300')
    await user.clear(amount)
    await user.type(amount, '2.450,50')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    const deleteButton = await screen.findByRole('button', { name: 'Eliminar' })
    expect(
      screen.getByText(/2\.450,50/, { selector: 'p.text-4xl' }),
    ).toBeInTheDocument()
    expect((await db.expenses.toArray())[0].amount).toBe(245050)

    await user.click(deleteButton)
    const dialog = screen.getByRole('alertdialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Sí, eliminar' }),
    )
    expect(
      await screen.findByText('Todavía no cargaste gastos.'),
    ).toBeInTheDocument()
    expect(await db.expenses.count()).toBe(0)
  })

  it('no guarda si falta el monto o la descripción', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '+ Cargar a mano' }))
    await user.click(await screen.findByRole('button', { name: 'Guardar' }))

    expect(screen.getByText(/Ingresá un monto mayor a 0/)).toBeInTheDocument()
    expect(screen.getByText(/Escribí una descripción/)).toBeInTheDocument()
    expect(screen.getByLabelText('Monto')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(await db.expenses.count()).toBe(0)
  })

  it('agrupa los gastos del mes por día y filtra por categoría', async () => {
    const user = userEvent.setup()
    const { createExpense } = await import('./db/expenses')
    const today = todayISO()
    await createExpense({
      amount: 2300000,
      date: today,
      description: 'Coto',
      categoryId: 'supermercado',
    })
    await createExpense({
      amount: 500000,
      date: today,
      description: 'SUBE',
      categoryId: 'transporte',
    })
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Gastos' }))
    expect(
      await screen.findByRole('heading', { name: /^Hoy ·/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Coto/ })).toBeInTheDocument()

    const filters = screen.getByRole('group', { name: 'Filtrar por categoría' })
    await user.click(
      within(filters).getByRole('button', { name: 'Transporte' }),
    )
    expect(
      screen.queryByRole('button', { name: /Coto/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SUBE/ })).toBeInTheDocument()
  })
})
