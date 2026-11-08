import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import '../i18n'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { db } from '../db/db'

beforeEach(async () => {
  db.close()
  await db.delete()
  await db.open()
})

afterEach(() => {
  cleanup()
})
