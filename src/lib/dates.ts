const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayISO(now = new Date()): string {
  return toISODate(now)
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7)
}

export function monthRange(month: string): [string, string] {
  const [y, m] = month.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return [`${month}-01`, `${month}-${pad(last)}`]
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1)

export function formatMonth(month: string, locale: string): string {
  const [y, m] = month.split('-').map(Number)
  return capitalize(
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
      new Date(y, m - 1, 1),
    ),
  )
}

export function formatLongDate(iso: string, locale: string): string {
  return capitalize(
    new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parseISODate(iso)),
  )
}

export function formatDayHeading(
  iso: string,
  today: string,
  locale: string,
  labels: { today: string; yesterday: string },
): string {
  const date = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parseISODate(iso))
  if (iso === today) return `${labels.today} · ${date}`
  if (iso === addDays(today, -1)) return `${labels.yesterday} · ${date}`
  return capitalize(date)
}
