import { useSyncExternalStore } from 'react'
import { supabase } from './supabase'
import type { Client } from './types'
import { nextReminder, todayISO, uid } from './utils'

/** Vecchi dati salvati solo nel browser (prima del login): migrati al primo accesso */
const LEGACY_KEY = 'clienti:v1'

export type SyncStatus = 'saved' | 'saving' | 'error'

let state: Client[] = []
let meta: { loaded: boolean; sync: SyncStatus } = { loaded: false, sync: 'saved' }
let userId: string | null = null

/** Salvataggi in coda per cliente (debounce mentre scrivi) */
const pending = new Map<string, number>()
const failed = new Set<string>()
let inflight = 0

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Completa i campi mancanti dei dati salvati con versioni precedenti */
function normalize(d: Client): Client {
  const c = { ...emptyClient(), ...d }
  // Prima esisteva solo "Mensile", che ripeteva il promemoria ogni mese
  if ((d as Partial<Client>).reminderEvery === undefined && d.recurring) c.reminderEvery = { n: 1, unit: 'month' }
  return c
}

const cacheKey = () => `clienti:cache:${userId}`

function setState(next: Client[]) {
  state = next
  // Cache locale: la lista appare subito all'apertura, poi si aggiorna dal server
  if (userId) localStorage.setItem(cacheKey(), JSON.stringify(state))
  emit()
}

function setMeta(patch: Partial<typeof meta>) {
  meta = { ...meta, ...patch }
  emit()
}

function updateSync() {
  const sync: SyncStatus = failed.size ? 'error' : pending.size || inflight ? 'saving' : 'saved'
  if (sync !== meta.sync) setMeta({ sync })
}

function schedule(id: string, delay = 500) {
  clearTimeout(pending.get(id))
  pending.set(id, window.setTimeout(() => flush(id), delay))
  updateSync()
}

async function flush(id: string) {
  clearTimeout(pending.get(id))
  pending.delete(id)
  if (!userId) return
  const c = state.find((x) => x.id === id)
  inflight++
  updateSync()
  const { error } = c
    ? await supabase.from('clients').upsert({ id, data: c, updated_at: new Date(c.updatedAt).toISOString() })
    : await supabase.from('clients').delete().eq('id', id)
  inflight--
  if (error) {
    console.error('Salvataggio fallito', error)
    failed.add(id)
    schedule(id, 5000) // riprova
  } else failed.delete(id)
  updateSync()
}

function flushAll() {
  for (const id of [...pending.keys()]) flush(id)
}

async function refresh() {
  if (!userId || pending.size || inflight) return // non sovrascrivere modifiche non ancora salvate
  const { data, error } = await supabase.from('clients').select('data')
  if (error) {
    console.error('Caricamento fallito', error)
    setMeta({ loaded: true })
    return
  }
  if (pending.size || inflight) return
  setState(data.map((r) => normalize(r.data as Client)))
  setMeta({ loaded: true })
}

async function migrateLegacy() {
  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) return
  try {
    const list = JSON.parse(raw) as Client[]
    if (list.length) {
      const { error } = await supabase
        .from('clients')
        .upsert(list.map((c) => ({ id: c.id, data: c, updated_at: new Date(c.updatedAt).toISOString() })))
      if (error) throw error
    }
    localStorage.removeItem(LEGACY_KEY)
  } catch (e) {
    console.error('Migrazione fallita, riprovo al prossimo accesso', e)
  }
}

window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushAll()
  else refresh() // ricarica quando torni sulla scheda (es. modifiche fatte dal telefono)
})
window.addEventListener('beforeunload', (e) => {
  if (pending.size || inflight) {
    flushAll()
    e.preventDefault()
  }
})

export async function startSession(id: string) {
  if (userId === id) return
  userId = id
  try {
    state = (JSON.parse(localStorage.getItem(cacheKey()) || '[]') as Client[]).map(normalize)
  } catch {
    state = []
  }
  setMeta({ loaded: state.length > 0 })
  await migrateLegacy()
  await refresh()
}

export function endSession() {
  pending.forEach((t) => clearTimeout(t))
  pending.clear()
  failed.clear()
  if (userId) localStorage.removeItem(cacheKey())
  userId = null
  state = []
  meta = { loaded: false, sync: 'saved' }
  emit()
}

export function useClients() {
  return useSyncExternalStore(subscribe, () => state)
}

export function useStoreMeta() {
  return useSyncExternalStore(subscribe, () => meta)
}

export function emptyClient(): Client {
  const now = Date.now()
  return {
    id: uid(),
    name: '',
    company: '',
    status: 'lead',
    contacts: [],
    reminderAt: '',
    reminderEvery: null,
    nextStep: '',
    value: null,
    recurring: false,
    tags: [],
    notes: '',
    pinned: false,
    createdAt: now,
    updatedAt: now,
  }
}

export const clients = {
  add(c: Client) {
    setState([c, ...state])
    flush(c.id)
  },
  update(id: string, patch: Partial<Client>) {
    setState(state.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)))
    schedule(id)
  },
  /** Promemoria fatto: se si ripete passa alla data successiva, altrimenti si cancella */
  completeReminder(id: string) {
    const c = state.find((x) => x.id === id)
    if (!c?.reminderAt) return
    clients.update(id, { reminderAt: nextReminder(c.reminderAt, c.reminderEvery) })
  },
  remove(id: string) {
    setState(state.filter((c) => c.id !== id))
    flush(id)
  },
  /** Unisce per id: i clienti importati sovrascrivono quelli esistenti */
  merge(list: Client[]) {
    const byId = new Map(state.map((c) => [c.id, c]))
    for (const c of list) byId.set(c.id, normalize(c))
    setState([...byId.values()])
    for (const c of list) schedule(c.id, 0)
  },
  all: () => state,
  seed() {
    const mk = (p: Partial<Client>): Client => ({ ...emptyClient(), ...p })
    clients.merge([
      mk({
        name: 'Giulia Rossi',
        company: 'Studio Rossi · fotografa',
        status: 'attesa',
        contacts: [
          { id: uid(), type: 'instagram', value: '@giulia.rossi.photo' },
          { id: uid(), type: 'email', value: 'giulia@studiorossi.it' },
        ],
        reminderAt: todayISO(),
        nextStep: 'Risentirla per il preventivo del sito',
        value: 1200,
        tags: ['sito', 'brand'],
        pinned: true,
      }),
      mk({
        name: 'Marco Bianchi',
        company: 'Pizzeria Da Marco',
        status: 'chiuso',
        contacts: [
          { id: uid(), type: 'phone', value: '333 123 4567' },
          { id: uid(), type: 'whatsapp', value: '333 123 4567' },
        ],
        value: 650,
        tags: ['menu', 'social'],
        notes: 'Pagato in due rate. Vuole il menu stampato a marzo.',
      }),
      mk({
        name: 'Luca Ferri',
        company: 'Conosciuto a un evento',
        status: 'lead',
        contacts: [{ id: uid(), type: 'linkedin', value: 'linkedin.com/in/lucaferri' }],
        reminderAt: todayISO(-2),
        nextStep: 'Mandare portfolio',
      }),
      mk({
        name: 'Sara Conti',
        company: 'E-commerce gioielli',
        status: 'attesa',
        contacts: [
          { id: uid(), type: 'email', value: 'sara@contigioielli.com' },
          { id: uid(), type: 'website', value: 'contigioielli.com' },
        ],
        reminderAt: todayISO(5),
        nextStep: 'Attendere feedback sulla bozza',
        value: 2400,
        tags: ['shopify'],
      }),
    ])
  },
}
