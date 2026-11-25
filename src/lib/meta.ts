import type { Contact, ContactType, Status } from './types'

export const STATUS: Record<Status, { label: string; dot: string; ring: string; text: string }> = {
  lead: { label: 'Nuovo', dot: 'bg-sky-500', ring: 'ring-sky-500/15', text: 'text-sky-700' },
  attesa: { label: 'In attesa', dot: 'bg-amber-500', ring: 'ring-amber-500/15', text: 'text-amber-700' },
  chiuso: { label: 'Chiuso', dot: 'bg-emerald-500', ring: 'ring-emerald-500/15', text: 'text-emerald-700' },
  perso: { label: 'Perso', dot: 'bg-zinc-400', ring: 'ring-zinc-400/15', text: 'text-zinc-500' },
}

export const STATUS_ORDER: Status[] = ['lead', 'attesa', 'chiuso', 'perso']

const isUrl = (v: string) => /^https?:\/\//i.test(v)
const handle = (v: string) => v.trim().replace(/^@/, '')

function phoneDigits(v: string) {
  let d = v.replace(/[^\d+]/g, '')
  if (d.startsWith('00')) d = '+' + d.slice(2)
  // Numero senza prefisso internazionale: assume Italia
  if (!d.startsWith('+') && d.length <= 10) d = '+39' + d
  return d
}

export const CONTACT: Record<
  ContactType,
  { label: string; icon: string; placeholder: string; href: (v: string) => string }
> = {
  instagram: {
    label: 'Instagram',
    icon: 'ri-instagram-line',
    placeholder: '@username',
    href: (v) => (isUrl(v) ? v : `https://instagram.com/${handle(v)}`),
  },
  email: {
    label: 'Email',
    icon: 'ri-mail-line',
    placeholder: 'nome@dominio.it',
    href: (v) => `mailto:${v.trim()}`,
  },
  phone: {
    label: 'Telefono',
    icon: 'ri-phone-line',
    placeholder: '+39 333 1234567',
    href: (v) => `tel:${phoneDigits(v)}`,
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: 'ri-whatsapp-line',
    placeholder: '+39 333 1234567',
    href: (v) => (isUrl(v) ? v : `https://wa.me/${phoneDigits(v).replace('+', '')}`),
  },
  website: {
    label: 'Sito web',
    icon: 'ri-global-line',
    placeholder: 'sito.it',
    href: (v) => (isUrl(v) ? v : `https://${v.trim()}`),
  },
  telegram: {
    label: 'Telegram',
    icon: 'ri-telegram-line',
    placeholder: '@username',
    href: (v) => (isUrl(v) ? v : `https://t.me/${handle(v)}`),
  },
  linkedin: {
    label: 'LinkedIn',
    icon: 'ri-linkedin-box-line',
    placeholder: 'linkedin.com/in/…',
    href: (v) => (isUrl(v) ? v : v.includes('linkedin.com') ? `https://${v.trim()}` : `https://linkedin.com/in/${handle(v)}`),
  },
  tiktok: {
    label: 'TikTok',
    icon: 'ri-tiktok-line',
    placeholder: '@username',
    href: (v) => (isUrl(v) ? v : `https://tiktok.com/@${handle(v)}`),
  },
}

export const CONTACT_ORDER = Object.keys(CONTACT) as ContactType[]

export const contactHref = (c: Contact) => CONTACT[c.type].href(c.value)

/** Indovina il tipo di contatto da quello che l'utente incolla */
export function detectContactType(raw: string): ContactType {
  const v = raw.trim().toLowerCase()
  if (v.includes('instagram.com')) return 'instagram'
  if (v.includes('wa.me') || v.includes('whatsapp')) return 'whatsapp'
  if (v.includes('t.me/')) return 'telegram'
  if (v.includes('linkedin.com')) return 'linkedin'
  if (v.includes('tiktok.com')) return 'tiktok'
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'email'
  if (v.startsWith('@')) return 'instagram'
  if (/^\+?[\d\s().-]{6,}$/.test(v)) return 'phone'
  if (/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(v)) return 'website'
  return 'instagram'
}
