import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  BarChart3, CheckCircle2, ChevronDown, Home, LogOut, Scan, Search, UserPlus, Users,
} from 'lucide-react'
import { useAdminAuth } from '../../components/admin/AdminAuth'
import { AppShell } from '../../components/layout/AppShell'
import { getEvents } from '../../services/content'
import {
  checkInByCode, createWalkIn, getPassByCode, getRegistrantStats, listRegistrants, passQueryKeys,
} from '../../services/passes'
import { formatRegistrantName, formatRoleLabel, normalizePassCode } from '../../utils/passes'
import { isSupabaseConfigured } from '../../lib/supabase'
import type { Event, EventRegistrant, RegistrantRole } from '../../types'

type Tab = 'home' | 'scan' | 'walkin' | 'people' | 'report'
type PeopleFilter = 'all' | 'confirmed' | 'checked_in'

const ROLES: Array<{ value: RegistrantRole; label: string }> = [
  { value: 'guest', label: 'Guest' },
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'member', label: 'Member' },
]

const TABS = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'scan' as const, label: 'Scan', icon: Scan },
  { id: 'walkin' as const, label: 'Walk In', icon: UserPlus },
  { id: 'people' as const, label: 'People', icon: Users },
  { id: 'report' as const, label: 'Report', icon: BarChart3 },
]

export default function AdminStaffConsolePage() {
  const { profile, signOut } = useAdminAuth()
  const client = useQueryClient()
  const isStaffOnly = profile?.role === 'staff'
  const [tab, setTab] = useState<Tab>('home')
  const [peopleFilter, setPeopleFilter] = useState<PeopleFilter>('all')
  const [eventId, setEventId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const eventsQuery = useQuery({
    queryKey: ['staff-events'],
    queryFn: () => getEvents(true),
    enabled: isSupabaseConfigured,
  })
  const registrationEvents = useMemo(
    () => (eventsQuery.data || []).filter(event => event.registration_enabled),
    [eventsQuery.data],
  )

  useEffect(() => {
    if (!eventId && registrationEvents[0]) setEventId(registrationEvents[0].id)
  }, [eventId, registrationEvents])

  const selected = registrationEvents.find(event => event.id === eventId) || null

  const statsQuery = useQuery({
    queryKey: passQueryKeys.stats(eventId),
    queryFn: () => getRegistrantStats(eventId),
    enabled: Boolean(eventId),
    refetchInterval: 15_000,
  })

  const peopleQuery = useQuery({
    queryKey: passQueryKeys.registrants(eventId),
    queryFn: () => listRegistrants(eventId),
    enabled: Boolean(eventId) && (tab === 'people' || tab === 'report' || tab === 'home'),
  })

  const invalidate = async () => {
    await client.invalidateQueries({ queryKey: passQueryKeys.stats(eventId) })
    await client.invalidateQueries({ queryKey: passQueryKeys.registrants(eventId) })
  }

  const checkIn = useMutation({
    mutationFn: (code: string) => checkInByCode(code, profile?.id),
    onSuccess: async pass => {
      setError('')
      setMessage(`Checked in ${formatRegistrantName(pass.family_name, pass.first_name)} (${pass.pass_code})`)
      await invalidate()
    },
    onError: reason => {
      setMessage('')
      setError(reason instanceof Error ? reason.message : 'Check-in failed.')
    },
  })

  const goPeople = (filter: PeopleFilter = 'all') => {
    setPeopleFilter(filter)
    setTab('people')
    setMessage('')
    setError('')
  }

  const metaLine = selected
    ? [
        selected.is_published ? 'Live' : 'Draft',
        format(new Date(selected.start_date), 'EEE, MMM d, yyyy \'at\' h:mm a'),
        selected.location || '',
      ].filter(Boolean).join(' • ')
    : ''

  return (
    <AppShell className="bg-white">
      <header className="sticky top-0 z-50 bg-white pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-black tracking-tight">Staff Console</h1>
          {isStaffOnly ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="focus-ring inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-800"
            >
              <LogOut size={16} />Exit
            </button>
          ) : (
            <Link to="/admin" className="focus-ring inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
              <LogOut size={16} />Exit
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pb-8">
        <label className="relative mt-1 block rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[.16em] text-neutral-400">Event</span>
          <div className="mt-1 flex items-start gap-2 pr-6">
            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${selected?.is_published ? 'bg-orange-500' : 'bg-neutral-300'}`} />
            <div className="min-w-0 flex-1">
              <select
                value={eventId}
                onChange={event => { setEventId(event.target.value); setMessage(''); setError('') }}
                className="w-full appearance-none bg-transparent text-[15px] font-black uppercase tracking-tight outline-none"
                aria-label="Select event"
              >
                {!registrationEvents.length && <option value="">No QR events enabled</option>}
                {registrationEvents.map(event => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </select>
              {selected && (
                <p className="mt-0.5 truncate text-xs text-neutral-500">{metaLine}</p>
              )}
            </div>
          </div>
          <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        </label>

        <nav className="mt-5 grid grid-cols-5 gap-1" aria-label="Staff console tabs">
          {TABS.map(item => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { setTab(item.id); setMessage(''); setError('') }}
                className="flex flex-col items-center gap-1.5 py-1"
              >
                <span className={`grid size-12 place-items-center rounded-2xl transition ${active ? 'bg-orange-500 text-white shadow-sm' : 'bg-transparent text-neutral-400'}`}>
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className={`text-[11px] font-semibold ${active ? 'text-neutral-900' : 'text-neutral-400'}`}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {!selected ? (
          <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            Enable QR registration on an event in <strong>Admin → QR Events</strong> first.
          </div>
        ) : (
          <>
            {tab === 'home' && (
              <HomeTab
                event={selected}
                confirmed={statsQuery.data?.confirmed || 0}
                checkedIn={statsQuery.data?.checkedIn || 0}
                onScan={() => setTab('scan')}
                onWalkIn={() => setTab('walkin')}
                onViewCheckedIn={() => goPeople('checked_in')}
                onViewConfirmed={() => goPeople('confirmed')}
              />
            )}
            {tab === 'scan' && (
              <ScanTab
                busy={checkIn.isPending}
                message={message}
                error={error}
                onCheckIn={code => checkIn.mutate(code)}
                onLookup={async code => getPassByCode(code)}
              />
            )}
            {tab === 'walkin' && (
              <WalkInTab
                eventId={selected.id}
                adminId={profile?.id}
                onDone={async pass => {
                  setMessage(`Walk-in saved: ${formatRegistrantName(pass.family_name, pass.first_name)}`)
                  setError('')
                  await invalidate()
                  goPeople('all')
                }}
              />
            )}
            {tab === 'people' && (
              <PeopleTab
                rows={peopleQuery.data || []}
                loading={peopleQuery.isLoading}
                filter={peopleFilter}
                onFilterChange={setPeopleFilter}
                onCheckIn={code => checkIn.mutate(code)}
              />
            )}
            {tab === 'report' && (
              <ReportTab
                event={selected}
                confirmed={statsQuery.data?.confirmed || 0}
                checkedIn={statsQuery.data?.checkedIn || 0}
                rows={peopleQuery.data || []}
              />
            )}
          </>
        )}

        {(message || error) && tab !== 'scan' && (
          <p className={`mt-4 rounded-xl p-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{error || message}</p>
        )}

        <footer className="mt-10 pb-[env(safe-area-inset-bottom)] text-center">
          <span className="text-sm font-semibold text-orange-500">Privacy Policy</span>
          <p className="mt-2 text-[11px] text-neutral-400">
            Copyright © {new Date().getFullYear()}. PINOY ONLINE VENTURE. All Rights Reserved.
          </p>
        </footer>
      </main>
    </AppShell>
  )
}

function HomeTab({
  event, confirmed, checkedIn, onScan, onWalkIn, onViewCheckedIn, onViewConfirmed,
}: {
  event: Event
  confirmed: number
  checkedIn: number
  onScan: () => void
  onWalkIn: () => void
  onViewCheckedIn: () => void
  onViewConfirmed: () => void
}) {
  const detail = [
    format(new Date(event.start_date), 'EEE, MMM d, yyyy \'at\' h:mm a'),
    event.location || '',
  ].filter(Boolean).join(' • ')

  return (
    <section className="mt-8">
      <p className="text-[11px] font-bold uppercase tracking-[.18em] text-orange-500">Live event</p>
      <h2 className="mt-2 text-[28px] font-black uppercase leading-none tracking-tight">{event.title}</h2>
      <p className="mt-3 text-sm leading-6 text-neutral-500">{detail}</p>

      <div className="mt-8 grid grid-cols-2 gap-6">
        <button type="button" onClick={onViewCheckedIn} className="text-left">
          <p className="text-5xl font-black leading-none text-orange-500">{checkedIn}</p>
          <p className="mt-2 text-sm text-neutral-500">
            Checked in <span className="text-neutral-300">•</span>{' '}
            <span className="font-semibold text-neutral-600">view</span>
          </p>
        </button>
        <button type="button" onClick={onViewConfirmed} className="text-left">
          <p className="text-5xl font-black leading-none text-neutral-900">{confirmed}</p>
          <p className="mt-2 text-sm text-neutral-500">
            Confirmed <span className="text-neutral-300">•</span>{' '}
            <span className="font-semibold text-neutral-600">view</span>
          </p>
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onScan}
          className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 text-base font-bold text-white"
        >
          <Scan size={20} />Scan
        </button>
        <button
          type="button"
          onClick={onWalkIn}
          className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-neutral-100 text-base font-bold text-neutral-900"
        >
          <UserPlus size={20} />Walk-in
        </button>
      </div>
    </section>
  )
}

function ScanTab({
  busy, message, error, onCheckIn, onLookup,
}: {
  busy: boolean
  message: string
  error: string
  onCheckIn: (code: string) => void
  onLookup: (code: string) => Promise<EventRegistrant | null>
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onCheckInRef = useRef(onCheckIn)
  const onLookupRef = useRef(onLookup)
  const lastCodeRef = useRef('')
  const [manual, setManual] = useState('')
  const [preview, setPreview] = useState<EventRegistrant | null>(null)
  const [scanError, setScanError] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  onCheckInRef.current = onCheckIn
  onLookupRef.current = onLookup

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: number | undefined
    let active = true

    const start = async () => {
      try {
        if (!('BarcodeDetector' in window)) {
          setScanError('Camera QR scan is not supported on this browser. Enter the pass code manually below.')
          return
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if (!active || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraOn(true)
        // @ts-expect-error BarcodeDetector is not in all TS libs
        const detector = new BarcodeDetector({ formats: ['qr_code'] })
        const tick = async () => {
          if (!active || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            const raw = codes[0]?.rawValue as string | undefined
            if (raw) {
              const code = extractPassCode(raw)
              if (code && code !== lastCodeRef.current) {
                lastCodeRef.current = code
                const pass = await onLookupRef.current(code)
                setPreview(pass)
                if (pass && pass.status !== 'checked_in' && !pass.checked_in_at) onCheckInRef.current(code)
              }
            }
          } catch {
            /* keep scanning */
          }
          if (active) timer = window.setTimeout(() => { void tick() }, 700)
        }
        void tick()
      } catch {
        setScanError('Unable to open the camera. Enter the pass code manually.')
      }
    }

    void start()
    return () => {
      active = false
      if (timer) window.clearTimeout(timer)
      stream?.getTracks().forEach(track => track.stop())
    }
  }, [])

  const submitManual = (event: FormEvent) => {
    event.preventDefault()
    const code = normalizePassCode(manual)
    if (!code) return
    onCheckIn(code)
  }

  return (
    <section className="mt-6 space-y-4">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-black">
        <video ref={videoRef} muted playsInline className="aspect-[3/4] w-full object-cover opacity-90" />
        {!cameraOn && <div className="grid aspect-[3/4] place-items-center text-sm text-neutral-300">Starting camera…</div>}
      </div>
      {scanError && <p className="text-sm text-neutral-500">{scanError}</p>}
      {(message || error) && <p className={`rounded-xl p-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{error || message}</p>}
      {preview && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Last scan</p>
          <p className="mt-1 font-black">{formatRegistrantName(preview.family_name, preview.first_name)}</p>
          <p className="text-sm text-neutral-600">{formatRoleLabel(preview.role)} · {preview.pass_code}</p>
        </div>
      )}
      <form onSubmit={submitManual} className="rounded-2xl border border-neutral-200 p-4">
        <label className="block">
          <span className="mb-2 block text-sm font-bold">Pass code</span>
          <input value={manual} onChange={event => setManual(event.target.value.toUpperCase())} placeholder="POV-XXXXXX" className="focus-ring h-12 w-full rounded-xl border border-neutral-200 px-4 font-mono outline-none" />
        </label>
        <button type="submit" disabled={busy} className="focus-ring mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 font-bold text-white disabled:opacity-60">
          <CheckCircle2 size={18} />{busy ? 'Checking in…' : 'Check in'}
        </button>
      </form>
    </section>
  )
}

function extractPassCode(raw: string) {
  const match = raw.toUpperCase().match(/[A-Z0-9]{2,6}-[A-Z0-9]{6}/)
  if (match) return match[0]
  try {
    const url = new URL(raw)
    const part = url.pathname.split('/').filter(Boolean).pop()
    return part ? normalizePassCode(part) : normalizePassCode(raw)
  } catch {
    return normalizePassCode(raw)
  }
}

function WalkInTab({ eventId, adminId, onDone }: { eventId: string; adminId?: string; onDone: (pass: EventRegistrant) => void }) {
  const [firstName, setFirstName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [invitedBy, setInvitedBy] = useState('')
  const [role, setRole] = useState<RegistrantRole>('guest')
  const [checkInNow, setCheckInNow] = useState(true)
  const [error, setError] = useState('')

  const save = useMutation({
    mutationFn: () => createWalkIn({
      event_id: eventId,
      first_name: firstName,
      family_name: familyName,
      mobile,
      email,
      city,
      invited_by: invitedBy,
      role,
      check_in: checkInNow,
    }, adminId),
    onSuccess: pass => onDone(pass),
    onError: reason => setError(reason instanceof Error ? reason.message : 'Unable to save walk-in.'),
  })

  return (
    <form
      onSubmit={event => { event.preventDefault(); setError(''); save.mutate() }}
      className="mt-6 space-y-4"
    >
      <h2 className="text-lg font-black">Walk-in registration</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name *" value={firstName} onChange={setFirstName} required />
        <Field label="Family name *" value={familyName} onChange={setFamilyName} required />
      </div>
      <Field label="Mobile number *" type="tel" value={mobile} onChange={setMobile} required />
      <Field label="Email (optional)" type="email" value={email} onChange={setEmail} />
      <Field label="City / Location" value={city} onChange={setCity} />
      <Field label="Invited by" value={invitedBy} onChange={setInvitedBy} />
      <div>
        <p className="mb-2 text-sm font-bold">I am a</p>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map(item => (
            <button key={item.value} type="button" onClick={() => setRole(item.value)} className={`min-h-11 rounded-xl text-sm font-bold ${role === item.value ? 'bg-orange-500 text-white' : 'bg-neutral-100'}`}>{item.label}</button>
          ))}
        </div>
      </div>
      <label className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
        <span className="font-semibold">Check in immediately</span>
        <input type="checkbox" checked={checkInNow} onChange={event => setCheckInNow(event.target.checked)} className="size-5 accent-orange-500" />
      </label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={save.isPending} className="focus-ring inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-orange-500 font-bold text-white disabled:opacity-60">
        {save.isPending ? 'Saving…' : 'Save walk-in'}
      </button>
    </form>
  )
}

function PeopleTab({
  rows, loading, filter, onFilterChange, onCheckIn,
}: {
  rows: EventRegistrant[]
  loading: boolean
  filter: PeopleFilter
  onFilterChange: (filter: PeopleFilter) => void
  onCheckIn: (code: string) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = rows.filter(row => {
    if (row.status === 'cancelled') return false
    const checked = row.status === 'checked_in' || Boolean(row.checked_in_at)
    if (filter === 'checked_in' && !checked) return false
    if (filter === 'confirmed' && checked) return false
    const hay = `${row.first_name} ${row.family_name} ${row.mobile || ''} ${row.email || ''} ${row.pass_code} ${row.city || ''}`.toLowerCase()
    return hay.includes(search.toLowerCase())
  })

  return (
    <section className="mt-6">
      <label className="relative block">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, mobile, or code" className="focus-ring h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 text-sm outline-none" />
      </label>
      <div className="mt-3 flex gap-2">
        {([
          { id: 'all', label: 'All' },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'checked_in', label: 'Checked in' },
        ] as const).map(item => (
          <button key={item.id} type="button" onClick={() => onFilterChange(item.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === item.id ? 'bg-orange-500 text-white' : 'border border-neutral-200 bg-white text-neutral-600'}`}>{item.label}</button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {loading ? <div className="skeleton h-40 rounded-2xl" /> : filtered.length ? filtered.map(row => {
          const checked = row.status === 'checked_in' || Boolean(row.checked_in_at)
          return (
            <div key={row.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3">
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-sm">{formatRegistrantName(row.family_name, row.first_name)}</strong>
                <span className="block truncate text-xs text-neutral-500">{formatRoleLabel(row.role)}{row.mobile ? ` · ${row.mobile}` : ''}{row.city ? ` · ${row.city}` : ''} · {row.pass_code}</span>
              </div>
              {checked ? (
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">In</span>
              ) : (
                <button type="button" onClick={() => onCheckIn(row.pass_code)} className="rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-bold text-white">Check in</button>
              )}
            </div>
          )
        }) : <p className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">No registrants match.</p>}
      </div>
    </section>
  )
}

function ReportTab({
  event, confirmed, checkedIn, rows,
}: {
  event: Event
  confirmed: number
  checkedIn: number
  rows: EventRegistrant[]
}) {
  const byRole = ROLES.map(role => ({
    ...role,
    count: rows.filter(row => row.status !== 'cancelled' && row.role === role.value).length,
  }))
  return (
    <section className="mt-6 space-y-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-orange-500">Report</p>
        <h2 className="mt-2 text-xl font-black uppercase tracking-tight">{event.title}</h2>
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-5xl font-black leading-none text-orange-500">{checkedIn}</p>
            <p className="mt-2 text-sm text-neutral-500">Checked in</p>
          </div>
          <div>
            <p className="text-5xl font-black leading-none">{confirmed}</p>
            <p className="mt-2 text-sm text-neutral-500">Confirmed</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-neutral-500">{confirmed ? Math.round((checkedIn / confirmed) * 100) : 0}% check-in rate</p>
      </div>
      <div className="rounded-2xl border border-neutral-200 p-5">
        <h3 className="font-black">By role</h3>
        <div className="mt-3 space-y-2">
          {byRole.map(item => (
            <div key={item.value} className="flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Field({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input type={type} required={required} value={value} onChange={event => onChange(event.target.value)} className="focus-ring h-12 w-full rounded-xl border border-neutral-200 px-4 outline-none" />
    </label>
  )
}
