export type ModelStatus =
  | { state: 'idle' }
  | { state: 'loading'; progress: number }
  | { state: 'ready' }
  | { state: 'unavailable' }
  | { state: 'error'; message: string }

export type ModelWorkerMessage<Result> =
  | { type: 'progress'; progress: number }
  | { type: 'ready' }
  | { type: 'result'; id: number; value: Result }
  | { type: 'error'; id: number; message: string }

export interface ModelWorker<Payload, Result> {
  run: (payload: Payload) => Promise<Result>
  warmUp: () => void
  getStatus: () => ModelStatus
  subscribe: (listener: () => void) => () => void
}

export function createModelWorker<Payload, Result>(
  create: () => Worker,
): ModelWorker<Payload, Result> {
  let worker: Worker | null = null
  let nextId = 0
  let status: ModelStatus = { state: 'idle' }
  const listeners = new Set<() => void>()
  const pending = new Map<
    number,
    { resolve: (value: Result) => void; reject: (error: Error) => void }
  >()

  const setStatus = (next: ModelStatus) => {
    status = next
    listeners.forEach((listener) => listener())
  }

  const getWorker = (): Worker | null => {
    if (worker) return worker
    if (typeof Worker === 'undefined') {
      setStatus({ state: 'unavailable' })
      return null
    }
    worker = create()
    setStatus({ state: 'loading', progress: 0 })
    worker.onmessage = (event: MessageEvent<ModelWorkerMessage<Result>>) => {
      const message = event.data
      if (message.type === 'progress') {
        if (status.state !== 'ready')
          setStatus({ state: 'loading', progress: message.progress })
      } else if (message.type === 'ready') {
        if (status.state !== 'ready') setStatus({ state: 'ready' })
      } else if (message.type === 'result') {
        pending.get(message.id)?.resolve(message.value)
        pending.delete(message.id)
      } else {
        setStatus({ state: 'error', message: message.message })
        pending.get(message.id)?.reject(new Error(message.message))
        pending.delete(message.id)
      }
    }
    return worker
  }

  const post = (payload: Payload | null): Promise<Result> => {
    const w = getWorker()
    if (!w) return Promise.reject(new Error('Web Workers no disponibles'))
    const id = nextId++
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
      w.postMessage({ id, payload })
    })
  }

  return {
    run: (payload) => post(payload),
    warmUp: () => {
      post(null).catch(() => {})
    },
    getStatus: () => status,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
