import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { getEventBySlug } from '../services/content'
import { findPass, registerForEvent } from '../services/passes'
import { isSupabaseConfigured } from '../lib/supabase'
import type { RegistrantRole } from '../types'
import { useDocumentMeta } from '../hooks/useDocumentMeta'

const ROLES: Array<{ value: RegistrantRole; label: string }> = [
  { value: 'guest', label: 'Guest' },
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'member', label: 'Member' },
]

export default function EventRegisterPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const findMode = params.get('find') === '1'

  const eventQuery = useQuery({
    queryKey: ['event', slug, 'register'],
    queryFn: () => getEventBySlug(slug),
    enabled: isSupabaseConfigured && Boolean(slug),
    retry: false,
  })
  const event = eventQuery.data

  const [firstName, setFirstName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [invitedBy, setInvitedBy] = useState('')
  const [role, setRole] = useState<RegistrantRole>('guest')
  const [error, setError] = useState('')
  const [finding, setFinding] = useState(findMode)

  useDocumentMeta(event ? `Get QR pass · ${event.title}` : 'Get your QR pass')

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
    onSuccess: pass => navigate(`/pass/${pass.pass_code}`, { replace: true }),
    onError: reason => setError(reason instanceof Error ? reason.message : 'Unable to generate your pass.'),
  })

  const find = useMutation({
    mutationFn: () => findPass(event!.id, email),
    onSuccess: pass => {
      if (!pass) {
        setError('No pass found for that email on this event.')
        return
      }
      navigate(`/pass/${pass.pass_code}`, { replace: true })
    },
    onError: reason => setError(reason instanceof Error ? reason.message : 'Unable to find your pass.'),
  })

  const submit = (eventForm: FormEvent) => {
    eventForm.preventDefault()
    setError('')
    if (finding) {
      find.mutate()
      return
    }
    register.mutate()
  }

  if (eventQuery.isLoading) return <div className="px-5 py-8"><div className="skeleton h-40 rounded-3xl" /><div className="skeleton mt-4 h-64 rounded-3xl" /></div>
  if (!event) return <div className="px-5 py-12 text-center"><h1 className="text-2xl font-black">Event not found</h1><Link to="/events" className="mt-4 inline-block font-bold text-orange-600">Back to events</Link></div>
  if (!event.registration_enabled) {
    return <div className="px-5 py-12 text-center">
      <h1 className="text-2xl font-black">Registration closed</h1>
      <p className="mt-2 text-sm text-neutral-500">QR pass registration is not open for this event yet.</p>
      <Link to={`/events/${event.slug}`} className="mt-4 inline-block font-bold text-orange-600">Back to event</Link>
    </div>
  }

  const busy = register.isPending || find.isPending

  return (
    <div className="bg-white px-5 pb-12 pt-6">
      <Link to={`/events/${event.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500"><ArrowLeft size={16} />Back to event</Link>

      <section className="mt-5 rounded-2xl border border-neutral-200 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-orange-500">{event.registration_status_label || 'Upcoming event'}</p>
        <h1 className="mt-2 text-[22px] font-black uppercase tracking-tight">{event.title}</h1>
        <p className="mt-3 flex items-start gap-2 text-sm text-neutral-600"><CalendarDays size={16} className="mt-0.5 shrink-0 text-orange-500" />{format(new Date(event.start_date), 'EEE, MMM d, yyyy, h:mm a')}</p>
        {event.location && <p className="mt-2 flex items-start gap-2 text-sm uppercase text-neutral-600"><MapPin size={16} className="mt-0.5 shrink-0 text-orange-500" />{event.location}</p>}
      </section>

      <h2 className="mt-7 text-[26px] font-black text-orange-500">{finding ? 'Find my pass' : 'Get your QR pass'}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        {finding
          ? 'Enter the email you used when you registered.'
          : 'Register once and use the same pass for this POV event.'}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {!finding && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name *" value={firstName} onChange={setFirstName} required />
            <Field label="Family name *" value={familyName} onChange={setFamilyName} required />
          </div>
        )}
        {!finding && <Field label="Mobile number *" type="tel" value={mobile} onChange={setMobile} required />}
        <Field label={finding ? 'Email *' : 'Email (optional)'} type="email" value={email} onChange={setEmail} required={finding} />
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

        <button type="submit" disabled={busy} className="focus-ring inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-orange-500 font-bold text-white disabled:opacity-60">
          {busy ? 'Please wait…' : finding ? 'Find my pass' : 'Submit & Generate Pass'}
        </button>
      </form>

      <div className="mt-5 space-y-2 text-center text-sm">
        <button type="button" onClick={() => { setFinding(current => !current); setError('') }} className="font-semibold text-orange-600 underline underline-offset-2">
          {finding ? 'Register for a new pass' : 'Already registered? Find my pass'}
        </button>
        <div><Link to="/" className="text-neutral-500 underline underline-offset-2">Back to Home</Link></div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  const id = useMemo(() => label.toLowerCase().replace(/\W+/g, '-'), [label])
  const ref = useRef<HTMLInputElement>(null)
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input
        ref={ref}
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="focus-ring h-12 w-full rounded-xl border border-neutral-200 px-4 outline-none"
      />
    </label>
  )
}
