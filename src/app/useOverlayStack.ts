import { useCallback, useEffect, useState } from 'react'

export function useOverlayStack<T>() {
  const [stack, setStack] = useState<T[]>([])

  useEffect(() => {
    const onPop = () => setStack((s) => s.slice(0, -1))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const push = useCallback((item: T) => {
    window.history.pushState({ overlay: true }, '')
    setStack((s) => [...s, item])
  }, [])

  const replace = useCallback((item: T) => {
    setStack((s) => [...s.slice(0, -1), item])
  }, [])

  const pop = useCallback(() => window.history.back(), [])

  return { stack, push, replace, pop }
}
