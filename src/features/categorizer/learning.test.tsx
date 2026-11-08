import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../App'
import { db } from '../../db/db'

async function addExpense(
  user: ReturnType<typeof userEvent.setup>,
  description: string,
  category?: string,
) {
  await user.click(screen.getByRole('button', { name: '+ Cargar a mano' }))
  await user.type(await screen.findByLabelText('Monto'), '1000')
  await user.type(screen.getByLabelText('Descripción'), description)
  if (category)
    await user.selectOptions(screen.getByLabelText('Categoría'), category)
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  await screen.findByRole('heading', { name: 'Tally' })
}

describe('categorización en el formulario', () => {
  it('sugiere la categoría mientras se escribe la descripción', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '+ Cargar a mano' }))
    await user.type(await screen.findByLabelText('Descripción'), 'Farmacia')

    expect(screen.getByLabelText('Categoría')).toHaveValue('salud')
    expect(screen.getByText('Palabra clave · 80 %')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Descripción'))
    await user.type(screen.getByLabelText('Descripción'), 'Cosa rara')
    expect(screen.getByLabelText('Categoría')).toHaveValue('otros')
    expect(
      screen.getByText('Sin coincidencias: revisá la categoría'),
    ).toBeInTheDocument()
  })

  it('aprende de la corrección y acierta la próxima vez', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addExpense(user, 'Rapipago', 'servicios')

    const [first] = await db.expenses.toArray()
    expect(first).toMatchObject({
      categoryId: 'servicios',
      categorySource: 'manual',
    })
    expect(
      await db.rules.where('pattern').equals('rapipago').first(),
    ).toMatchObject({
      categoryId: 'servicios',
      hits: 1,
    })

    await user.click(screen.getByRole('button', { name: '+ Cargar a mano' }))
    await user.type(await screen.findByLabelText('Descripción'), 'Rapipago')
    expect(screen.getByLabelText('Categoría')).toHaveValue('servicios')
    expect(screen.getByText('Regla aprendida · 95 %')).toBeInTheDocument()
  })

  it('al editar y cambiar la categoría también aprende', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addExpense(user, 'Kiosco')
    await user.click(await screen.findByRole('button', { name: /Kiosco/ }))
    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    await screen.findByRole('option', { name: 'Comida y restaurantes' })
    await user.selectOptions(
      await screen.findByLabelText('Categoría'),
      'comida',
    )
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await screen.findByRole('button', { name: 'Eliminar' })

    expect(
      await db.rules.where('pattern').equals('kiosco').first(),
    ).toMatchObject({
      categoryId: 'comida',
    })
  })

  it('Ajustes lista las reglas y permite borrarlas', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addExpense(user, 'Rapipago', 'servicios')
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))

    const section = await screen.findByRole('region', {
      name: 'Reglas aprendidas',
    })
    expect(within(section).getByText('rapipago')).toBeInTheDocument()
    await user.click(
      within(section).getByRole('button', {
        name: 'Eliminar la regla "rapipago"',
      }),
    )
    expect(
      await within(section).findByText(/Todavía no hay reglas/),
    ).toBeInTheDocument()
    expect(await db.rules.count()).toBe(0)
  })
})
