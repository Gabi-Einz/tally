import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from '../../components/ScreenHeader'
import { db } from '../../db/db'
import type { DictationLang } from '../../db/types'
import {
  startWebSpeech,
  VoiceError,
  type VoiceErrorCode,
  type VoiceSession,
} from './webSpeech'

const MIC_EXPLAINED_KEY = 'micExplained'

interface Props {
  lang: DictationLang
  onTranscript: (text: string) => void
  onManual: () => void
  onCancel: () => void
}

type State =
  | { name: 'intro' }
  | { name: 'listening'; text: string }
  | { name: 'error'; code: VoiceErrorCode }

export function VoiceSheet({ lang, onTranscript, onManual, onCancel }: Props) {
  const { t } = useTranslation()
  const explained = useLiveQuery(
    async () => (await db.settings.get(MIC_EXPLAINED_KEY))?.value === true,
    [],
  )
  const [current, setState] = useState<State | null>(null)
  const session = useRef<VoiceSession | null>(null)
  const transcriptHandler = useRef(onTranscript)

  useEffect(() => {
    transcriptHandler.current = onTranscript
  }, [onTranscript])

  const startSession = useCallback(() => {
    const started = startWebSpeech(lang, (text) =>
      setState({ name: 'listening', text }),
    )
    session.current = started
    started.result.then(
      (text) => {
        if (session.current === started) transcriptHandler.current(text)
      },
      (error: unknown) => {
        if (session.current !== started) return
        const code = error instanceof VoiceError ? error.code : 'unknown'
        if (code !== 'aborted') setState({ name: 'error', code })
      },
    )
  }, [lang])

  useEffect(() => {
    if (explained !== true || session.current) return
    startSession()
    return () => {
      const running = session.current
      session.current = null
      running?.abort()
    }
  }, [explained, startSession])

  const listenAgain = () => {
    setState({ name: 'listening', text: '' })
    startSession()
  }

  const acceptIntro = () =>
    db.settings.put({ key: MIC_EXPLAINED_KEY, value: true })

  const state: State | null =
    current ??
    (explained === false
      ? { name: 'intro' }
      : explained
        ? { name: 'listening', text: '' }
        : null)

  return (
    <>
      <ScreenHeader title={t('voice.title')} onBack={onCancel} />
      <div className="flex flex-col items-center gap-6 px-4 pt-6 pb-10 text-center">
        {state?.name === 'intro' && (
          <>
            <MicBadge />
            <p className="max-w-xs text-muted">{t('voice.intro')}</p>
            <button
              type="button"
              onClick={acceptIntro}
              className="w-full rounded-2xl bg-brand py-4 text-lg font-semibold text-white"
            >
              {t('voice.allow')}
            </button>
          </>
        )}

        {state?.name === 'listening' && (
          <>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              {t('voice.engineChrome')}
            </span>
            <MicBadge active />
            <p
              aria-live="polite"
              className="min-h-14 max-w-xs font-mono text-lg"
            >
              {state.text || t('voice.listening')}
            </p>
            <p className="text-sm text-muted">{t('voice.example')}</p>
            <button
              type="button"
              onClick={() => session.current?.stop()}
              className="w-full rounded-2xl bg-brand py-4 text-lg font-semibold text-white"
            >
              {t('voice.done')}
            </button>
          </>
        )}

        {state?.name === 'error' && (
          <>
            <MicBadge />
            <p role="alert" className="max-w-xs">
              {t(`voice.errors.${state.code}`)}
            </p>
            {state.code !== 'unsupported' && (
              <button
                type="button"
                onClick={listenAgain}
                className="w-full rounded-2xl bg-brand py-4 text-lg font-semibold text-white"
              >
                {t('voice.retry')}
              </button>
            )}
            <button
              type="button"
              onClick={onManual}
              className="w-full rounded-2xl border border-line bg-white py-4 font-semibold"
            >
              {t('voice.manual')}
            </button>
          </>
        )}
      </div>
    </>
  )
}

function MicBadge({ active = false }: { active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-24 place-items-center rounded-full bg-brand text-white ${
        active ? 'animate-pulse ring-8 ring-brand-soft' : 'opacity-80'
      }`}
    >
      <MicIcon className="size-10" />
    </span>
  )
}

export function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
    </svg>
  )
}
