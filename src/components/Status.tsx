import { AnimatePresence, m } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { STATUS, STATUS_ORDER } from '../lib/meta'
import type { Status } from '../lib/types'
import { useClickOutside } from '../lib/useClickOutside'

export function Dot({ status }: { status: Status }) {
  const s = STATUS[status]
  return <span className={`inline-block size-2.5 shrink-0 rounded-full ring-4 ${s.dot} ${s.ring}`} />
}

/** Pallino cliccabile che apre il menu stati */
export function StatusButton({ status, onChange }: { status: Status; onChange: (s: Status) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, open, close)

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        title={`${STATUS[status].label} · cambia stato`}
        onClick={() => setOpen((o) => !o)}
        className="grid size-8 place-items-center rounded-md transition hover:bg-zinc-200/60"
      >
        <Dot status={status} />
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute top-9 left-0 z-20 w-40 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-900/5"
          >
            {STATUS_ORDER.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s)
                  close()
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-zinc-100"
              >
                <Dot status={s} />
                {STATUS[s].label}
                {s === status ? (
                  <i className="ri-check-line ml-auto text-zinc-500" />
                ) : (
                  <span className="ml-auto text-xs text-zinc-300">{i + 1}</span>
                )}
              </button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function StatusSegmented({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-lg bg-zinc-100 p-1">
      {STATUS_ORDER.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`flex items-center justify-center gap-2 rounded-md py-1.5 text-xs font-medium whitespace-nowrap transition ${
            value === s ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Dot status={s} />
          {STATUS[s].label}
        </button>
      ))}
    </div>
  )
}
