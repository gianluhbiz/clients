export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function todayISO(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return toISO(d)
}

export function parseISO(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const dayFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' })
const weekdayFmt = new Intl.DateTimeFormat('it-IT', { weekday: 'long' })

export type ReminderTone = 'overdue' | 'today' | 'future'

export function reminderInfo(s: string) {
  if (!s) return null
  const diff = Math.round((parseISO(s).getTime() - parseISO(todayISO()).getTime()) / 86_400_000)
  let label: string
  if (diff === 0) label = 'Oggi'
  else if (diff === 1) label = 'Domani'
  else if (diff === -1) label = 'Ieri'
  else if (diff < 0) label = `${-diff} giorni fa`
  else if (diff < 7) {
    const w = weekdayFmt.format(parseISO(s))
    label = w[0].toUpperCase() + w.slice(1)
  } else label = dayFmt.format(parseISO(s))
  const tone: ReminderTone = diff < 0 ? 'overdue' : diff === 0 ? 'today' : 'future'
  return { label, tone, diff }
}

export const euro = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const rtf = new Intl.RelativeTimeFormat('it', { numeric: 'auto' })

export function timeAgo(ts: number) {
  const s = Math.round((ts - Date.now()) / 1000)
  const abs = Math.abs(s)
  if (abs < 60) return 'adesso'
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute')
  if (abs < 86_400) return rtf.format(Math.round(s / 3600), 'hour')
  return rtf.format(Math.round(s / 86_400), 'day')
}
