import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../App'
import { OTHER_CATEGORY_ID } from '../../data/categories'
import { db } from '../../db/db'
import { categorize } from '../categorizer/categorize'

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
})
