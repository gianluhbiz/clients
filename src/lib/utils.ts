import type { Repeat, RepeatUnit } from './types'

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

/** Aggiunge mesi a una data YYYY-MM-DD; 31 gen + 1 mese = 28/29 feb */
export function addMonths(s: string, n: number) {
  const d = parseISO(s)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, last))
  return toISO(d)
}

const UNIT_LABEL: Record<RepeatUnit, [string, string]> = {
  day: ['giorno', 'giorni'],
  week: ['settimana', 'settimane'],
  month: ['mese', 'mesi'],
  year: ['anno', 'anni'],
}

export const unitLabel = (unit: RepeatUnit, n: number) => UNIT_LABEL[unit][n === 1 ? 0 : 1]

export function repeatLabel(r: Repeat) {
  if (!r) return ''
  return r.n === 1 ? `ogni ${unitLabel(r.unit, 1)}` : `ogni ${r.n} ${unitLabel(r.unit, r.n)}`
}

/** Prossima data del promemoria dopo averlo segnato fatto ('' se non si ripete) */
export function nextReminder(at: string, every: Repeat) {
  if (!at || !every) return ''
  const n = Math.max(1, every.n)
  if (every.unit === 'month') return addMonths(at, n)
  if (every.unit === 'year') return addMonths(at, n * 12)
  const d = parseISO(at)
  d.setDate(d.getDate() + n * (every.unit === 'week' ? 7 : 1))
  return toISO(d)
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
