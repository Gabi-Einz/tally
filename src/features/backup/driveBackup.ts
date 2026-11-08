import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import {
  downloadBackup,
  DriveAuthError,
  findBackupFile,
  uploadBackup,
} from './driveApi'
import { getAccessToken, isDriveConfigured, revokeAccess } from './googleAuth'
import {
  createSnapshot,
  isSnapshot,
  restoreSnapshot,
  type RestoreResult,
} from './snapshot'

const DRIVE_KEY = 'drive'
const LAST_CHANGE_KEY = 'tally:lastChangeAt'
const DEBOUNCE_MS = 5000
export const STALE_BACKUP_MS = 3 * 24 * 60 * 60 * 1000

export type BackupError = 'offline' | 'auth' | 'network'

export interface DriveState {
  connected: boolean
  lastBackupAt: number | null
  lastError: BackupError | null
}

const DISCONNECTED: DriveState = {
  connected: false,
  lastBackupAt: null,
  lastError: null,
}

export async function getDriveState(): Promise<DriveState> {
  const value = (await db.settings.get(DRIVE_KEY))?.value as
    DriveState | undefined
  return value ?? DISCONNECTED
}

async function updateDriveState(changes: Partial<DriveState>) {
  const current = await getDriveState()
  await db.settings.put({ key: DRIVE_KEY, value: { ...current, ...changes } })
}

export function useDriveState(): DriveState | undefined {
  return useLiveQuery(getDriveState, [])
}

function readLastChange(): number {
  try {
    return Number(localStorage.getItem(LAST_CHANGE_KEY) ?? 0)
  } catch {
    return 0
  }
}

function writeLastChange(value: number) {
  try {
    localStorage.setItem(LAST_CHANGE_KEY, String(value))
  } catch {
    return
  }
}

function errorKind(error: unknown): BackupError {
  if (!navigator.onLine) return 'offline'
  return error instanceof DriveAuthError ? 'auth' : 'network'
}

export async function connectDrive(): Promise<{ hasRemoteBackup: boolean }> {
  const token = await getAccessToken(true)
  await updateDriveState({ connected: true, lastError: null })
  const remote = await findBackupFile(token)
  return { hasRemoteBackup: remote !== null }
}

export async function disconnectDrive(): Promise<void> {
  revokeAccess()
  await db.settings.put({ key: DRIVE_KEY, value: DISCONNECTED })
}

export async function backupNow(interactive = false): Promise<boolean> {
  const state = await getDriveState()
  if (!state.connected || !isDriveConfigured()) return false
  if (!navigator.onLine) {
    await updateDriveState({ lastError: 'offline' })
    return false
  }
  try {
    const token = await getAccessToken(interactive)
    const startedAt = Date.now()
    await uploadBackup(token, await createSnapshot(startedAt))
    await updateDriveState({ lastBackupAt: startedAt, lastError: null })
    return true
  } catch (error) {
    await updateDriveState({ lastError: errorKind(error) })
    return false
  }
}

export async function restoreFromDrive(): Promise<RestoreResult | null> {
  const token = await getAccessToken(true)
  const data = await downloadBackup(token)
  if (!isSnapshot(data)) return null
  return restoreSnapshot(data)
}

let timer: ReturnType<typeof setTimeout> | null = null

function scheduleBackup() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void backupNow()
  }, DEBOUNCE_MS)
}

export function markDirty(now = Date.now()) {
  writeLastChange(now)
  scheduleBackup()
}

async function backupIfDirty() {
  const state = await getDriveState()
  if (state.connected && readLastChange() > (state.lastBackupAt ?? 0))
    scheduleBackup()
}

const IGNORED_SETTINGS = new Set([DRIVE_KEY, 'semanticIndex'])

export function startAutoBackup(): void {
  const onChange = () => markDirty()
  for (const table of [db.expenses, db.categories, db.rules]) {
    table.hook('creating', onChange)
    table.hook('updating', onChange)
    table.hook('deleting', onChange)
  }
  const onSetting = (key: unknown) => {
    if (!IGNORED_SETTINGS.has(String(key))) markDirty()
  }
  db.settings.hook('creating', (key) => onSetting(key))
  db.settings.hook('updating', (_mods, key) => onSetting(key))
  db.settings.hook('deleting', (key) => onSetting(key))
  window.addEventListener('online', () => void backupIfDirty())
  void backupIfDirty()
}
