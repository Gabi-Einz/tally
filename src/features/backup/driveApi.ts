import type { BackupSnapshot } from './snapshot'

export const BACKUP_FILE_NAME = 'tally-backup.json'
const FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'

export class DriveAuthError extends Error {}

async function request(url: string, token: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  })
  if (response.status === 401 || response.status === 403)
    throw new DriveAuthError(`Drive respondió ${response.status}`)
  if (!response.ok) throw new Error(`Drive respondió ${response.status}`)
  return response
}

export async function findBackupFile(
  token: string,
): Promise<{ id: string; modifiedTime: string } | null> {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name = '${BACKUP_FILE_NAME}'`,
    fields: 'files(id, modifiedTime)',
  })
  const response = await request(`${FILES_URL}?${params}`, token)
  const data = (await response.json()) as {
    files: { id: string; modifiedTime: string }[]
  }
  return data.files[0] ?? null
}

export async function uploadBackup(
  token: string,
  snapshot: BackupSnapshot,
): Promise<void> {
  const body = JSON.stringify(snapshot)
  const existing = await findBackupFile(token)
  if (existing) {
    await request(`${UPLOAD_URL}/${existing.id}?uploadType=media`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    return
  }
  const form = new FormData()
  form.append(
    'metadata',
    new Blob(
      [JSON.stringify({ name: BACKUP_FILE_NAME, parents: ['appDataFolder'] })],
      { type: 'application/json' },
    ),
  )
  form.append('file', new Blob([body], { type: 'application/json' }))
  await request(`${UPLOAD_URL}?uploadType=multipart`, token, {
    method: 'POST',
    body: form,
  })
}

export async function downloadBackup(token: string): Promise<unknown | null> {
  const file = await findBackupFile(token)
  if (!file) return null
  const response = await request(`${FILES_URL}/${file.id}?alt=media`, token)
  return response.json()
}
