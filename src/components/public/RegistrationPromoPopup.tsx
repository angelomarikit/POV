import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, MapPin, X } from 'lucide-react'
import { getEvents, queryKeys } from '../../services/content'
import { findPass, registerForEvent } from '../../services/passes'
import { isSupabaseConfigured } from '../../lib/supabase'
import type { Event, RegistrantRole } from '../../types'

const ROLES: Array<{ value: RegistrantRole; label: string }> = [
  { value: 'guest', label: 'Guest' },
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'member', label: 'Member' },
]

function dismissKey(eventId: string) {
  return `pov-reg-popup-dismissed:${eventId}`
}

function pickPopupEvent(events: Event[]) {
  return events.find(event => event.registration_enabled && event.show_registration_popup) || null
}

function shouldSkipPopup(pathname: string) {
  if (pathname.startsWith('/admin')) return true
  if (pathname.startsWith('/pass/')) return true
  if (pathname.includes('/register')) return true
  return false
}

export function RegistrationPromoPopup() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const skip = shouldSkipPopup(pathname)

  const { data: events = [], isLoading } = useQuery({
    queryKey: queryKeys.events,
    queryFn: () => getEvents(),
    enabled: isSupabaseConfigured && !skip,
    retry: false,
  })
  const event = skip ? null : pickPopupEvent(events)
  const [open, setOpen] = useState(false)
  const [finding, setFinding] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [invitedBy, setInvitedBy] = useState('')
  const [role, setRole] = useState<RegistrantRole>('guest')
  const [error, setError] = useState('')

  useEffect(() => {
    if (skip || isLoading || !event) {
      setOpen(false)
      return
    }
    try {
      if (sessionStorage.getItem(dismissKey(event.id))) {
        setOpen(false)
        return
      }
    } catch {
      /* ignore */
    }

    const delayMs = Math.max(0, Number(event.registration_popup_delay_seconds ?? 3)) * 1000
    const timer = window.setTimeout(() => setOpen(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [event, isLoading, skip, pathname])

  const dismiss = () => {
    if (event) {
      try {
        sessionStorage.setItem(dismissKey(event.id), '1')
      } catch {
        /* ignore */
      }
    }
    setOpen(false)
  }

  const register = useMutation({
    mutationFn: () => registerForEvent({
      event_id: event!.id,
      first_name: firstName,
      family_name: familyName,
      mobile,
      email,
      city,
      invited_by: invitedBy,
      role,
    }),
    onSuccess: pass => {
      dismiss()
      navigate(`/pass/${pass.pass_code}`, { replace: true })
    },
    onError: reason => setError(reason instanceof Error ? reason.message : 'Unable to generate your pass.'),
  })

  const find = useMutation({
    mutationFn: () => findPass(event!.id, email),
    onSuccess: pass => {
      if (!pass) {
        setError('No pass found for that email on this event.')
        return
      }
      dismiss()
      navigate(`/pass/${pass.pass_code}`, { replace: true })
    },
    onError: reason => setError(reason instanceof Error ? reason.message : 'Unable to find your pass.'),
  })

  const submit = (formEvent: FormEvent) => {
    formEvent.preventDefault()
    setError('')
    if (finding) {
      find.mutate()
      return
    }
    register.mutate()
  }

  const busy = register.isPending || find.isPending

  return (
    <AnimatePresence>
      {open && event && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reg-popup-title"
        >
          <button type="button" aria-label="Close registration" className="absolute inset-0" onClick={dismiss} />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative flex max-h-[min(92svh,720px)] w-full max-w-[var(--app-width)] flex-col overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="focus-ring absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm"
            >
              <X size={18} />
            </button>

            <div className="overflow-y-auto p-4 pt-5">
              <section className="rounded-2xl border border-orange-200 p-4 pr-12">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-orange-500">
                  {event.registration_status_label || 'Upcoming event'}
                </p>
                <h2 id="reg-popup-title" className="mt-2 text-xl font-black uppercase tracking-tight">
                  {event.title}
                </h2>
                <p className="mt-3 flex items-start gap-2 text-sm text-neutral-600">
                  <CalendarDays size={16} className="mt-0.5 shrink-0 text-orange-500" />
                  {format(new Date(event.start_date), 'EEE, MMM d, yyyy, h:mm a')}
                </p>
                {event.location && (
                  <p className="mt-2 flex items-start gap-2 text-sm uppercase text-neutral-600">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-orange-500" />
                    {event.location}
                  </p>
                )}
              </section>

              <h3 className="mt-5 text-2xl font-black text-orange-500">
                {finding ? 'Find my pass' : 'Get your QR pass'}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-neutral-600">
                {finding
                  ? 'Enter the email you used when you registered.'
                  : 'Register once and use the same pass for this POV event.'}
              </p>

              <form onSubmit={submit} className="mt-5 space-y-3">
                {!finding && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First name *" value={firstName} onChange={setFirstName} required />
                    <Field label="Family name *" value={familyName} onChange={setFamilyName} required />
                  </div>
                )}
                {!finding && (
                  <Field label="Mobile number *" type="tel" value={mobile} onChange={setMobile} required autoComplete="tel" />
                )}
                <Field
                  label={finding ? 'Email *' : 'Email (optional)'}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  required={finding}
                  autoComplete="email"
                />
                {!finding && (
                  <>
                    <Field label="City / Location" value={city} onChange={setCity} />
                    <Field label="Invited by" value={invitedBy} onChange={setInvitedBy} />
                    <div>
                      <p className="mb-2 text-sm font-bold">I am a</p>
                      <div className="grid grid-cols-3 gap-2">
                        {ROLES.map(item => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setRole(item.value)}
                            className={`focus-ring min-h-11 rounded-xl text-sm font-bold transition ${role === item.value ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-700'}`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="focus-ring inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-orange-500 font-bold text-white disabled:opacity-60"
                >
                  {busy ? 'Please wait…' : finding ? 'Find my pass' : 'Submit & Generate Pass'}
                </button>
              </form>

              <div className="mt-4 space-y-2 pb-1 text-center text-sm">
                <button
                  type="button"
                  onClick={() => { setFinding(current => !current); setError('') }}
                  className="font-semibold text-orange-600 underline underline-offset-2"
                >
                  {finding ? 'Register for a new pass' : 'Already registered? Find my pass'}
                </button>
                <div>
                  <Link to="/" onClick={dismiss} className="text-neutral-500 underline underline-offset-2">
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({
  label, value, onChange, type = 'text', required, autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
}) {
  const id = useMemo(() => `popup-${label.toLowerCase().replace(/\W+/g, '-')}`, [label])
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      <input
        id={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="focus-ring h-12 w-full rounded-xl border border-neutral-200 px-4 outline-none"
      />
    </label>
  )
}
