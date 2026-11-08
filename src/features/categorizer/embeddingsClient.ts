import { createModelWorker } from '../../lib/modelWorker'

const embeddings = createModelWorker<string[], number[][]>(
  () =>
    new Worker(new URL('./embeddings.worker.ts', import.meta.url), {
      type: 'module',
    }),
)

export const embed = embeddings.run
export const warmUpModel = embeddings.warmUp
export const getModelStatus = embeddings.getStatus
export const subscribeModelStatus = embeddings.subscribe
