import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { isRecordingSupported } from './audio'
import { isWebSpeechSupported } from './webSpeech'

export type VoiceEnginePreference = 'auto' | 'chrome' | 'whisper'
export type VoiceEngine = 'chrome' | 'whisper'

export const VOICE_ENGINE_KEY = 'voiceEngine'

export interface VoiceCapabilities {
  webSpeech: boolean
  recording: boolean
  online: boolean
}

export function currentCapabilities(): VoiceCapabilities {
  return {
    webSpeech: isWebSpeechSupported(),
    recording: isRecordingSupported(),
    online: navigator.onLine,
  }
}

export function resolveEngine(
  preference: VoiceEnginePreference,
  caps: VoiceCapabilities,
): VoiceEngine | null {
  if (preference === 'chrome') return caps.webSpeech ? 'chrome' : null
  if (preference === 'whisper') return caps.recording ? 'whisper' : null
  if (caps.webSpeech && caps.online) return 'chrome'
  if (caps.recording) return 'whisper'
  return caps.webSpeech ? 'chrome' : null
}

export function useVoiceEnginePreference(): VoiceEnginePreference | undefined {
  return useLiveQuery(async () => {
    const value = (await db.settings.get(VOICE_ENGINE_KEY))?.value
    return value === 'chrome' || value === 'whisper' ? value : 'auto'
  }, [])
}

export function setVoiceEnginePreference(value: VoiceEnginePreference) {
  return db.settings.put({ key: VOICE_ENGINE_KEY, value })
}
