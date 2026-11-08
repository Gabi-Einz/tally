import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import '../i18n'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { db } from '../db/db'

beforeEach(async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('sin red en los tests'))),
  )
  db.close()
  await db.delete()
  await db.open()
})

afterEach(() => {
  vi.unstubAllGlobals()
  cleanup()
})
