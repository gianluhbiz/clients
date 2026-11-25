import { useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) {
      setError(
        error.message.includes('Invalid login credentials')
          ? 'Email o password non corretti.'
          : 'Accesso non riuscito. Controlla la connessione e riprova.',
      )
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-zinc-900 text-lg text-white">
            <i className="ri-contacts-book-3-line" />
          </span>
          <h1 className="mt-4 text-xl font-semibold">Clienti</h1>
          <p className="mt-1 text-sm text-zinc-500">Accedi per vedere i tuoi clienti.</p>
        </div>

        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-900/[0.03]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-500">Email</span>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-500">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>
          {error && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              <i className="ri-error-warning-line" /> {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
            {busy ? <i className="ri-loader-4-line animate-spin" /> : 'Accedi'}
          </button>
        </div>
      </form>
    </div>
  )
}
