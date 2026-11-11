import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { db } from '../../db/db'
import { VoiceError } from './webSpeech'

const whisper = vi.hoisted(() => ({
  outcome: { text: 'gasté 3000 en la verdulería' } as {
    text?: string
    error?: string
  },
  started: 0,
}))

vi.mock('./audio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./audio')>()),
  isRecordingSupported: () => true,
}))

vi.mock('./whisperSession', () => ({
  startWhisper: (
    _language: string,
    onPhase: (phase: 'recording' | 'transcribing') => void,
  ) => {
    whisper.started++
    let finish: () => void = () => {}
    const stopped = new Promise<void>((resolve) => {
      finish = resolve
    })
    onPhase('recording')
    const result = stopped.then(() => {
      onPhase('transcribing')
      if (whisper.outcome.error)
        throw new VoiceError(whisper.outcome.error as 'no-speech')
      return whisper.outcome.text ?? ''
    })
    return { result, stop: finish, abort: finish }
  },
}))

describe('dictado con Whisper', () => {
  beforeEach(async () => {
    whisper.started = 0
    whisper.outcome = { text: 'gasté 3000 en la verdulería' }
    await db.settings.bulkPut([
      { key: 'micExplained', value: true },
      { key: 'voiceEngine', value: 'whisper' },
    ])
  })

  it('graba, transcribe en el celular y abre la confirmación', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(
      await screen.findByRole('button', { name: 'Decí tu gasto' }),
    )

    expect(await screen.findByText('Local')).toBeInTheDocument()
    expect(screen.getByText(/Grabando/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Listo' }))

    expect(
      await screen.findByRole('heading', { name: 'Confirmá el gasto' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Monto')).toHaveValue('3.000')
    expect(screen.getByLabelText('Descripción')).toHaveValue('Verdulería')
    await waitFor(() =>
      expect(screen.getByLabelText('Categoría')).toHaveValue('supermercado'),
    )
  })

  it('si no escuchó nada lo explica', async () => {
    whisper.outcome = { error: 'no-speech' }
    const user = userEvent.setup()
    render(<App />)
    await user.click(
      await screen.findByRole('button', { name: 'Decí tu gasto' }),
    )
    await user.click(await screen.findByRole('button', { name: 'Listo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No escuché nada',
    )
  })

  it('Ajustes permite elegir el motor de voz', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    const group = await screen.findByRole('group', { name: 'Motor de voz' })

    expect(
      within(group).getByRole('button', { name: 'Solo Whisper' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      within(group).getByRole('button', { name: 'Solo Chrome' }),
    ).toBeDisabled()

    await user.click(within(group).getByRole('button', { name: 'Automático' }))
    expect(
      await screen.findByText(/Usa Chrome si hay internet/),
    ).toBeInTheDocument()
    expect((await db.settings.get('voiceEngine'))?.value).toBe('auto')
  })
})
