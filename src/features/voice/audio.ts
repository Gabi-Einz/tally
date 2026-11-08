import { normalizeWord } from '../parser/tokens'
import { WHISPER_SAMPLE_RATE } from './whisperConfig'

const SILENCE_RMS = 0.01
const WINDOW_SECONDS = 0.05

const HALLUCINATIONS = [
  'subtitulos realizados por la comunidad de amara.org',
  'subtitulado por la comunidad de amara.org',
  'gracias por ver el video',
  'gracias por ver',
  'suscribete al canal',
  'thanks for watching',
  'thank you for watching',
  'musica',
]

export function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined' &&
    typeof Worker !== 'undefined'
  )
}

export interface Recording {
  finished: Promise<Blob>
  stop: () => void
}

export async function startRecording(maxMs: number): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const recorder = new MediaRecorder(stream)
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => chunks.push(event.data)

  const finished = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      resolve(new Blob(chunks, { type: recorder.mimeType }))
    }
  })
  const stop = () => {
    clearTimeout(timer)
    if (recorder.state === 'recording') recorder.stop()
  }
  const timer = setTimeout(stop, maxMs)
  recorder.start()

  return { finished, stop }
}

export async function decodeTo16k(blob: Blob): Promise<Float32Array> {
  const context = new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE })
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer())
    return buffer.getChannelData(0)
  } finally {
    void context.close()
  }
}

export function isSilence(samples: Float32Array): boolean {
  const size = Math.max(1, Math.round(WHISPER_SAMPLE_RATE * WINDOW_SECONDS))
  for (let start = 0; start < samples.length; start += size) {
    let sum = 0
    const end = Math.min(samples.length, start + size)
    for (let i = start; i < end; i++) sum += samples[i] * samples[i]
    if (Math.sqrt(sum / (end - start)) >= SILENCE_RMS) return false
  }
  return true
}

function simplify(text: string): string {
  return normalizeWord(text)
    .replace(/[^a-z0-9ñ ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const KNOWN_HALLUCINATIONS = new Set(HALLUCINATIONS.map(simplify))

export function isHallucination(text: string): boolean {
  const clean = simplify(text)
  return clean.length < 2 || KNOWN_HALLUCINATIONS.has(clean)
}
