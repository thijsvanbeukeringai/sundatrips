// Lightweight date helpers — no external dependency, Hermes-safe.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Local YYYY-MM-DD for a Date (avoids UTC off-by-one from toISOString). */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Returns `count` ISO date strings starting from `start` (default: today). */
export function nextDays(count: number, start = new Date()): string[] {
  const base = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    return toISODate(d)
  })
}

/** Parse a YYYY-MM-DD string into a local Date. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** "Mon 23 Jun" */
export function formatShort(iso: string): string {
  const d = fromISODate(iso)
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** Whole nights between two ISO dates (>= 0). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = fromISODate(checkIn).getTime()
  const b = fromISODate(checkOut).getTime()
  return Math.max(0, Math.round((b - a) / 86_400_000))
}
