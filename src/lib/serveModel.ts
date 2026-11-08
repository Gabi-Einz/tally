import type { ProgressInfo } from '@huggingface/transformers'

export function progressReporter(info: ProgressInfo): void {
  if (info.status === 'progress_total')
    self.postMessage({ type: 'progress', progress: info.progress })
}

export function serveModel<Model, Payload, Result>(
  load: () => Promise<Model>,
  run: (model: Model, payload: Payload) => Promise<Result>,
  onLoadError: () => void,
): void {
  self.onmessage = async (
    event: MessageEvent<{ id: number; payload: Payload | null }>,
  ) => {
    const { id, payload } = event.data
    try {
      const model = await load()
      self.postMessage({ type: 'ready' })
      const value = payload === null ? null : await run(model, payload)
      self.postMessage({ type: 'result', id, value })
    } catch (error) {
      onLoadError()
      self.postMessage({ type: 'error', id, message: String(error) })
    }
  }
}
