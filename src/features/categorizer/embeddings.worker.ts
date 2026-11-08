import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
} from '@huggingface/transformers'
import { progressReporter, serveModel } from '../../lib/serveModel'
import { EMBEDDING_MODEL } from './semantic'

env.allowLocalModels = false

let extractor: Promise<FeatureExtractionPipeline> | null = null

serveModel(
  () => {
    extractor ??= pipeline('feature-extraction', EMBEDDING_MODEL, {
      dtype: 'q8',
      progress_callback: progressReporter,
    }) as Promise<FeatureExtractionPipeline>
    return extractor
  },
  async (model, texts: string[]) => {
    if (texts.length === 0) return []
    const output = await model(texts, { pooling: 'mean', normalize: true })
    return output.tolist() as number[][]
  },
  () => {
    extractor = null
  },
)
