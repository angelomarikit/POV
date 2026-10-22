import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { getEvents, queryKeys } from '../../services/content'
import { isSupabaseConfigured } from '../../lib/supabase'
import type { Event } from '../../types'

function homepageQrEvents(events: Event[]) {
  return events.filter(event => event.registration_enabled && event.show_registration_popup)
}

export function HomeQrEventsSection() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: queryKeys.events,
    queryFn: () => getEvents(),
    enabled: isSupabaseConfigured,
    retry: false,
  })
  const qrEvents = homepageQrEvents(events)

  if (isLoading || !qrEvents.length) return null

  return (
    <section className="px-5 py-9" aria-labelledby="home-qr-events-heading">
      <p className="eyebrow">QR Events</p>
      <h2 id="home-qr-events-heading" className="heading-section mt-2 text-balance">
        Get your QR pass
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        Register for an upcoming POV event and receive your confirmation QR for entrance check-in.
      </p>

      <div className="mt-6 space-y-4">
        {qrEvents.map(event => (
          <article key={event.id} className="rounded-2xl border border-orange-200 bg-white p-4">
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-orange-500">
                  <span className="size-1.5 rounded-full bg-orange-500" />
                  {event.registration_status_label || 'Event registration open'}
                </p>
                <h3 className="mt-2 text-xl font-black uppercase tracking-tight">{event.title}</h3>
                <p className="mt-3 flex items-start gap-2 text-sm text-neutral-600">
                  <CalendarDays size={16} className="mt-0.5 shrink-0" />
                  {format(new Date(event.start_date), 'EEE, MMM d, yyyy, h:mm a')}
                </p>
                {event.location && (
                  <p className="mt-2 flex items-start gap-2 text-sm uppercase text-neutral-600">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    {event.location}
                  </p>
                )}
              </div>
              {(event.poster_image_url || event.cover_image_url) && (
                <img
                  src={event.poster_image_url || event.cover_image_url || ''}
                  alt=""
                  className="size-20 shrink-0 rounded-xl object-cover"
                />
              )}
            </div>
            {(event.short_description || event.description) && (
              <p className="mt-4 line-clamp-4 text-sm leading-6 text-neutral-700 whitespace-pre-line">
                {event.short_description || event.description}
              </p>
            )}
            <Link
              to={`/events/${event.slug}/register`}
              className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 font-bold text-white"
            >
              Get Your QR Pass <ArrowRight size={18} />
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
