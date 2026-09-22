import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { TABLES } from '../../config/tables'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types'
import { AppShell } from '../layout/AppShell'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async (nextSession: Session | null) => {
      setSession(nextSession)
      if (!nextSession) { setProfile(null); setLoading(false); return }
      const { data } = await supabase.from(TABLES.admins).select('*').eq('id', nextSession.user.id).maybeSingle()
      setProfile(data as Profile | null)
      setLoading(false)
    }
    void supabase.auth.getSession().then(({ data }) => loadProfile(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { void loadProfile(nextSession) })
    return () => listener.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ session, user: session?.user || null, profile, loading, signOut: async () => { await supabase.auth.signOut() } }}>{children}</AuthContext.Provider>
}

export function useAdminAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return value
}

export function ProtectedAdminRoute() {
  const auth = useAdminAuth()
  const location = useLocation()
  if (auth.loading) return <AppShell className="!bg-[#0b0b0c] items-center justify-center text-white"><div className="size-10 animate-spin rounded-full border-4 border-white/20 border-t-orange-500" /></AppShell>
  if (!auth.session) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (!auth.profile || !['admin', 'editor'].includes(auth.profile.role)) return <AppShell className="justify-center px-6 text-center"><div><h1 className="text-2xl font-black">Administrator access required</h1><p className="mt-2 text-sm text-neutral-500">Your account is signed in but has not been assigned an admin or editor role.</p><button className="mt-6 font-bold text-orange-600" onClick={() => void auth.signOut()}>Sign out</button></div></AppShell>
  return <Outlet />
}
