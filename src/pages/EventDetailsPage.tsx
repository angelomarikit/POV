import { CalendarDays, Clock3, ExternalLink, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessengerCTA } from '../components/common/UI'
import { getEventBySlug } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import NotFoundPage from './NotFoundPage'

export default function EventDetailsPage() {
  const { slug = '' } = useParams()
  const { data: event, isLoading } = useQuery({ queryKey: ['event', slug], queryFn: () => getEventBySlug(slug), enabled: isSupabaseConfigured, retry: false })
  useDocumentMeta(event?.title || 'Community Event', event?.short_description || undefined, event?.cover_image_url)

  if (isLoading) return <div className="px-5 py-6"><div className="skeleton aspect-video rounded-3xl" /><div className="skeleton mt-5 h-8 w-3/4 rounded" /><div className="skeleton mt-3 h-4 rounded" /></div>
  if (!event) return <NotFoundPage compact title="Event not found" />

  return <article>
    <div className="relative aspect-[4/3] bg-black">
      <img src={event.cover_image_url || '/brand/forum-wide.jpg'} alt="" className="size-full object-cover opacity-75" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-5 pt-20 text-white">
        <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider">{event.status || 'Event'}</span>
        <h1 className="mt-3 text-[26px] font-black leading-tight tracking-tight">{event.title}</h1>
      </div>
    </div>

    <div className="px-5 py-7">
      <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 text-[15px]">
        <span className="flex items-center gap-3 font-semibold"><CalendarDays size={19} className="text-orange-600" />{format(new Date(event.start_date), 'MMMM d, yyyy')}</span>
        <span className="flex items-center gap-3 font-semibold"><Clock3 size={19} className="text-orange-600" />{format(new Date(event.start_date), 'h:mm a')}</span>
        {event.location && <span className="flex items-center gap-3 font-semibold"><MapPin size={19} className="text-orange-600" />{event.location}</span>}
        {event.maps_url && <a href={event.maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-semibold text-orange-700"><ExternalLink size={19} />Open map</a>}
      </div>

      {event.description && <p className="mt-7 whitespace-pre-line text-[15px] leading-7 text-[var(--text-secondary)]">{event.description}</p>}

      {event.event_gallery?.length ? <div className="mt-8 grid grid-cols-2 gap-2.5">
        {event.event_gallery.map((image, index) => <figure key={image.id} className={index % 3 === 0 ? 'col-span-2' : ''}>
          <img src={image.image_url} alt={image.caption || event.title} loading="lazy" className="aspect-video size-full rounded-2xl object-cover" />
          {image.caption && <figcaption className="mt-1.5 text-xs text-neutral-500">{image.caption}</figcaption>}
        </figure>)}
      </div> : null}

      <div className="mt-9 rounded-3xl bg-[#101012] p-6 text-white">
        <h2 className="text-lg font-black">Interested in this event?</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">Connect with the team for details, registration, or questions.</p>
        <div className="mt-5"><MessengerCTA label={event.cta_label || 'Message us'} url={event.cta_url} /></div>
      </div>
    </div>
  </article>
}
