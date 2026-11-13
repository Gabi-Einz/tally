import { describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { createExpense } from '../../db/expenses'
import { learnCategory } from '../../db/rules'
import { DriveAuthError, uploadBackup } from './driveApi'
import { createSnapshot, isSnapshot, restoreSnapshot } from './snapshot'

describe('respaldo', () => {
  it('el snapshot incluye gastos, categorías, reglas y ajustes, sin datos locales', async () => {
    await createExpense(
      {
        amount: 1000,
        date: '2026-11-08',
        description: 'SUBE',
        categoryId: 'transporte',
      },
      5,
    )
    await learnCategory('Rapipago', 'servicios')
    await db.settings.bulkPut([
      { key: 'voiceEngine', value: 'whisper' },
      { key: 'semanticIndex', value: { huge: true } },
      { key: 'drive', value: { connected: true } },
    ])

    const snapshot = await createSnapshot(99)
    expect(isSnapshot(snapshot)).toBe(true)
    expect(snapshot).toMatchObject({ app: 'tally', version: 1, exportedAt: 99 })
    expect(snapshot.expenses).toHaveLength(1)
    expect(snapshot.categories).toHaveLength(16)
    expect(snapshot.rules.map((r) => r.pattern)).toEqual(['rapipago'])
    expect(snapshot.settings.map((s) => s.key)).toEqual(['voiceEngine'])
  })

  it('restaurar agrega lo que falta y conserva la versión más reciente de cada gasto', async () => {
    const kept = await createExpense(
      {
        amount: 1000,
        date: '2026-11-08',
        description: 'Local nuevo',
        categoryId: 'otros',
      },
      200,
    )
    const snapshot = await createSnapshot()
    snapshot.expenses = [
      { ...kept, description: 'Remoto viejo', updatedAt: 100 },
      { ...kept, id: 'remoto-1', description: 'Solo en Drive', updatedAt: 50 },
    ]
    snapshot.rules = [
      {
        id: 'r1',
        pattern: 'kiosco',
        categoryId: 'restaurantes',
        hits: 3,
        updatedAt: 10,
      },
    ]

    const result = await restoreSnapshot(snapshot)
    expect(result).toEqual({ expenses: 1, categories: 0, rules: 1 })
    expect((await db.expenses.get(kept.id))?.description).toBe('Local nuevo')
    expect((await db.expenses.get('remoto-1'))?.description).toBe(
      'Solo en Drive',
    )
    expect(
      await db.rules.where('pattern').equals('kiosco').first(),
    ).toMatchObject({
      categoryId: 'restaurantes',
    })
  })

  it('rechaza archivos que no son respaldos de Tally', () => {
    expect(isSnapshot({ app: 'otra' })).toBe(false)
    expect(isSnapshot(null)).toBe(false)
  })

  it('sube a la carpeta oculta: crea el archivo la primera vez y después lo reemplaza', async () => {
    const calls: { url: string; method: string }[] = []
    let exists = false
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input)
        calls.push({ url, method: init?.method ?? 'GET' })
        expect(new Headers(init?.headers).get('Authorization')).toBe(
          'Bearer tk',
        )
        if (url.startsWith('https://www.googleapis.com/drive/v3/files?'))
          return Response.json({
            files: exists ? [{ id: 'f1', modifiedTime: 'x' }] : [],
          })
        exists = true
        return Response.json({ id: 'f1' })
      }),
    )
    const snapshot = await createSnapshot()
    await uploadBackup('tk', snapshot)
    await uploadBackup('tk', snapshot)

    expect(calls[0].url).toContain('spaces=appDataFolder')
    expect(calls[1]).toMatchObject({ method: 'POST' })
    expect(calls[1].url).toContain('uploadType=multipart')
    expect(calls[3]).toMatchObject({ method: 'PATCH' })
    expect(calls[3].url).toContain('/files/f1?uploadType=media')
  })

  it('un 401 de Drive se informa como sesión vencida', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 401 })),
    )
    await expect(
      uploadBackup('tk', await createSnapshot()),
    ).rejects.toBeInstanceOf(DriveAuthError)
  })
})
