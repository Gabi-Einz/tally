import { todayISO } from '../../lib/dates'
import { convertExpense, convertPending } from './convert'
import { prefetchRecentRates } from './rates'

const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000]

let retryTimer: ReturnType<typeof setTimeout> | null = null
let attempt = 0
let running = false

async function run(): Promise<void> {
  if (running || !navigator.onLine) return
  running = true
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = null
  try {
    const complete = await convertPending()
    if (complete) attempt = 0
    else scheduleRetry()
  } catch {
    scheduleRetry()
  } finally {
    running = false
  }
}

function scheduleRetry() {
  const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]
  attempt++
  retryTimer = setTimeout(() => void run(), delay)
}

export function startPendingConversions(): void {
  window.addEventListener('online', () => {
    attempt = 0
    void run()
  })
  if (navigator.onLine) {
    prefetchRecentRates(todayISO())
      .catch(() => {})
      .finally(() => void run())
  }
}

export function convertSoon(id: string): void {
  if (!navigator.onLine) return
  convertExpense(id)
    .then((complete) => {
      if (!complete) scheduleRetry()
    })
    .catch(() => scheduleRetry())
}
