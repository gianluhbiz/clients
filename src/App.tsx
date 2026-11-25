import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router'
import Home from './Home'
import { endSession, startSession } from './lib/store'
import { supabase } from './lib/supabase'
import Login from './Login'

export default function App() {
  // undefined = sessione ancora in verifica.
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const userId = session?.user.id

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (userId) startSession(userId)
    else if (session === null) endSession()
  }, [userId, session])

  if (session === undefined) return null
  if (!session) return <Login />

  return (
    <Routes>
      {/* Una sola pagina: il dettaglio cliente (/c/:id) si apre come pannello sopra la lista */}
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
