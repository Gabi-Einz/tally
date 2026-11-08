export type ModelStatus =
  | { state: 'idle' }
  | { state: 'loading'; progress: number }
  | { state: 'ready' }
  | { state: 'unavailable' }
  | { state: 'error'; message: string }

type WorkerMessage =
  | { type: 'progress'; progress: number }
  | { type: 'ready' }
  | { type: 'result'; id: number; vectors: number[][] }
  | { type: 'error'; id: number; message: string }

let worker: Worker | null = null
let nextId = 0
let status: ModelStatus = { state: 'idle' }
const listeners = new Set<() => void>()
const pending = new Map<
  number,
  { resolve: (v: number[][]) => void; reject: (e: Error) => void }
>()

function setStatus(next: ModelStatus) {
  status = next
  listeners.forEach((l) => l())
}

export function getModelStatus(): ModelStatus {
  return status
}

export function subscribeModelStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getWorker(): Worker | null {
  if (worker) return worker
  if (typeof Worker === 'undefined') {
    setStatus({ state: 'unavailable' })
    return null
  }
  worker = new Worker(new URL('./embeddings.worker.ts', import.meta.url), {
    type: 'module',
  })
  setStatus({ state: 'loading', progress: 0 })
  worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data
    if (message.type === 'progress')
      setStatus({ state: 'loading', progress: message.progress })
    else if (message.type === 'ready') {
      if (status.state !== 'ready') setStatus({ state: 'ready' })
    } else if (message.type === 'result') {
      pending.get(message.id)?.resolve(message.vectors)
      pending.delete(message.id)
    } else {
      setStatus({ state: 'error', message: message.message })
      pending.get(message.id)?.reject(new Error(message.message))
      pending.delete(message.id)
    }
  }
  return worker
}

export function embed(texts: string[]): Promise<number[][]> {
  const w = getWorker()
  if (!w) return Promise.reject(new Error('Web Workers no disponibles'))
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    w.postMessage({ id, texts })
  })
}

export function warmUpModel(): void {
  embed([]).catch(() => {})
}
