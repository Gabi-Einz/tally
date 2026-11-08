import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { defaultCategories } from '../../data/categories'
import { db } from '../../db/db'
import {
  bestSemanticMatch,
  categoryExamples,
  examplesFor,
  semanticConfidence,
  SEMANTIC_MIN_SIMILARITY,
} from './semantic'

const WORD_DIMENSION: Record<string, number> = {
  michi: 0,
  gato: 0,
  perro: 0,
  veterinaria: 0,
}

function fakeVector(text: string): number[] {
  const v = [0.1, 0.1, 0.1, 0.1]
  const words = text.toLowerCase().split(/\W+/)
  const dim = words.map((w) => WORD_DIMENSION[w]).find((d) => d !== undefined)
  v[dim ?? 3] = 1
  const norm = Math.hypot(...v)
  return v.map((x) => x / norm)
}

vi.mock('./embeddingsClient', () => ({
  embed: async (texts: string[]) => texts.map(fakeVector),
  warmUpModel: () => {},
  getModelStatus: () => ({ state: 'ready' }),
  subscribeModelStatus: () => () => {},
}))

describe('semántica', () => {
  it('arma ejemplos con la descripción y las palabras clave de cada categoría', () => {
    const [supermercado] = defaultCategories(0)
    const examples = categoryExamples(supermercado)
    expect(examples).toContain('almacén')
    expect(examples).toContain('coto')
    expect(new Set(examples).size).toBe(examples.length)
    expect(
      examplesFor(defaultCategories(0)).some((e) => e.categoryId === 'otros'),
    ).toBe(false)
  })

  it('elige el ejemplo más parecido', () => {
    const match = bestSemanticMatch(
      [1, 0],
      [
        { categoryId: 'a', vector: [0, 1] },
        { categoryId: 'b', vector: [0.9, 0.1] },
      ],
    )
    expect(match).toEqual({ categoryId: 'b', similarity: 0.9 })
    expect(bestSemanticMatch([1, 0], [])).toBeNull()
  })

  it('convierte la similitud en confianza, con tope y piso', () => {
    expect(semanticConfidence(SEMANTIC_MIN_SIMILARITY - 0.01)).toBe(0)
    expect(semanticConfidence(SEMANTIC_MIN_SIMILARITY)).toBeCloseTo(0.3)
    expect(semanticConfidence(0.99)).toBe(0.85)
  })

  it('sugiere por significado cuando no hay regla ni palabra clave', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '+ Cargar a mano' }))
    await user.type(
      await screen.findByLabelText('Descripción'),
      'arena del michi',
    )

    expect(
      await screen.findByText(/Parecido por significado/),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Categoría')).toHaveValue('mascotas')

    await user.type(screen.getByLabelText('Monto'), '3000')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await screen.findByRole('button', { name: /arena del michi/i })
    const [saved] = await db.expenses.toArray()
    expect(saved).toMatchObject({
      categoryId: 'mascotas',
      categorySource: 'embedding',
    })
    expect((await db.settings.get('semanticIndex'))?.value).toBeTruthy()
  })
})
