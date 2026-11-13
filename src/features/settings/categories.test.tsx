import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { OTHER_CATEGORY_ID } from '../../data/categories'
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
    expect(categories).toHaveLength(14)
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

  it('edita una categoría de fábrica y el nombre nuevo vale solo para el idioma de la app', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    await user.click(
      await screen.findByRole('button', {
        name: 'Editar la categoría Transporte',
      }),
    )
    const [keywords] = screen.getAllByLabelText('Palabras clave (opcional)')
    await user.clear(keywords)
    await user.type(keywords, 'sube, nafta')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(
      await screen.findByRole('button', {
        name: 'Editar la categoría Transporte',
      }),
    ).toBeInTheDocument()
    expect(await db.categories.get('transporte')).toMatchObject({
      name: null,
      keywords: ['sube', 'nafta'],
    })
    expect((await db.categories.get('transporte'))?.names).toBeUndefined()

    await user.click(
      screen.getByRole('button', { name: 'Editar la categoría Transporte' }),
    )
    const [name] = screen.getAllByLabelText('Nombre')
    await user.clear(name)
    await user.type(name, 'Viajes')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(
      await screen.findByRole('button', { name: 'Editar la categoría Viajes' }),
    ).toBeInTheDocument()
    expect((await db.categories.get('transporte'))?.names).toEqual({
      es: 'Viajes',
    })

    // En inglés sigue la traducción de fábrica hasta que se la renombre ahí
    await act(() => i18n.changeLanguage('en'))
    await user.click(
      await screen.findByRole('button', {
        name: 'Edit the Transportation category',
      }),
    )
    const [nameEn] = screen.getAllByLabelText('Name')
    await user.clear(nameEn)
    await user.type(nameEn, 'Trips')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(
      await screen.findByRole('button', { name: 'Edit the Trips category' }),
    ).toBeInTheDocument()

    await act(() => i18n.changeLanguage('es'))
    expect(
      await screen.findByRole('button', { name: 'Editar la categoría Viajes' }),
    ).toBeInTheDocument()
    expect((await db.categories.get('transporte'))?.names).toEqual({
      es: 'Viajes',
      en: 'Trips',
    })
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

  it('elimina una categoría: sus gastos pasan a Otros y se borran sus reglas', async () => {
    const { id } = await createExpense({
      amount: 50000,
      date: '2026-11-08',
      description: 'veterinaria',
      categoryId: 'mascotas',
    })
    await learnCategory('veterinaria', 'mascotas')
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    await user.click(
      await screen.findByRole('button', {
        name: 'Editar la categoría Mascotas',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Sí, eliminar' }),
    )

    expect(
      await screen.findByRole('button', { name: 'Editar la categoría Otros' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Editar la categoría Mascotas' }),
    ).not.toBeInTheDocument()
    expect(await db.categories.get('mascotas')).toBeUndefined()
    expect((await db.expenses.get(id))?.categoryId).toBe(OTHER_CATEGORY_ID)
    expect(await db.rules.count()).toBe(0)
  })

  it('no deja eliminar "Otros"', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    await user.click(
      await screen.findByRole('button', { name: 'Editar la categoría Otros' }),
    )
    expect(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Eliminar' }),
    ).not.toBeInTheDocument()
  })
})
