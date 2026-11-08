export const WHISPER_MODEL = 'onnx-community/whisper-base'
export const WHISPER_SAMPLE_RATE = 16000

export interface WhisperRequest {
  audio: Float32Array
  language: 'spanish' | 'english'
}
