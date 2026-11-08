import {
  env,
  pipeline,
  type AutomaticSpeechRecognitionOutput,
  type AutomaticSpeechRecognitionPipeline,
} from '@huggingface/transformers'
import { progressReporter, serveModel } from '../../lib/serveModel'
import { WHISPER_MODEL, type WhisperRequest } from './whisperConfig'

env.allowLocalModels = false

let recognizer: Promise<AutomaticSpeechRecognitionPipeline> | null = null

serveModel(
  () => {
    recognizer ??= pipeline('automatic-speech-recognition', WHISPER_MODEL, {
      dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' },
      progress_callback: progressReporter,
    }) as Promise<AutomaticSpeechRecognitionPipeline>
    return recognizer
  },
  async (model, request: WhisperRequest) => {
    const output = (await model(request.audio, {
      language: request.language,
      task: 'transcribe',
    })) as AutomaticSpeechRecognitionOutput
    return output.text.trim()
  },
  () => {
    recognizer = null
  },
)
