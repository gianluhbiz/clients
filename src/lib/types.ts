export type Status = 'lead' | 'attesa' | 'chiuso' | 'perso'

export type ContactType =
  | 'instagram'
  | 'email'
  | 'phone'
  | 'whatsapp'
  | 'website'
  | 'telegram'
  | 'linkedin'
  | 'tiktok'

export type RepeatUnit = 'day' | 'week' | 'month' | 'year'

/** Ogni quanto si ripete il promemoria; null = non si ripete */
export type Repeat = { n: number; unit: RepeatUnit } | null

export interface Contact {
  id: string
  type: ContactType
  value: string
}

export interface Client {
  id: string
  name: string
  /** Azienda, ruolo o dove l'hai conosciuto */
  company: string
  status: Status
  contacts: Contact[]
  /** Data promemoria in formato YYYY-MM-DD, '' se assente */
  reminderAt: string
  reminderEvery: Repeat
  /** Prossima azione da fare */
  nextStep: string
  /** Valore in euro */
  value: number | null
  /** Il valore si ripete ogni mese (es. fattura mensile) */
  recurring: boolean
  tags: string[]
  notes: string
  pinned: boolean
  createdAt: number
  updatedAt: number
}
