import { AnimatePresence, m } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { clients } from '../lib/store'
import { supabase } from '../lib/supabase'
import type { Client } from '../lib/types'
import { todayISO } from '../lib/utils'
import { useClickOutside } from '../lib/useClickOutside'

function download() {
  const blob = new Blob([JSON.stringify(clients.all(), null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `clienti-${todayISO()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function Menu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, open, close)

  const item = 'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-zinc-100'

  return (
    <div ref={ref} className="relative">
      <button type="button" title="Altro" onClick={() => setOpen((o) => !o)} className="icon-btn size-9">
        <i className="ri-more-2-line text-lg" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          try {
            const data = JSON.parse(await f.text()) as Client[]
            if (!Array.isArray(data)) throw new Error()
            clients.merge(data)
          } catch {
            alert('File non valido.')
          }
        }}
      />
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute top-11 right-0 z-30 w-52 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-900/5"
          >
            <button type="button" className={item} onClick={() => (download(), close())}>
              <i className="ri-download-2-line text-zinc-400" /> Esporta backup
            </button>
            <button type="button" className={item} onClick={() => (fileRef.current?.click(), close())}>
              <i className="ri-upload-2-line text-zinc-400" /> Importa backup
            </button>
            <div className="my-1 border-t border-zinc-100" />
            <button type="button" className={item} onClick={() => (clients.seed(), close())}>
              <i className="ri-sparkling-line text-zinc-400" /> Aggiungi esempi
            </button>
            <div className="my-1 border-t border-zinc-100" />
            <button type="button" className={item} onClick={() => (supabase.auth.signOut(), close())}>
              <i className="ri-logout-box-r-line text-zinc-400" /> Esci
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
