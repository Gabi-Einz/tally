import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  currentCapabilities,
  setVoiceEnginePreference,
  useVoiceEnginePreference,
  type VoiceEnginePreference,
} from '../voice/engine'

const OPTIONS: VoiceEnginePreference[] = ['auto', 'chrome', 'whisper']

export function VoiceEngineSection() {
  const { t } = useTranslation()
  const preference = useVoiceEnginePreference()
  const [caps] = useState(currentCapabilities)
  const available: Record<VoiceEnginePreference, boolean> = {
    auto: caps.webSpeech || caps.recording,
    chrome: caps.webSpeech,
    whisper: caps.recording,
  }

  return (
    <section aria-labelledby="voice-engine-title">
      <h2 id="voice-engine-title" className="font-semibold">
        {t('settings.voice.title')}
      </h2>
      <div
        role="group"
        aria-labelledby="voice-engine-title"
        className="mt-2 flex gap-1 rounded-xl bg-sunk p-1"
      >
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            disabled={!available[option]}
            aria-pressed={preference === option}
            onClick={() => setVoiceEnginePreference(option)}
            className={`flex-1 rounded-lg px-2 py-2 text-sm disabled:opacity-40 ${
              preference === option
                ? 'bg-white font-semibold shadow-sm'
                : 'text-muted'
            }`}
          >
            {t(`settings.voice.${option}`)}
          </button>
        ))}
      </div>
      {preference && (
        <p className="mt-2 text-sm text-muted">
          {t(`settings.voice.${preference}Help`)}
        </p>
      )}
      {!caps.webSpeech && (
        <p className="mt-1 text-sm text-muted">
          {t('settings.voice.chromeUnavailable')}
        </p>
      )}
    </section>
  )
}
