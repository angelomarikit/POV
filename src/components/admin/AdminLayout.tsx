import { CalendarDays, ChevronLeft, Crown, Images, LayoutDashboard, LogOut, Menu, MessageCircle, Newspaper, PanelsTopLeft, PlaySquare, Settings, Share2, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAdminAuth } from './AdminAuth'
import { AppShell } from '../layout/AppShell'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/homepage', label: 'Homepage', icon: PanelsTopLeft },
  { to: '/admin/members', label: 'Members', icon: Users },
  { to: '/admin/founders', label: 'Founders', icon: Crown },
  { to: '/admin/categories', label: 'Categories', icon: Users },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/videos', label: 'Videos', icon: PlaySquare },
  { to: '/admin/news', label: 'News', icon: Newspaper },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/media', label: 'Media library', icon: Images },
  { to: '/admin/social', label: 'Social links', icon: Share2 },
  { to: '/admin/contacts', label: 'CTA / Messenger', icon: MessageCircle },
  { to: '/admin/settings', label: 'About content', icon: Settings },
]

export function AdminLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { profile, signOut } = useAdminAuth()
  const current = nav.find(item => item.end ? pathname === item.to : pathname.startsWith(item.to))

  useEffect(() => { setOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])

  return <AppShell className="bg-neutral-100">
    <header className="sticky top-0 z-50 flex h-15 items-center gap-3 bg-[#0b0b0c] px-4 pt-[env(safe-area-inset-top)] text-white">
      <img src="/pov-logo.png" alt="" className="size-9 rounded-full" />
      <div className="leading-tight">
        <strong className="block text-sm">{current?.label || 'POV Admin'}</strong>
        <span className="text-[10px] uppercase tracking-widest text-orange-500">Content studio</span>
      </div>
      <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" className="focus-ring ml-auto grid size-10 place-items-center rounded-xl active:bg-white/10"><Menu /></button>
    </header>

    <main className="flex-1 px-4 pb-12 pt-5"><Outlet /></main>

    <AnimatePresence>
      {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex justify-center bg-black/60">
        <div className="relative w-full max-w-[var(--app-width)]">
          <button type="button" aria-label="Close menu" className="absolute inset-0 size-full" onClick={() => setOpen(false)} />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: .22 }} className="absolute inset-y-0 right-0 flex w-[78%] flex-col bg-[#101012] text-white">
            <div className="flex h-15 items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
              <span className="text-xs font-bold uppercase tracking-[.22em] text-orange-500">Manage</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="focus-ring grid size-10 place-items-center rounded-full active:bg-white/10"><X /></button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Admin navigation">
              {nav.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${isActive ? 'bg-orange-500 text-white' : 'text-neutral-400 active:bg-white/10'}`}><Icon size={18} />{label}</NavLink>)}
            </nav>
            <div className="border-t border-white/10 p-3 pb-[calc(env(safe-area-inset-bottom)+.75rem)]">
              <p className="px-3 pb-2 text-xs text-neutral-500">{profile?.full_name || 'Administrator'} · <span className="capitalize">{profile?.role}</span></p>
              <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-400"><ChevronLeft size={18} />View public app</Link>
              <button onClick={() => void signOut()} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-400"><LogOut size={18} />Sign out</button>
            </div>
          </motion.aside>
        </div>
      </motion.div>}
    </AnimatePresence>
  </AppShell>
}
