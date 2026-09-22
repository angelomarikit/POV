import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ExternalLink, LockKeyhole } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAdminAuth } from '../../components/admin/AdminAuth'
import { Button } from '../../components/common/UI'
import { AppShell } from '../../components/layout/AppShell'

export default function AdminLoginPage() {
  const { session } = useAdminAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (session) return <Navigate to={(location.state as { from?: string } | null)?.from || '/admin'} replace />
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) setError('The email or password is incorrect, or this account is not enabled.')
    setBusy(false)
  }
  return <AppShell className="!bg-[#0b0b0c] px-5 py-7">
    <Link to="/" className="focus-ring inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-neutral-950"><ArrowLeft size={18} />Back to home</Link>
    <div className="my-auto w-full rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl">
      <div className="flex items-center gap-3">
        <img src="/pov-logo.png" alt="" className="size-12 rounded-full" />
        <div><h1 className="text-xl font-black">Admin sign in</h1><p className="text-sm text-neutral-500">Pinoy Online Venture CMS</p></div>
      </div>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block"><span className="mb-2 block text-sm font-bold">Email address</span><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="focus-ring h-12 w-full rounded-xl border border-neutral-200 px-4 outline-none" /></label>
        <label className="block"><span className="mb-2 block text-sm font-bold">Password</span><input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="focus-ring h-12 w-full rounded-xl border border-neutral-200 px-4 outline-none" /></label>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full"><LockKeyhole size={18} />{busy ? 'Signing in…' : 'Sign in securely'}</Button>
      </form>
      <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-neutral-200" /><span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Ascendra members</span><span className="h-px flex-1 bg-neutral-200" /></div>
      <a href="https://ascendraintl.ai" target="_blank" rel="noopener noreferrer" className="focus-ring group block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-orange-300 hover:bg-orange-50">
        <img src="/brand/ascendra.png" alt="Ascendra" className="h-10 w-auto object-contain object-left" />
        <span className="mt-3 flex items-center justify-between gap-3 text-sm font-bold">Existing Ascender? Log in here <ExternalLink size={17} className="text-orange-600" /></span>
      </a>
    </div>
  </AppShell>
}
