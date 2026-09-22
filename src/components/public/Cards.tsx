import { CalendarDays, MapPin, MoveUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import type { Event, Member, Video } from '../../types'
import { MessengerCTA, YouTubeEmbed } from '../common/UI'

const FALLBACK = '/pov-logo.png'

export function MemberCard({ member }: { member: Member }) {
  return <Link to={`/community/${member.slug}`} className="card group block overflow-hidden transition duration-200 active:scale-[.99]">
    <div className="relative aspect-[4/4.2] overflow-hidden bg-neutral-100">
      <img src={member.profile_image_url || FALLBACK} alt={member.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.035]" />
      {member.member_categories && <span className="absolute left-4 top-4 rounded-full bg-black/75 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">{member.member_categories.name}</span>}
    </div>
    <div className="flex items-end justify-between gap-4 p-5">
      <div><h3 className="text-xl font-extrabold tracking-tight">{member.name}</h3><p className="mt-1 text-sm text-[var(--text-secondary)]">{member.role || 'Community member'}</p></div>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white"><MoveUpRight size={18} /></span>
    </div>
  </Link>
}

export function EventCard({ event }: { event: Event }) {
  const status = event.status || getEventStatus(event)
  return <Link to={`/events/${event.slug}`} className="card group block overflow-hidden transition duration-200 active:scale-[.99]">
    <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
      <img src={event.cover_image_url || '/brand/forum-wide.jpg'} alt={event.title} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.035]" />
      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-orange-700">{status}</span>
    </div>
    <div className="p-5">
      <div className="mb-3 flex flex-wrap gap-3 text-xs font-semibold text-neutral-500"><span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{format(new Date(event.start_date), 'MMM d, yyyy')}</span>{event.location && <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{event.location}</span>}</div>
      <h3 className="text-xl font-extrabold tracking-tight">{event.title}</h3>
      {event.short_description && <p className="line-clamp-2 mt-2 text-sm leading-6 text-[var(--text-secondary)]">{event.short_description}</p>}
    </div>
  </Link>
}

function getEventStatus(event: Event) {
  const now = Date.now()
  const start = new Date(event.start_date).getTime()
  const end = event.end_date ? new Date(event.end_date).getTime() : start + 86400000
  return now < start ? 'upcoming' : now <= end ? 'ongoing' : 'completed'
}

export function VideoCard({ video }: { video: Video }) {
  return <article className="card overflow-hidden">
    <YouTubeEmbed url={video.youtube_url} title={video.title} poster={video.thumbnail_url} rounded={false} />
    <div className="p-5">
      <h3 className="text-xl font-extrabold tracking-tight">{video.title}</h3>
      {video.description && <p className="line-clamp-2 mt-2 text-sm leading-6 text-[var(--text-secondary)]">{video.description}</p>}
      <MessengerCTA label={video.cta_label} url={video.cta_url} className="mt-5 w-full" />
    </div>
  </article>
}
