import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { db } from '../../db/db'
import { createExpense } from '../../db/expenses'
import i18n from '../../i18n'

afterEach(async () => {
  await i18n.changeLanguage('es')
  delete document.documentElement.dataset.theme
})

describe('Ajustes: idioma, tema y archivo', () => {
  it('cambia el idioma de la app a inglés y lo recuerda', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    const group = await screen.findByRole('group', { name: 'Idioma de la app' })
    await user.click(within(group).getByRole('button', { name: 'English' }))

    expect(
      await screen.findByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect((await db.settings.get('appLang'))?.value).toBe('en')
  })

  it('aplica el tema oscuro', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    const group = await screen.findByRole('group', { name: 'Tema' })
    await user.click(within(group).getByRole('button', { name: 'Oscuro' }))
    expect(document.documentElement.dataset.theme).toBe('dark')

    await user.click(within(group).getByRole('button', { name: 'Sistema' }))
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('importa un respaldo JSON y rechaza archivos que no lo son', async () => {
    const { id } = await createExpense({
      amount: 1000,
      date: '2026-11-08',
      description: 'SUBE',
      categoryId: 'transporte',
    })
    const snapshot = {
      app: 'tally',
      version: 1,
      exportedAt: 1,
      expenses: [
        {
          ...(await db.expenses.get(id))!,
          id: 'importado',
          description: 'Importado',
        },
      ],
      categories: [],
      rules: [],
      settings: [],
    }
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    const input = await screen.findByLabelText('Importar JSON', {
      selector: 'input',
    })

    await user.upload(
      input,
      new File([JSON.stringify(snapshot)], 'r.json', {
        type: 'application/json',
      }),
    )
    expect(await screen.findByText('Se importó 1 gasto.')).toBeInTheDocument()
    expect((await db.expenses.get('importado'))?.description).toBe('Importado')

    await user.upload(
      input,
      new File(['{"nada":1}'], 'x.json', { type: 'application/json' }),
    )
    expect(
      await screen.findByText('El archivo no es un respaldo de Tally.'),
    ).toBeInTheDocument()
  })
})
