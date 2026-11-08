import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
  type ProgressInfo,
} from '@huggingface/transformers'
import { EMBEDDING_MODEL } from './semantic'

env.allowLocalModels = false

let extractor: Promise<FeatureExtractionPipeline> | null = null

function load(): Promise<FeatureExtractionPipeline> {
  extractor ??= pipeline('feature-extraction', EMBEDDING_MODEL, {
    dtype: 'q8',
    progress_callback: (info: ProgressInfo) => {
      if (info.status === 'progress_total')
        self.postMessage({ type: 'progress', progress: info.progress })
    },
  }) as Promise<FeatureExtractionPipeline>
  return extractor
}

self.onmessage = async (
  event: MessageEvent<{ id: number; texts: string[] }>,
) => {
  const { id, texts } = event.data
  try {
    const model = await load()
    self.postMessage({ type: 'ready' })
    if (texts.length === 0) {
      self.postMessage({ type: 'result', id, vectors: [] })
      return
    }
    const output = await model(texts, { pooling: 'mean', normalize: true })
    self.postMessage({ type: 'result', id, vectors: output.tolist() })
  } catch (error) {
    extractor = null
    self.postMessage({ type: 'error', id, message: String(error) })
  }
}
