import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { db } from '../../db/db'

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

  say(text: string, isFinal: boolean) {
    this.onresult?.({
      resultIndex: 0,
      results: [{ isFinal, 0: { transcript: text } }],
    })
  }

  fail(error: string) {
    this.onerror?.({ error })
    this.onend?.()
  }
}

const recognition = () => {
  if (!FakeRecognition.last) throw new Error('no se inició el reconocimiento')
  return FakeRecognition.last
}

describe('registro por voz', () => {
  beforeEach(async () => {
    FakeRecognition.last = null
    Object.assign(window, { webkitSpeechRecognition: FakeRecognition })
    await db.settings.put({ key: 'micExplained', value: true })
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'webkitSpeechRecognition')
  })

  it('muestra el texto en vivo y abre la confirmación con lo dictado', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Decí tu gasto' }))

    expect(await screen.findByText('Te escucho…')).toBeInTheDocument()
    expect(recognition().lang).toBe('es-AR')

    act(() => recognition().say('gasté 5000', false))
    expect(screen.getByText('gasté 5000')).toBeInTheDocument()

    act(() => recognition().say('gasté 5000 en la SUBE', true))
    await user.click(screen.getByRole('button', { name: 'Listo' }))

    expect(
      await screen.findByRole('heading', { name: 'Confirmá el gasto' }),
    ).toBeInTheDocument()
    expect(screen.getByText('“gasté 5000 en la SUBE”')).toBeInTheDocument()
    expect(screen.getByLabelText('Monto')).toHaveValue('5.000')
    expect(screen.getByLabelText('Descripción')).toHaveValue('SUBE')

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await screen.findByRole('button', { name: /SUBE/ })
    const [saved] = await db.expenses.toArray()
    expect(saved).toMatchObject({
      amount: 500000,
      rawTranscript: 'gasté 5000 en la SUBE',
      dictationLang: 'es-AR',
    })
  })

  it('explica el error cuando no hay permiso y ofrece cargar a mano', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Decí tu gasto' }))
    await screen.findByText('Te escucho…')

    act(() => recognition().fail('not-allowed'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No hay permiso para usar el micrófono',
    )

    await user.click(screen.getByRole('button', { name: 'Cargar a mano' }))
    expect(
      await screen.findByRole('heading', { name: 'Nuevo gasto' }),
    ).toBeInTheDocument()
  })

  it('pide permiso la primera vez antes de escuchar', async () => {
    await db.settings.delete('micExplained')
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Decí tu gasto' }))

    expect(await screen.findByText(/necesita el micrófono/)).toBeInTheDocument()
    expect(FakeRecognition.last).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Permitir y hablar' }))
    expect(await screen.findByText('Te escucho…')).toBeInTheDocument()
    expect((await db.settings.get('micExplained'))?.value).toBe(true)
  })

  it('"Repetir" vuelve a escuchar', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Decí tu gasto' }))
    await screen.findByText('Te escucho…')
    act(() => recognition().say('hola', true))
    await user.click(screen.getByRole('button', { name: 'Listo' }))
    await screen.findByRole('heading', { name: 'Confirmá el gasto' })

    await user.click(screen.getByRole('button', { name: 'Repetir' }))
    expect(await screen.findByText('Te escucho…')).toBeInTheDocument()
  })
})
