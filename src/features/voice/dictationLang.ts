import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { DictationLang } from '../../db/types'

export const DICTATION_LANG_KEY = 'dictationLang'

export function useDictationLang(): DictationLang | undefined {
  return useLiveQuery(async () => {
    const value = (await db.settings.get(DICTATION_LANG_KEY))?.value
    return value === 'en-US' ? 'en-US' : 'es-AR'
  }, [])
}

export function setDictationLang(value: DictationLang) {
  return db.settings.put({ key: DICTATION_LANG_KEY, value })
}
