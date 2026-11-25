import { memo } from 'react'
import { CONTACT, contactHref } from '../lib/meta'
import { clients } from '../lib/store'
import type { Client } from '../lib/types'
import { euro, reminderInfo } from '../lib/utils'
import { StatusButton } from './Status'

const TONE = {
  overdue: 'text-red-600',
  today: 'text-amber-600 font-medium',
  future: 'text-zinc-500',
}

interface Props {
  client: Client
  index: number
  active: boolean
  onOpen: (id: string) => void
}

export const ClientRow = memo(function ClientRow({ client: c, index, active, onOpen }: Props) {
  const r = reminderInfo(c.reminderAt)
  const due = r && r.tone !== 'future'

  return (
    <div
      role="button"
      tabIndex={-1}
      data-idx={index}
      onClick={() => onOpen(c.id)}
      className={`group flex cursor-pointer items-center gap-2 py-2.5 pr-3 pl-2 transition-colors first:rounded-t-xl last:rounded-b-xl sm:gap-3 ${
        active ? 'bg-zinc-100' : 'hover:bg-zinc-50'
      }`}
    >
      <StatusButton status={c.status} onChange={(status) => clients.update(c.id, { status })} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-medium">{c.name || 'Senza nome'}</span>
          {c.pinned && <i className="ri-pushpin-fill shrink-0 text-xs text-zinc-400" />}
          {c.company && <span className="hidden truncate text-sm text-zinc-400 sm:inline">{c.company}</span>}
        </div>
        {(r || c.nextStep || c.tags.length > 0) && (
          <div className="mt-0.5 flex items-center gap-2 text-sm text-zinc-500">
            {r && (
              <span className={`flex shrink-0 items-center gap-1 ${TONE[r.tone]}`}>
                <i className="ri-alarm-line" />
                {r.label}
              </span>
            )}
            {c.nextStep && <span className="truncate">{c.nextStep}</span>}
            {!c.nextStep &&
              c.tags.map((t) => (
                <span key={t} className="shrink-0 rounded bg-zinc-100 px-1.5 text-xs leading-5 text-zinc-500">
                  {t}
                </span>
              ))}
          </div>
        )}
      </div>

      {due && (
        <button
          type="button"
          title="Fatto: rimuovi promemoria"
          onClick={(e) => {
            e.stopPropagation()
            clients.update(c.id, { reminderAt: '' })
          }}
          className="icon-btn hidden group-hover:grid hover:text-emerald-600"
        >
          <i className="ri-check-double-line" />
        </button>
      )}

      <div className="flex shrink-0 items-center">
        {c.contacts.slice(0, 4).map((x) => {
          const href = contactHref(x)
          return (
            <a
              key={x.id}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              title={`${CONTACT[x.type].label}: ${x.value}`}
              onClick={(e) => e.stopPropagation()}
              className="icon-btn"
            >
              <i className={CONTACT[x.type].icon} />
            </a>
          )
        })}
      </div>

      <div className="hidden w-20 shrink-0 text-right text-sm text-zinc-600 tabular-nums sm:block">
        {c.value != null ? euro.format(c.value) : ''}
      </div>
    </div>
  )
})
