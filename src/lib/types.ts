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
  /** Prossima azione da fare */
  nextStep: string
  /** Valore in euro */
  value: number | null
  tags: string[]
  notes: string
  pinned: boolean
  createdAt: number
  updatedAt: number
}
