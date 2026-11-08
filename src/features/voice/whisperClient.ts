import { createModelWorker } from '../../lib/modelWorker'
import type { WhisperRequest } from './whisperConfig'

const whisper = createModelWorker<WhisperRequest, string>(
  () =>
    new Worker(new URL('./whisper.worker.ts', import.meta.url), {
      type: 'module',
    }),
)

export const transcribe = whisper.run
export const warmUpWhisper = whisper.warmUp
export const getWhisperStatus = whisper.getStatus
export const subscribeWhisperStatus = whisper.subscribe
