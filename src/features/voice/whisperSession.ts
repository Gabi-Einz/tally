import {
  decodeTo16k,
  isHallucination,
  isRecordingSupported,
  isSilence,
  startRecording,
  type Recording,
} from './audio'
import { transcribe } from './whisperClient'
import { VoiceError, type VoiceSession } from './webSpeech'

const MAX_RECORDING_MS = 15000

export type WhisperPhase = 'recording' | 'transcribing'

function toVoiceError(error: unknown): VoiceError {
  if (error instanceof VoiceError) return error
  if (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'NotFoundError')
  )
    return new VoiceError('not-allowed')
  return new VoiceError('unknown')
}

export function startWhisper(
  language: 'spanish' | 'english',
  onPhase: (phase: WhisperPhase) => void,
): VoiceSession {
  if (!isRecordingSupported()) {
    return {
      result: Promise.reject(new VoiceError('unsupported')),
      stop: () => {},
      abort: () => {},
    }
  }

  let recording: Recording | null = null
  let aborted = false
  let stopRequested = false

  const result = (async () => {
    try {
      recording = await startRecording(MAX_RECORDING_MS)
      if (stopRequested) recording.stop()
      onPhase('recording')
      const blob = await recording.finished
      if (aborted) throw new VoiceError('aborted')
      onPhase('transcribing')
      const audio = await decodeTo16k(blob)
      if (isSilence(audio)) throw new VoiceError('no-speech')
      const text = await transcribe({ audio, language })
      if (aborted) throw new VoiceError('aborted')
      if (isHallucination(text)) throw new VoiceError('no-speech')
      return text
    } catch (error) {
      throw toVoiceError(error)
    }
  })()

  return {
    result,
    stop: () => {
      stopRequested = true
      recording?.stop()
    },
    abort: () => {
      aborted = true
      stopRequested = true
      recording?.stop()
    },
  }
}
