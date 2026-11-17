import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { OTHER_CATEGORY_ID } from '../../data/categories'
import {
  addCategory,
  deleteCategory,
  updateCategory,
} from '../../db/categories'
import { db } from '../../db/db'
import { createExpense } from '../../db/expenses'
import { learnCategory } from '../../db/rules'
import i18n from '../../i18n'
import { categorize } from '../categorizer/categorize'

afterEach(async () => {
  await i18n.changeLanguage('es')
})

describe('Ajustes: categorías', () => {
  it('agrega una categoría nueva antes de "Otros" y la usa al categorizar', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    await user.type(await screen.findByLabelText('Nombre'), '  Deportes ')
    await user.type(
      screen.getByLabelText('Palabras clave (opcional)'),
      'Gimnasio, pileta,, ',
    )
    await user.click(screen.getByRole('button', { name: 'Agregar categoría' }))

    expect(await screen.findByText('Deportes')).toBeInTheDocument()
    const categories = await db.categories.orderBy('order').toArray()
    expect(categories).toHaveLength(17)
    expect(categories.at(-1)?.id).toBe(OTHER_CATEGORY_ID)
    const created = categories.at(-2)!
    expect(created).toMatchObject({
      name: 'Deportes',
      builtin: false,
      keywords: ['gimnasio', 'pileta'],
    })
    expect(categorize('pase de gimnasio', categories, []).categoryId).toBe(
      created.id,
    )
  })

  it('las categorías de fábrica no se pueden editar ni eliminar', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    expect(await screen.findByText('Transporte')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^Editar la categoría/ }),
    ).not.toBeInTheDocument()
    await expect(
      updateCategory(
        'transporte',
        { name: 'Viajes', color: '#000000', keywords: [] },
        'es',
      ),
    ).rejects.toThrow()
    await expect(deleteCategory('transporte')).rejects.toThrow()
    expect(await db.categories.get('transporte')).toMatchObject({ name: null })
  })

  it('edita una categoría propia y el nombre nuevo vale solo para el idioma de la app', async () => {
    const { id } = await addCategory({
      name: 'Deportes',
      color: '#d6336c',
      keywords: ['club'],
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    await user.click(
      await screen.findByRole('button', {
        name: 'Editar la categoría Deportes',
      }),
    )
    const [keywords] = screen.getAllByLabelText('Palabras clave (opcional)')
    await user.clear(keywords)
    await user.type(keywords, 'gimnasio, pileta')
    const [name] = screen.getAllByLabelText('Nombre')
    await user.clear(name)
    await user.type(name, 'Gimnasio')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(
      await screen.findByRole('button', {
        name: 'Editar la categoría Gimnasio',
      }),
    ).toBeInTheDocument()
    expect(await db.categories.get(id)).toMatchObject({
      name: 'Deportes',
      names: { es: 'Gimnasio' },
      keywords: ['gimnasio', 'pileta'],
    })

    // En inglés sigue el nombre con que se creó
    await act(() => i18n.changeLanguage('en'))
    expect(
      await screen.findByRole('button', { name: 'Edit the Deportes category' }),
    ).toBeInTheDocument()
  })

  it('una categoría creada por el usuario usa su nombre en los dos idiomas', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    await user.type(await screen.findByLabelText('Nombre'), 'Deportes')
    await user.click(screen.getByRole('button', { name: 'Agregar categoría' }))
    await screen.findByRole('button', { name: 'Editar la categoría Deportes' })

    await act(() => i18n.changeLanguage('en'))
    expect(
      await screen.findByRole('button', { name: 'Edit the Deportes category' }),
    ).toBeInTheDocument()
  })

  it('elimina una categoría propia: sus gastos pasan a Otros y se borran sus reglas', async () => {
    const category = await addCategory({
      name: 'Deportes',
      color: '#d6336c',
      keywords: [],
    })
    const { id } = await createExpense({
      amount: 50000,
      date: '2026-11-08',
      description: 'cuota del club',
      categoryId: category.id,
    })
    await learnCategory('cuota del club', category.id)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    await user.click(
      await screen.findByRole('button', {
        name: 'Editar la categoría Deportes',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Sí, eliminar' }),
    )

    await waitFor(async () =>
      expect(await db.categories.get(category.id)).toBeUndefined(),
    )
    expect(
      screen.queryByRole('button', { name: 'Editar la categoría Deportes' }),
    ).not.toBeInTheDocument()
    expect((await db.expenses.get(id))?.categoryId).toBe(OTHER_CATEGORY_ID)
    expect(await db.rules.count()).toBe(0)
  })
})
