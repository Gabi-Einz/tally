import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import i18n, { type AppLanguage } from '../i18n'

export type ThemePreference = 'system' | 'light' | 'dark'

const THEME_KEY = 'theme'
const APP_LANG_KEY = 'appLang'

function applyTheme(theme: ThemePreference) {
  if (theme === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
}

function asTheme(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system'
}

function asLanguage(value: unknown): AppLanguage {
  return value === 'en' ? 'en' : 'es'
}

export async function loadPreferences(): Promise<void> {
  const [theme, lang] = await Promise.all([
    db.settings.get(THEME_KEY),
    db.settings.get(APP_LANG_KEY),
  ])
  applyTheme(asTheme(theme?.value))
  await i18n.changeLanguage(asLanguage(lang?.value))
}

export function useThemePreference(): ThemePreference | undefined {
  return useLiveQuery(
    async () => asTheme((await db.settings.get(THEME_KEY))?.value),
    [],
  )
}

export async function setThemePreference(theme: ThemePreference) {
  applyTheme(theme)
  await db.settings.put({ key: THEME_KEY, value: theme })
}

export function useAppLanguage(): AppLanguage | undefined {
  return useLiveQuery(
    async () => asLanguage((await db.settings.get(APP_LANG_KEY))?.value),
    [],
  )
}

export async function setAppLanguage(lang: AppLanguage) {
  await i18n.changeLanguage(lang)
  await db.settings.put({ key: APP_LANG_KEY, value: lang })
}
