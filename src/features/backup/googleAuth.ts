import { DriveAuthError } from './driveApi'

const SCRIPT_URL = 'https://accounts.google.com/gsi/client'
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
}

interface TokenClient {
  requestAccessToken: (options: { prompt: string }) => void
}

interface GoogleOAuth {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
    error_callback: (error: { type: string }) => void
  }) => TokenClient
  revoke: (token: string, done: () => void) => void
}

let script: Promise<void> | null = null
let token: { value: string; expiresAt: number } | null = null

export function isDriveConfigured(): boolean {
  return !!CLIENT_ID
}

function oauth(): GoogleOAuth {
  return (
    window as unknown as { google: { accounts: { oauth2: GoogleOAuth } } }
  ).google.accounts.oauth2
}

function loadScript(): Promise<void> {
  script ??= new Promise((resolve, reject) => {
    const element = document.createElement('script')
    element.src = SCRIPT_URL
    element.async = true
    element.onload = () => resolve()
    element.onerror = () => {
      script = null
      reject(new Error('No se pudo cargar Google Identity Services'))
    }
    document.head.appendChild(element)
  })
  return script
}

export async function getAccessToken(interactive: boolean): Promise<string> {
  if (!CLIENT_ID) throw new DriveAuthError('Falta VITE_GOOGLE_CLIENT_ID')
  if (token && token.expiresAt > Date.now() + 60_000) return token.value
  await loadScript()
  return new Promise((resolve, reject) => {
    const client = oauth().initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response) => {
        if (!response.access_token) {
          reject(new DriveAuthError(response.error ?? 'sin token'))
          return
        }
        token = {
          value: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
        }
        resolve(token.value)
      },
      error_callback: (error) => reject(new DriveAuthError(error.type)),
    })
    client.requestAccessToken({ prompt: interactive ? 'consent' : '' })
  })
}

export function revokeAccess(): void {
  if (!token) return
  const value = token.value
  token = null
  oauth().revoke(value, () => {})
}
