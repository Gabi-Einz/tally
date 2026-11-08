import { toISODate } from '../../lib/dates'

export function formatBackupTime(ts: number, locale: string, today: string) {
  const date = new Date(ts)
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  if (toISODate(date) === today) return { kind: 'today' as const, time }
  return {
    kind: 'date' as const,
    time: new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date),
  }
}
