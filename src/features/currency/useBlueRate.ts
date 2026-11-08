import { useEffect, useState } from 'react'
import { todayISO } from '../../lib/dates'
import { getRate } from './rates'

export type BlueRate =
  { state: 'ready'; rate: number } | { state: 'unavailable' } | null

export function useBlueRate(date: string, enabled: boolean): BlueRate {
  const [result, setResult] = useState<{ date: string; value: BlueRate }>({
    date: '',
    value: null,
  })

  useEffect(() => {
    if (!enabled || !date) return
    let cancelled = false
    getRate('blue', date, todayISO())
      .then((rate) => {
        if (!cancelled)
          setResult({ date, value: { state: 'ready', rate: rate.sell } })
      })
      .catch(() => {
        if (!cancelled) setResult({ date, value: { state: 'unavailable' } })
      })
    return () => {
      cancelled = true
    }
  }, [date, enabled])

  return enabled && result.date === date ? result.value : null
}
