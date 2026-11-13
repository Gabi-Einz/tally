import { describe, expect, it } from 'vitest'
import { defaultCategories } from '../../data/categories'
import { db } from '../../db/db'
import { learnCategory } from '../../db/rules'
import type { LearnedRule } from '../../db/types'
import { categorize, keyWords, levenshtein } from './categorize'

const categories = defaultCategories(0)
const guess = (description: string, rules: LearnedRule[] = []) =>
  categorize(description, categories, rules)

describe('categorize', () => {
  it.each([
    ['SUBE', 'transporte'],
    ['Nafta en YPF', 'transporte'],
    ['Colectivo', 'transporte'],
    ['Uber', 'transporte'],
    ['Peaje', 'transporte'],
    ['Farmacia', 'salud'],
    ['Remedios', 'salud'],
    ['Dentista', 'salud'],
    ['Coto', 'supermercado'],
    ['Verdulería', 'verduleria'],
    ['Carnicería', 'carniceria'],
    ['Chino', 'supermercado'],
    ['Rappi', 'restaurantes'],
    ['Pizza', 'restaurantes'],
    ['Café', 'cafeteria'],
    ['Luz a Edenor', 'servicios'],
    ['Internet', 'servicios'],
    ['Agua a AySA', 'servicios'],
    ['Expensas', 'vivienda'],
    ['Alquiler', 'vivienda'],
    ['Cine', 'entretenimiento'],
    ['Steam', 'entretenimiento'],
    ['Zapatillas', 'ropa'],
    ['Campera', 'ropa'],
    ['Libros', 'educacion'],
    ['Curso de inglés', 'educacion'],
    ['Netflix', 'suscripciones'],
    ['Spotify', 'suscripciones'],
    ['Google One', 'suscripciones'],
    ['Veterinaria', 'mascotas'],
    ['Balanceado para el perro', 'mascotas'],
    ['Regalo de cumpleaños', 'regalos'],
  ])('"%s" → %s por palabra clave', (description, categoryId) => {
    expect(guess(description)).toMatchObject({
      categoryId,
      source: 'keyword',
      confidence: 0.8,
    })
  })

  it('tolera errores de transcripción de una letra', () => {
    expect(guess('Farmasia').categoryId).toBe('salud')
    expect(guess('Veterinria').categoryId).toBe('mascotas')
  })

  it('va a "Otros" sin coincidencias', () => {
    expect(guess('Cosa rara')).toEqual({
      categoryId: 'otros',
      source: 'fallback',
      confidence: 0,
    })
    expect(guess('').source).toBe('fallback')
  })

  it('una regla aprendida gana sobre las palabras clave', () => {
    const rules: LearnedRule[] = [
      {
        id: '1',
        pattern: 'farmacia',
        categoryId: 'regalos',
        hits: 2,
        updatedAt: 0,
      },
    ]
    expect(guess('Farmacia', rules)).toMatchObject({
      categoryId: 'regalos',
      source: 'rule',
      confidence: 0.95,
      pattern: 'farmacia',
    })
  })

  it('con varias reglas gana la más confirmada', () => {
    const rules: LearnedRule[] = [
      {
        id: '1',
        pattern: 'nafta',
        categoryId: 'transporte',
        hits: 1,
        updatedAt: 0,
      },
      { id: '2', pattern: 'ypf', categoryId: 'otros', hits: 5, updatedAt: 0 },
    ]
    expect(guess('Nafta en YPF', rules).categoryId).toBe('otros')
  })

  it('extrae palabras importantes normalizadas', () => {
    expect(keyWords('Nafta en YPF')).toEqual(['nafta', 'ypf'])
    expect(keyWords('Café de la esquina 2')).toEqual(['cafe', 'esquina'])
  })

  it('calcula la distancia de edición', () => {
    expect(levenshtein('farmacia', 'farmasia')).toBe(1)
    expect(levenshtein('sube', 'subte')).toBe(1)
    expect(levenshtein('abc', 'xyz')).toBe(3)
  })
})

describe('learnCategory', () => {
  it('crea una regla por palabra importante y la actualiza si cambia', async () => {
    await learnCategory('Nafta en YPF', 'transporte', 1)
    let rules = await db.rules.orderBy('pattern').toArray()
    expect(rules.map((r) => [r.pattern, r.categoryId, r.hits])).toEqual([
      ['nafta', 'transporte', 1],
      ['ypf', 'transporte', 1],
    ])

    await learnCategory('YPF', 'transporte', 2)
    await learnCategory('Nafta', 'otros', 3)
    rules = await db.rules.orderBy('pattern').toArray()
    expect(rules.map((r) => [r.pattern, r.categoryId, r.hits])).toEqual([
      ['nafta', 'otros', 1],
      ['ypf', 'transporte', 2],
    ])
  })
})
