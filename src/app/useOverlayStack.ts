import { useCallback, useEffect, useState } from 'react'

/**
 * Pila de pantallas que se abren encima de las pestañas (detalle, formulario).
 * Cada pantalla agrega una entrada al historial, así el botón "atrás" de Android la cierra.
 */
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

  // Vuelve por el historial para que el estado y el botón "atrás" queden sincronizados
  const pop = useCallback(() => window.history.back(), [])

  return { stack, push, pop }
}
