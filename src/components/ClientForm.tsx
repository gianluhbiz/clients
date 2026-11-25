import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { clients, emptyClient, useClients } from '../lib/store'
import type { Client } from '../lib/types'
import { reminderInfo, timeAgo, todayISO } from '../lib/utils'
import { Contacts } from './Contacts'
import { StatusSegmented } from './Status'

const QUICK = [
  { label: 'Domani', days: 1 },
  { label: '3 gg', days: 3 },
  { label: '1 sett', days: 7 },
  { label: '1 mese', days: 30 },
]

function Field({ label, children, aside }: { label: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{label}</span>
        {aside}
      </div>
      {children}
    </div>
  )
}

export function ClientForm({ id }: { id: string }) {
  const nav = useNavigate()
  const isNew = id === 'new'
  const stored = useClients().find((c) => c.id === id)
  const [draft, setDraft] = useState<Client>(emptyClient)
  const [tagsText, setTagsText] = useState(() => stored?.tags.join(', ') ?? '')
  const nameRef = useRef<HTMLInputElement>(null)
  const client = isNew ? draft : stored

  useEffect(() => {
    if (!isNew && !stored) nav('/', { replace: true })
  }, [isNew, stored, nav])

  if (!client) return null

  const change = (patch: Partial<Client>) =>
    isNew ? setDraft((d) => ({ ...d, ...patch })) : clients.update(id, patch)
  const close = () => nav('/')

  const create = () => {
    if (!draft.name.trim()) {
      nameRef.current?.focus()
      return
    }
    const now = Date.now()
    clients.add({ ...draft, name: draft.name.trim(), createdAt: now, updatedAt: now })
    nav(`/c/${draft.id}`, { replace: true })
  }

  const remove = () => {
    if (confirm(`Eliminare "${client.name || 'Senza nome'}"? Non si può annullare.`)) {
      clients.remove(id)
      nav('/')
    }
  }

  const r = reminderInfo(client.reminderAt)

  return (
    <div
      className="flex h-full flex-col"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault()
          if (isNew) create()
          else close()
        }
      }}
    >
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-zinc-100 px-3">
        <span className="ml-2 text-sm text-zinc-400">
          {isNew ? 'Nuovo cliente' : `Salvato · modificato ${timeAgo(client.updatedAt)}`}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            title={client.pinned ? 'Togli dai fissati' : 'Fissa in alto'}
            onClick={() => change({ pinned: !client.pinned })}
            className={`icon-btn ${client.pinned ? 'text-zinc-900' : ''}`}
          >
            <i className={client.pinned ? 'ri-pushpin-fill' : 'ri-pushpin-line'} />
          </button>
          {!isNew && (
            <button type="button" title="Elimina" onClick={remove} className="icon-btn hover:bg-red-50 hover:text-red-600">
              <i className="ri-delete-bin-6-line" />
            </button>
          )}
          <button type="button" title="Chiudi (Esc)" onClick={close} className="icon-btn">
            <i className="ri-close-line text-lg" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <div>
          <input
            ref={nameRef}
            autoFocus={isNew}
            value={client.name}
            onChange={(e) => change({ name: e.target.value })}
            placeholder="Nome cliente"
            className="w-full bg-transparent text-xl font-semibold outline-none placeholder:text-zinc-300"
          />
          <input
            value={client.company}
            onChange={(e) => change({ company: e.target.value })}
            placeholder="Azienda, ruolo o dove l'hai conosciuto"
            className="mt-1 w-full bg-transparent text-sm text-zinc-500 outline-none placeholder:text-zinc-300"
          />
        </div>

        <Field label="Stato">
          <StatusSegmented value={client.status} onChange={(status) => change({ status })} />
        </Field>

        <Field label="Contatti">
          <Contacts value={client.contacts} onChange={(contacts) => change({ contacts })} />
        </Field>

        <Field
          label="Promemoria"
          aside={
            r && (
              <span className={`text-xs ${r.tone === 'overdue' ? 'text-red-600' : r.tone === 'today' ? 'text-amber-600' : 'text-zinc-400'}`}>
                {r.label}
              </span>
            )
          }
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="date"
              value={client.reminderAt}
              onChange={(e) => change({ reminderAt: e.target.value })}
              className="input w-auto"
            />
            {QUICK.map((q) => (
              <button
                key={q.days}
                type="button"
                onClick={() => change({ reminderAt: todayISO(q.days) })}
                className="h-9 rounded-md border border-zinc-200 px-2.5 text-xs text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                {q.label}
              </button>
            ))}
            {client.reminderAt && (
              <button type="button" title="Rimuovi promemoria" onClick={() => change({ reminderAt: '' })} className="icon-btn">
                <i className="ri-close-line" />
              </button>
            )}
          </div>
          <input
            value={client.nextStep}
            onChange={(e) => change({ nextStep: e.target.value })}
            placeholder="Cosa devi fare? es. mandare il preventivo"
            className="input mt-2"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valore €">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={client.value ?? ''}
              onChange={(e) => change({ value: e.target.value === '' ? null : Number(e.target.value) })}
              placeholder="0"
              className="input tabular-nums"
            />
          </Field>
          <Field label="Tag">
            <input
              value={tagsText}
              onChange={(e) => {
                setTagsText(e.target.value)
                change({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })
              }}
              placeholder="sito, social…"
              className="input"
            />
          </Field>
        </div>

        <Field label="Note">
          <textarea
            value={client.notes}
            onChange={(e) => change({ notes: e.target.value })}
            rows={5}
            placeholder="Accordi, preferenze, cose da ricordare…"
            className="input h-auto resize-y py-2 leading-relaxed"
          />
        </Field>
      </div>

      {isNew && (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-100 p-3">
          <button type="button" onClick={close} className="btn">
            Annulla
          </button>
          <button type="button" onClick={create} className="btn-primary">
            Crea cliente <kbd className="kbd-dark">Ctrl ↵</kbd>
          </button>
        </div>
      )}
    </div>
  )
}
