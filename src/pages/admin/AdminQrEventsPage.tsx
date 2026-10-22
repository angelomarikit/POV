import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toPng } from 'html-to-image'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarDays, Download, MapPin, QrCode, Ticket, X } from 'lucide-react'
import { Button, EmptyState, ImageUploader } from '../../components/common/UI'
import { TABLES } from '../../config/tables'
import { getEvents, queryKeys, saveRecord } from '../../services/content'
import { eventRegisterUrl } from '../../services/passes'
import { isSupabaseConfigured } from '../../lib/supabase'
import type { Event } from '../../types'

type QrForm = {
  registration_enabled: boolean
  show_registration_popup: boolean
  registration_popup_delay_seconds: number
  registration_status_label: string
  pass_brand_label: string
  poster_image_url: string
}

function toForm(event: Event): QrForm {
  return {
    registration_enabled: Boolean(event.registration_enabled),
    show_registration_popup: Boolean(event.show_registration_popup),
    registration_popup_delay_seconds: Number(event.registration_popup_delay_seconds ?? 3),
    registration_status_label: event.registration_status_label || '',
    pass_brand_label: event.pass_brand_label || 'POV',
    poster_image_url: event.poster_image_url || '',
  }
}

export default function AdminQrEventsPage() {
  const client = useQueryClient()
  const list = useQuery({
    queryKey: [...queryKeys.events, 'qr-admin'],
    queryFn: () => getEvents(true),
    enabled: isSupabaseConfigured,
  })
  const [editing, setEditing] = useState<Event | null>(null)
  const [form, setForm] = useState<QrForm | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editing) setForm(toForm(editing))
    else setForm(null)
  }, [editing])

  const save = useMutation({
    mutationFn: async () => {
      if (!editing || !form) throw new Error('Nothing to save.')
      const delay = Math.max(0, Math.min(300, Math.round(Number(form.registration_popup_delay_seconds) || 0)))
      return saveRecord(TABLES.events, {
        registration_enabled: form.registration_enabled,
        show_registration_popup: form.show_registration_popup,
        registration_popup_delay_seconds: delay,
        registration_status_label: form.registration_status_label.trim() || null,
        pass_brand_label: form.pass_brand_label.trim() || 'POV',
        poster_image_url: form.poster_image_url.trim() || null,
      }, editing.id)
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.events })
      setEditing(null)
      setError('')
    },
    onError: reason => setError(reason instanceof Error ? reason.message : 'Unable to save QR event settings.'),
  })

  const events = list.data || []
  const activeCount = events.filter(event => event.registration_enabled).length

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-bold text-orange-600">QR pass system</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">QR Events</h1>
        <p className="mt-2 text-sm text-neutral-500">
          POV generates both QRs: a <strong>registration QR</strong> (opens the form) and each guest’s <strong>confirmation QR</strong> after submit — Staff Console scans that for check-in.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/admin/events" className="focus-ring inline-flex min-h-10 items-center rounded-full border border-neutral-200 bg-white px-4 text-sm font-bold">
            Manage Events
          </Link>
          <Link to="/admin/staff" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full bg-orange-500 px-4 text-sm font-bold text-white">
            <QrCode size={16} />Staff Console
          </Link>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-2xl font-black text-orange-500">{activeCount}</p>
          <p className="text-xs font-semibold text-neutral-500">QR registration on</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-2xl font-black">{events.filter(e => e.show_registration_popup).length}</p>
          <p className="text-xs font-semibold text-neutral-500">Popup enabled</p>
        </div>
      </div>

      {list.isLoading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : events.length ? (
        <div className="space-y-3">
          {events.map(event => {
            const live = Boolean(event.registration_enabled)
            const popup = Boolean(event.show_registration_popup)
            return (
              <article key={event.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex gap-3">
                  {(event.poster_image_url || event.cover_image_url) ? (
                    <img src={event.poster_image_url || event.cover_image_url || ''} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600"><Ticket size={22} /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate text-base">{event.title}</strong>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${live ? 'bg-orange-50 text-orange-600' : 'bg-neutral-100 text-neutral-500'}`}>
                        {live ? 'QR on' : 'QR off'}
                      </span>
                      {popup && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700">Popup</span>}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                      <CalendarDays size={13} />
                      {format(new Date(event.start_date), 'EEE, MMM d, yyyy · h:mm a')}
                    </p>
                    {event.location && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs uppercase text-neutral-500">
                        <MapPin size={13} />{event.location}
                      </p>
                    )}
                    {live && (
                      <p className="mt-2 text-xs text-neutral-500">
                        Delay {Number(event.registration_popup_delay_seconds ?? 3)}s
                        {event.pass_brand_label ? ` · Brand ${event.pass_brand_label}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setError(''); setEditing(event) }}
                  className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-orange-500 text-sm font-bold text-white"
                >
                  Configure QR event
                </button>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No events yet"
          description="Create an event under Admin → Events, then come back here to enable QR registration and the popup."
          action={<Link to="/admin/events" className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-bold text-white">Go to Events</Link>}
        />
      )}

      {editing && form && (
        <div className="fixed inset-0 z-[80] flex justify-center bg-black/55" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" className="absolute inset-0" onClick={() => setEditing(null)} />
          <form
            onSubmit={(event: FormEvent) => { event.preventDefault(); save.mutate() }}
            className="relative flex h-full w-full max-w-[var(--app-width)] flex-col overflow-hidden bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <h2 className="text-xl font-black">QR event settings</h2>
                <p className="text-xs text-neutral-500">{editing.title}</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="grid size-10 place-items-center rounded-full border border-neutral-200"><X /></button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <RegistrationQrCard event={editing} enabled={form.registration_enabled} />

              <label className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
                <span>
                  <span className="block font-semibold">Enable QR pass registration</span>
                  <span className="mt-1 block text-xs text-neutral-500">Guests register → POV generates their confirmation QR → staff scans it.</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.registration_enabled}
                  onChange={event => setForm(current => current ? { ...current, registration_enabled: event.target.checked } : current)}
                  className="size-5 accent-orange-500"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
                <span>
                  <span className="block font-semibold">Show registration popup</span>
                  <span className="mt-1 block text-xs text-neutral-500">Dismissible form with X on Home and other public pages.</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.show_registration_popup}
                  onChange={event => setForm(current => current ? { ...current, show_registration_popup: event.target.checked } : current)}
                  className="size-5 accent-orange-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">Popup delay (seconds)</span>
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={form.registration_popup_delay_seconds}
                  onChange={event => setForm(current => current ? { ...current, registration_popup_delay_seconds: Number(event.target.value) } : current)}
                  className="focus-ring h-12 w-full rounded-xl border border-neutral-200 px-4 outline-none"
                />
                <span className="mt-1.5 block text-xs text-neutral-500">0 = show immediately. Max 300.</span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">Registration status label</span>
                <input
                  type="text"
                  value={form.registration_status_label}
                  onChange={event => setForm(current => current ? { ...current, registration_status_label: event.target.value } : current)}
                  placeholder="Upcoming event"
                  className="focus-ring h-12 w-full rounded-xl border border-neutral-200 px-4 outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">Pass brand label</span>
                <input
                  type="text"
                  value={form.pass_brand_label}
                  onChange={event => setForm(current => current ? { ...current, pass_brand_label: event.target.value } : current)}
                  placeholder="POV"
                  className="focus-ring h-12 w-full rounded-xl border border-neutral-200 px-4 outline-none"
                />
                <span className="mt-1.5 block text-xs text-neutral-500">Shown on the pass and used as the pass code prefix.</span>
              </label>

              <ImageUploader
                label="QR pass poster (square)"
                folder="events"
                value={form.poster_image_url}
                onChange={url => setForm(current => current ? { ...current, poster_image_url: url } : current)}
              />

              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save QR settings'}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function RegistrationQrCard({ event, enabled }: { event: Event; enabled: boolean }) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const registerUrl = eventRegisterUrl(event.slug)

  const download = async () => {
    if (!nodeRef.current) return
    setBusy(true)
    setNote('')
    try {
      const dataUrl = await toPng(nodeRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = `${event.slug || 'event'}-registration-qr.png`
      link.href = dataUrl
      link.click()
      setNote('Registration QR saved. Print or share so guests can open the form.')
    } catch {
      setNote('Unable to save the image. Copy the registration link instead.')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(registerUrl)
      setNote('Registration link copied.')
    } catch {
      setNote(registerUrl)
    }
  }

  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-orange-500">1 · Registration QR</p>
      <p className="mt-1 text-sm font-semibold text-neutral-800">POV-generated — guests scan this to register</p>
      <p className="mt-1 text-xs text-neutral-500">
        After they submit, POV creates their personal confirmation QR for Staff Console check-in.
      </p>

      {!enabled && (
        <p className="mt-3 rounded-xl bg-white/80 p-3 text-xs text-neutral-500">
          Turn on <strong>Enable QR pass registration</strong> and save to use this QR live.
        </p>
      )}

      <div ref={nodeRef} className="mx-auto mt-4 w-fit rounded-2xl bg-white p-5 text-center">
        <p className="text-xs font-black uppercase tracking-[.18em] text-orange-500">POV</p>
        <p className="mt-1 text-sm font-bold">{event.title}</p>
        <div className="mx-auto mt-3 grid place-items-center">
          <QRCodeSVG value={registerUrl} size={168} level="M" includeMargin={false} />
        </div>
        <p className="mt-3 text-[10px] text-neutral-500">Scan to get your QR pass</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void download()}
          disabled={busy}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-orange-500 text-sm font-bold text-white disabled:opacity-60"
        >
          <Download size={16} />{busy ? 'Saving…' : 'Download QR'}
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-bold"
        >
          Copy link
        </button>
      </div>
      {note && <p className="mt-2 text-xs text-neutral-600">{note}</p>}
    </div>
  )
}
