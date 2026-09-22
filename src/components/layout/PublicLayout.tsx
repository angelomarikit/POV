import { CalendarDays, ChevronLeft, Home, Info, Menu, MessageCircle, Music2, PlaySquare, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { getSocialLinks, queryKeys } from '../../services/content'
import { SOCIAL_DEFAULTS } from '../../config/site'
import { AppShell } from './AppShell'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/videos', label: 'Videos', icon: PlaySquare },
  { to: '/about', label: 'About', icon: Info },
]

function useScreenTitle() {
  const { pathname } = useLocation()
  if (pathname === '/') return { title: '', isRoot: true }
  const tab = tabs.find(item => item.to !== '/' && pathname === item.to)
  if (tab) return { title: tab.label, isRoot: true }
  if (pathname.startsWith('/community/')) return { title: 'Profile', isRoot: false }
  if (pathname.startsWith('/events/')) return { title: 'Event', isRoot: false }
  return { title: '', isRoot: false }
}

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { title, isRoot } = useScreenTitle()

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return <AppShell>
      <header className="sticky top-0 z-50 bg-[#0b0b0c] pt-[env(safe-area-inset-top)] text-white">
        <div className="flex h-15 items-center gap-3 px-4">
          {isRoot ? <Link to="/" className="focus-ring flex items-center gap-2.5 rounded-xl" aria-label="Pinoy Online Venture home">
            <img src="/pov-logo.png" alt="" className="size-9 rounded-full" />
            <span className="leading-none">
              <strong className="block text-[15px] font-black tracking-tight">PINOY ONLINE</strong>
              {/* Letters are spread edge to edge so the final E lines up with the E of ONLINE. */}
              <span aria-hidden="true" className="mt-1 flex justify-between text-[13px] font-black leading-none text-orange-500">
                {'VENTURE'.split('').map((letter, index) => <span key={index}>{letter}</span>)}
              </span>
            </span>
          </Link> : <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="focus-ring -ml-2 grid size-10 place-items-center rounded-full active:bg-white/10"><ChevronLeft /></button>}
          {!isRoot && <span className="text-base font-bold">{title}</span>}
          {isRoot && title && <span className="sr-only">{title}</span>}
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="focus-ring ml-auto grid size-10 place-items-center rounded-xl active:bg-white/10"><Menu /></button>
        </div>
      </header>

      <main className="safe-bottom flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .22, ease: 'easeOut' }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
        <AppFooter />
      </main>

      <AnimatePresence>
        {menuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex justify-center bg-black/60">
          <div className="w-full max-w-[var(--app-width)]">
            <button type="button" aria-label="Close menu" className="absolute inset-0 size-full" onClick={() => setMenuOpen(false)} />
            <motion.nav initial={{ y: '-8%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-8%', opacity: 0 }} transition={{ duration: .2 }} className="relative rounded-b-3xl bg-[#0b0b0c] px-4 pb-5 pt-[calc(env(safe-area-inset-top)+.75rem)] text-white" aria-label="Menu">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[.22em] text-orange-500">Menu</span>
                <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="focus-ring grid size-10 place-items-center rounded-full active:bg-white/10"><X /></button>
              </div>
              {tabs.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-bold ${isActive ? 'bg-orange-500 text-white' : 'text-neutral-300 active:bg-white/10'}`}><Icon size={19} />{label}</NavLink>)}
            </motion.nav>
          </div>
        </motion.div>}
      </AnimatePresence>

      <nav className="app-dock border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_34px_rgba(0,0,0,.1)] backdrop-blur-xl" aria-label="App navigation">
        <div className="grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `focus-ring relative flex min-h-16 flex-col items-center justify-center gap-1.5 text-[10px] font-bold transition ${isActive ? 'text-orange-600' : 'text-neutral-500'}`}>
            {({ isActive }) => <>
              {isActive && <motion.span layoutId="tab-indicator" className="absolute top-0 h-[3px] w-9 rounded-b-full bg-orange-500" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <Icon size={21} strokeWidth={isActive ? 2.6 : 2} />
              <span>{label}</span>
            </>}
          </NavLink>)}
      </div>
    </nav>
  </AppShell>
}

function AppFooter() {
  const { data = [] } = useQuery({ queryKey: queryKeys.socials, queryFn: () => getSocialLinks(), retry: false })
  const socials = data.length ? data : [
    { id: 'fb', platform: 'facebook', label: 'Facebook', url: SOCIAL_DEFAULTS.facebook },
    { id: 'tt', platform: 'tiktok', label: 'TikTok', url: SOCIAL_DEFAULTS.tiktok },
    { id: 'yt', platform: 'youtube', label: 'YouTube', url: SOCIAL_DEFAULTS.youtube },
  ]
  const icon = (platform: string) => platform === 'facebook' ? <MessageCircle size={19} /> : platform === 'youtube' ? <PlaySquare size={19} /> : <Music2 size={19} />
  return <footer className="bg-[#0b0b0c] px-6 pb-9 pt-10 text-center text-white">
    <img src="/pov-logo.png" alt="" className="mx-auto size-12 rounded-full" />
    <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-neutral-400">A community where Filipino entrepreneurs connect, learn, build, and create meaningful opportunities together.</p>
    <div className="mt-6 flex justify-center gap-3">
      {socials.map(social => <a key={social.id} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="grid size-11 place-items-center rounded-full border border-white/15 text-neutral-300 transition active:bg-orange-500 active:text-white">{icon(social.platform)}</a>)}
    </div>
    <p className="mt-7 text-[11px] text-neutral-500">© {new Date().getFullYear()} Pinoy Online Venture</p>
  </footer>
}
