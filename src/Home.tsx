import { AnimatePresence, m } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useMatch, useNavigate } from 'react-router'
import { ClientForm } from './components/ClientForm'
import { ClientRow } from './components/ClientRow'
import { Menu } from './components/Menu'
import { Dot } from './components/Status'
import { STATUS, STATUS_ORDER } from './lib/meta'
import { clients, useClients, useStoreMeta } from './lib/store'
import type { Client, Status } from './lib/types'
import { euro, todayISO } from './lib/utils'

type Filter = 'all' | Status | 'due'
type Sort = 'recent' | 'reminder' | 'name' | 'value'

const SORTS: Record<Sort, { label: string; cmp: (a: Client, b: Client) => number }> = {
  recent: { label: 'Ultimi aggiunti', cmp: (a, b) => b.createdAt - a.createdAt },
  reminder: {
    label: 'Promemoria',
    cmp: (a, b) => (a.reminderAt || '9999').localeCompare(b.reminderAt || '9999'),
  },
  name: { label: 'Nome', cmp: (a, b) => a.name.localeCompare(b.name, 'it') },
  value: { label: 'Valore', cmp: (a, b) => (b.value ?? -1) - (a.value ?? -1) },
}

export default function Home() {
  const all = useClients()
  const meta = useStoreMeta()
  const nav = useNavigate()
  const openId = useMatch('/c/:id')?.params.id
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>(() => (localStorage.getItem('clienti:sort') as Sort) || 'recent')
  const [active, setActive] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const today = todayISO()

  const counts = useMemo(() => {
    const c = { all: all.length, lead: 0, attesa: 0, chiuso: 0, perso: 0, due: 0, won: 0, monthly: 0 }
    for (const x of all) {
      c[x.status]++
      if (x.reminderAt && x.reminderAt <= today) c.due++
      if (x.recurring) {
        if (x.status !== 'perso') c.monthly += x.value ?? 0
      } else if (x.status === 'chiuso') c.won += x.value ?? 0
    }
    return c
  }, [all, today])

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const cmp = SORTS[sort].cmp
    return all
      .filter((c) => {
        if (filter === 'due') {
          if (!c.reminderAt || c.reminderAt > today) return false
        } else if (filter !== 'all' && c.status !== filter) return false
        if (!needle) return true
        return [c.name, c.company, c.notes, c.nextStep, ...c.tags, ...c.contacts.map((x) => x.value)].some((s) =>
          s.toLowerCase().includes(needle),
        )
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || cmp(a, b))
  }, [all, q, filter, sort, today])

  const activeIdx = Math.min(active, list.length - 1)
  const open = useCallback((id: string) => nav(`/c/${id}`), [nav])

  // Scorciatoie da tastiera
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t.matches('input, textarea, select, [contenteditable]')
      const inSearch = t === searchRef.current
      if (openId) {
        if (e.key === 'Escape') nav('/')
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (typing && !inSearch) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(i + 1, list.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        const c = list[Math.max(activeIdx, 0)]
        if (c && (inSearch || activeIdx >= 0)) open(c.id)
      } else if (typing) {
        return
      } else if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        nav('/c/new')
      } else if (/^[1-4]$/.test(e.key) && list[activeIdx]) {
        clients.update(list[activeIdx].id, { status: STATUS_ORDER[Number(e.key) - 1] })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openId, list, activeIdx, nav, open])

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${activeIdx}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  useEffect(() => {
    document.body.style.overflow = openId ? 'hidden' : ''
  }, [openId])

  const pickFilter = (f: Filter) => {
    setFilter((cur) => (cur === f && f !== 'all' ? 'all' : f))
    setActive(-1)
  }

  const chip = (f: Filter, label: ReactNode, count: number, extra = '') => (
    <button
      key={f}
      type="button"
      onClick={() => pickFilter(f)}
      className={`flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 text-sm transition ${
        filter === f
          ? 'border-zinc-900 bg-zinc-900 text-white'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
      }`}
    >
      {label}
      <span className={`text-xs tabular-nums ${filter === f ? 'text-zinc-400' : extra || 'text-zinc-400'}`}>{count}</span>
    </button>
  )

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-zinc-50/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 sm:gap-3">
          <div className="flex shrink-0 items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-zinc-900 text-white">
              <i className="ri-contacts-book-3-line" />
            </span>
            <span className="hidden sm:inline">Clienti</span>
          </div>
          <div className="relative flex-1">
            <i className="ri-search-line pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setActive(-1)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setQ('')
                  e.currentTarget.blur()
                }
              }}
              placeholder="Cerca nome, tag, contatto…"
              className="input pr-9 pl-9"
            />
            <kbd className="kbd absolute top-1/2 right-2 hidden -translate-y-1/2 sm:block">/</kbd>
          </div>
          <span
            title={
              meta.sync === 'error'
                ? 'Non salvato: riprovo tra poco. Controlla la connessione.'
                : meta.sync === 'saving'
                  ? 'Salvataggio…'
                  : 'Tutto salvato'
            }
            className={`grid size-9 shrink-0 place-items-center ${meta.sync === 'error' ? 'text-red-600' : 'text-zinc-300'}`}
          >
            <i
              className={
                meta.sync === 'error'
                  ? 'ri-cloud-off-line'
                  : meta.sync === 'saving'
                    ? 'ri-loader-4-line animate-spin'
                    : 'ri-cloud-line'
              }
            />
          </span>
          <Menu />
          <button type="button" onClick={() => nav('/c/new')} className="btn-primary" title="Nuovo cliente (N)">
            <i className="ri-add-line text-base" />
            <span className="hidden sm:inline">Nuovo</span>
            <kbd className="kbd-dark hidden sm:block">N</kbd>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-4 pb-16">
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
          {chip('all', 'Tutti', counts.all)}
          {chip(
            'due',
            <>
              <i className="ri-alarm-line" /> Da ricontattare
            </>,
            counts.due,
            counts.due ? 'text-red-600 font-medium' : '',
          )}
          {STATUS_ORDER.map((s) =>
            chip(
              s,
              <>
                <Dot status={s} /> {STATUS[s].label}
              </>,
              counts[s],
            ),
          )}
        </div>

        <div className="mb-2 flex items-center justify-between text-sm text-zinc-500">
          <span>
            {list.length} {list.length === 1 ? 'cliente' : 'clienti'}
            {counts.won > 0 && <span className="text-zinc-400"> · {euro.format(counts.won)} chiusi</span>}
            {counts.monthly > 0 && <span className="text-zinc-400"> · {euro.format(counts.monthly)}/mese</span>}
          </span>
          <label className="flex items-center gap-1 text-zinc-500">
            <i className="ri-arrow-up-down-line text-zinc-400" />
            <select
              value={sort}
              onChange={(e) => {
                const s = e.target.value as Sort
                setSort(s)
                localStorage.setItem('clienti:sort', s)
              }}
              className="cursor-pointer bg-transparent py-1 outline-none hover:text-zinc-900"
            >
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {list.length > 0 ? (
          <div ref={listRef} className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white shadow-sm shadow-zinc-900/[0.03]">
            {list.map((c, i) => (
              <ClientRow key={c.id} client={c} index={i} active={i === activeIdx} onOpen={open} />
            ))}
          </div>
        ) : !meta.loaded ? (
          <div className="py-16 text-center text-zinc-400">
            <i className="ri-loader-4-line animate-spin text-2xl" />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-16 text-center">
            <i className="ri-user-search-line text-3xl text-zinc-300" />
            <p className="mt-2 text-zinc-500">
              {all.length === 0 ? 'Nessun cliente ancora.' : 'Nessun risultato con questi filtri.'}
            </p>
            {all.length === 0 && (
              <div className="mt-4 flex justify-center gap-2">
                <button type="button" onClick={() => nav('/c/new')} className="btn-primary">
                  <i className="ri-add-line" /> Primo cliente
                </button>
                <button type="button" onClick={() => clients.seed()} className="btn">
                  Carica esempi
                </button>
              </div>
            )}
          </div>
        )}

        <p className="mt-4 hidden text-center text-xs text-zinc-400 sm:block">
          <kbd className="kbd">/</kbd> cerca · <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> naviga ·{' '}
          <kbd className="kbd">↵</kbd> apri · <kbd className="kbd">1</kbd>–<kbd className="kbd">4</kbd> stato ·{' '}
          <kbd className="kbd">N</kbd> nuovo · <kbd className="kbd">Esc</kbd> chiudi
        </p>
      </main>

      <AnimatePresence>
        {openId && (
          <m.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => nav('/')}
            className="fixed inset-0 z-30 bg-zinc-900/20"
          />
        )}
        {openId && (
          <m.aside
            key="drawer"
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 32, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl shadow-zinc-900/10"
          >
            <ClientForm key={openId} id={openId} />
          </m.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
