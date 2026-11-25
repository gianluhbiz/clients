import { useState } from 'react'
import { CONTACT, CONTACT_ORDER, contactHref, detectContactType } from '../lib/meta'
import type { Contact, ContactType } from '../lib/types'
import { uid } from '../lib/utils'

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      title="Copia"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setDone(true)
        setTimeout(() => setDone(false), 1000)
      }}
      className={`icon-btn ${done ? 'text-emerald-600' : ''}`}
    >
      <i className={done ? 'ri-check-line' : 'ri-file-copy-line'} />
    </button>
  )
}

export function Contacts({ value, onChange }: { value: Contact[]; onChange: (v: Contact[]) => void }) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (!v) return
    onChange([...value, { id: uid(), type: detectContactType(v), value: v }])
    setInput('')
  }
  const patch = (id: string, p: Partial<Contact>) => onChange(value.map((c) => (c.id === id ? { ...c, ...p } : c)))

  return (
    <div className="space-y-1.5">
      {value.map((c) => {
        const href = contactHref(c)
        return (
          <div key={c.id} className="flex items-center gap-1">
            <label
              title={`${CONTACT[c.type].label} · cambia tipo`}
              className="relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-md border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50"
            >
              <i className={CONTACT[c.type].icon} />
              <select
                value={c.type}
                onChange={(e) => patch(c.id, { type: e.target.value as ContactType })}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {CONTACT_ORDER.map((t) => (
                  <option key={t} value={t}>
                    {CONTACT[t].label}
                  </option>
                ))}
              </select>
            </label>
            <input
              value={c.value}
              placeholder={CONTACT[c.type].placeholder}
              onChange={(e) => patch(c.id, { value: e.target.value })}
              className="input ml-1 flex-1"
            />
            <a
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              title="Apri"
              className="icon-btn"
            >
              <i className="ri-arrow-right-up-line" />
            </a>
            <CopyButton text={c.value} />
            <button
              type="button"
              title="Rimuovi"
              onClick={() => onChange(value.filter((x) => x.id !== c.id))}
              className="icon-btn hover:bg-red-50 hover:text-red-600"
            >
              <i className="ri-close-line" />
            </button>
          </div>
        )
      })}

      <div className="flex items-center gap-1">
        <div className="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-zinc-200 text-zinc-400">
          <i className={input.trim() ? CONTACT[detectContactType(input)].icon : 'ri-add-line'} />
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          onBlur={add}
          placeholder="Incolla email, @instagram, telefono o link…"
          className="input ml-1 flex-1"
        />
      </div>
    </div>
  )
}
