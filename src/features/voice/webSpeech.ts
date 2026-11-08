export type VoiceErrorCode =
  | 'unsupported'
  | 'not-allowed'
  | 'no-speech'
  | 'network'
  | 'aborted'
  | 'unknown'

export class VoiceError extends Error {
  readonly code: VoiceErrorCode

  constructor(code: VoiceErrorCode) {
    super(code)
    this.code = code
  }
}

export interface VoiceSession {
  result: Promise<string>
  stop: () => void
  abort: () => void
}

interface RecognitionAlternative {
  transcript: string
}

interface RecognitionResult {
  isFinal: boolean
  0: RecognitionAlternative
}

interface RecognitionEvent {
  resultIndex: number
  results: ArrayLike<RecognitionResult>
}

interface Recognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecognitionConstructor = new () => Recognition

function recognitionConstructor(): RecognitionConstructor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function isWebSpeechSupported(): boolean {
  return recognitionConstructor() !== undefined
}

const ERROR_CODES: Record<string, VoiceErrorCode> = {
  'not-allowed': 'not-allowed',
  'service-not-allowed': 'not-allowed',
  'no-speech': 'no-speech',
  network: 'network',
  aborted: 'aborted',
  'audio-capture': 'not-allowed',
}

export function startWebSpeech(
  lang: string,
  onInterim: (text: string) => void,
): VoiceSession {
  const Ctor = recognitionConstructor()
  if (!Ctor) {
    return {
      result: Promise.reject(new VoiceError('unsupported')),
      stop: () => {},
      abort: () => {},
    }
  }
  if (!navigator.onLine) {
    return {
      result: Promise.reject(new VoiceError('network')),
      stop: () => {},
      abort: () => {},
    }
  }

  const recognition = new Ctor()
  recognition.lang = lang
  recognition.interimResults = true
  recognition.continuous = false
  recognition.maxAlternatives = 1

  let finalText = ''
  let failure: VoiceError | null = null

  const result = new Promise<string>((resolve, reject) => {
    recognition.onresult = (event) => {
      let interim = ''
      finalText = ''
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }
      onInterim(`${finalText}${interim}`.trim())
    }
    recognition.onerror = (event) => {
      failure = new VoiceError(ERROR_CODES[event.error] ?? 'unknown')
    }
    recognition.onend = () => {
      const text = finalText.trim()
      if (failure) reject(failure)
      else if (text) resolve(text)
      else reject(new VoiceError('no-speech'))
    }
  })

  recognition.start()

  return {
    result,
    stop: () => recognition.stop(),
    abort: () => {
      failure = new VoiceError('aborted')
      recognition.abort()
    },
  }
}
