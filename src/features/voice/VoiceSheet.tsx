import { useLiveQuery } from 'dexie-react-hooks'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from '../../components/ScreenHeader'
import { db } from '../../db/db'
import type { DictationLang } from '../../db/types'
import {
  currentCapabilities,
  resolveEngine,
  type VoiceEngine,
  type VoiceEnginePreference,
} from './engine'
import {
  startWebSpeech,
  VoiceError,
  type VoiceErrorCode,
  type VoiceSession,
} from './webSpeech'
import { getWhisperStatus, subscribeWhisperStatus } from './whisperClient'
import { startWhisper } from './whisperSession'

const MIC_EXPLAINED_KEY = 'micExplained'

interface Props {
  lang: DictationLang
  preference: VoiceEnginePreference
  onTranscript: (text: string) => void
  onManual: () => void
  onCancel: () => void
}

type State =
  | { name: 'intro' }
  | { name: 'listening'; text: string }
  | { name: 'recording' }
  | { name: 'transcribing' }
  | { name: 'error'; code: VoiceErrorCode }

const WHISPER_LANGUAGE: Record<DictationLang, 'spanish' | 'english'> = {
  'es-AR': 'spanish',
  'en-US': 'english',
}

export function VoiceSheet({
  lang,
  preference,
  onTranscript,
  onManual,
  onCancel,
}: Props) {
  const { t } = useTranslation()
  const explained = useLiveQuery(
    async () => (await db.settings.get(MIC_EXPLAINED_KEY))?.value === true,
    [],
  )
  const whisperStatus = useSyncExternalStore(
    subscribeWhisperStatus,
    getWhisperStatus,
  )
  const [initialEngine] = useState(() =>
    resolveEngine(preference, currentCapabilities()),
  )
  const [engine, setEngine] = useState<VoiceEngine | null>(initialEngine)
  const [current, setState] = useState<State | null>(null)
  const session = useRef<VoiceSession | null>(null)
  const transcriptHandler = useRef(onTranscript)

  useEffect(() => {
    transcriptHandler.current = onTranscript
  }, [onTranscript])

  const startSession = useCallback(
    function run(selected: VoiceEngine) {
      const started =
        selected === 'chrome'
          ? startWebSpeech(lang, (text) =>
              setState({ name: 'listening', text }),
            )
          : startWhisper(WHISPER_LANGUAGE[lang], (phase) =>
              setState(
                phase === 'recording'
                  ? { name: 'recording' }
                  : { name: 'transcribing' },
              ),
            )
      session.current = started
      started.result.then(
        (text) => {
          if (session.current === started) transcriptHandler.current(text)
        },
        (error: unknown) => {
          if (session.current !== started) return
          const code = error instanceof VoiceError ? error.code : 'unknown'
          if (code === 'aborted') return
          const caps = currentCapabilities()
          if (
            selected === 'chrome' &&
            code === 'network' &&
            preference === 'auto' &&
            caps.recording
          ) {
            setEngine('whisper')
            setState({ name: 'recording' })
            run('whisper')
            return
          }
          setState({ name: 'error', code })
        },
      )
    },
    [lang, preference],
  )

  useEffect(() => {
    if (explained !== true || session.current || !initialEngine) return
    startSession(initialEngine)
    return () => {
      const running = session.current
      session.current = null
      running?.abort()
    }
  }, [explained, initialEngine, startSession])

  const listenAgain = () => {
    if (!engine) return
    setState(
      engine === 'chrome'
        ? { name: 'listening', text: '' }
        : { name: 'recording' },
    )
    startSession(engine)
  }

  const acceptIntro = () =>
    db.settings.put({ key: MIC_EXPLAINED_KEY, value: true })

  const state: State | null =
    current ??
    (!initialEngine
      ? { name: 'error', code: 'unsupported' }
      : explained === false
        ? { name: 'intro' }
        : explained
          ? initialEngine === 'chrome'
            ? { name: 'listening', text: '' }
            : { name: 'recording' }
          : null)

  const engineLabel =
    engine === 'whisper' ? t('voice.engineLocal') : t('voice.engineChrome')
  const primaryButton =
    'w-full rounded-2xl bg-brand py-4 text-lg font-semibold text-white disabled:opacity-60'

  return (
    <>
      <ScreenHeader title={t('voice.title')} onBack={onCancel} />
      <div className="flex flex-col items-center gap-6 px-4 pt-6 pb-10 text-center">
        {state?.name === 'intro' && (
          <>
            <MicBadge />
            <p className="max-w-xs text-muted">
              {initialEngine === 'whisper'
                ? t('voice.introLocal')
                : t('voice.intro')}
            </p>
            <button
              type="button"
              onClick={acceptIntro}
              className={primaryButton}
            >
              {t('voice.allow')}
            </button>
          </>
        )}

        {(state?.name === 'listening' || state?.name === 'recording') && (
          <>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              {engineLabel}
            </span>
            <MicBadge active />
            <p
              aria-live="polite"
              className="min-h-14 max-w-xs font-mono text-lg"
            >
              {state.name === 'listening' && state.text
                ? state.text
                : state.name === 'recording'
                  ? t('voice.recording')
                  : t('voice.listening')}
            </p>
            <p className="text-sm text-muted">{t('voice.example')}</p>
            <button
              type="button"
              onClick={() => session.current?.stop()}
              className={primaryButton}
            >
              {t('voice.done')}
            </button>
          </>
        )}

        {state?.name === 'transcribing' && (
          <>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              {engineLabel}
            </span>
            <MicBadge />
            <p aria-live="polite" className="max-w-xs">
              {whisperStatus.state === 'loading'
                ? t('voice.downloadingModel', {
                    percent: Math.round(whisperStatus.progress),
                  })
                : t('voice.transcribing')}
            </p>
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
                className={primaryButton}
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
