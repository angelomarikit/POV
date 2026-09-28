import { CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { EventCard, VideoCard } from '../components/public/Cards'
import { EmptyState, LoadingGrid, MessengerCTA, YouTubeEmbed } from '../components/common/UI'
import { getEvents, getLibraryVideos, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { PageIntro } from './PageIntro'

export default function EventsPage() {
  const [eventsQuery, videosQuery] = useQueries({ queries: [
    { queryKey: queryKeys.events, queryFn: () => getEvents(), enabled: isSupabaseConfigured, retry: false },
    { queryKey: [...queryKeys.videos, 'library'], queryFn: () => getLibraryVideos(), enabled: isSupabaseConfigured, retry: false },
  ] })
  const events = eventsQuery.data || []
  const videos = videosQuery.data || []
  const isLoading = eventsQuery.isLoading || videosQuery.isLoading
  const upcoming = events.filter(event => event.status === 'upcoming' || new Date(event.start_date) > new Date())
  const past = events.filter(event => !upcoming.includes(event))
  const featured = videos.find(video => video.featured)
  const rest = featured ? videos.filter(video => video.id !== featured.id) : videos

  return <>
    <PageIntro eyebrow="Learn. Connect. Act." title="Events built for real momentum." description="Gatherings, forums, and community activities — plus a library of published training videos." icon={<CalendarDays />} />
    <section className="px-5 py-7">
      {isLoading ? <LoadingGrid count={3} /> : <>
        {events.length ? <div className="space-y-9">
          {upcoming.length > 0 && <div>
            <h2 className="mb-4 text-lg font-black tracking-tight">Upcoming and ongoing</h2>
            <div className="grid gap-4">{upcoming.map(event => <EventCard key={event.id} event={event} />)}</div>
          </div>}
          {past.length > 0 && <div>
            <h2 className="mb-4 text-lg font-black tracking-tight">Past events</h2>
            <div className="grid gap-4">{past.map(event => <EventCard key={event.id} event={event} />)}</div>
          </div>}
        </div> : <EmptyState title="No events published yet" description="New community events will appear here when announced." />}

        <div className="mt-8 rounded-3xl border border-orange-200 bg-orange-50 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-700">Know More About POV</p>
          <h2 className="mt-2 text-lg font-black">Schedule the Pinoy Online Venture presentation</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">Choose a time, watch testimonials while you wait, then unlock the main presentation.</p>
          <Link to="/know-more" className="focus-ring mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-bold text-white">Schedule presentation</Link>
        </div>

        <div id="videos" className="scroll-mt-6 mt-10">
          <h2 className="text-lg font-black tracking-tight">Community video library</h2>
          <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">Published general videos from the community. For the scheduled POV presentation, open Know More About POV.</p>
          {videos.length ? <div className="mt-5 space-y-4">
            {featured && <article className="overflow-hidden rounded-3xl bg-[#101012] p-3 text-white">
              <YouTubeEmbed url={featured.youtube_url} title={featured.title} poster={featured.thumbnail_url} />
              <div className="p-3">
                <p className="eyebrow">Featured video</p>
                <h3 className="mt-2 text-xl font-black tracking-tight">{featured.title}</h3>
                {featured.description && <p className="mt-2 text-sm leading-6 text-neutral-400">{featured.description}</p>}
                <div className="mt-5"><MessengerCTA label={featured.cta_label} url={featured.cta_url} /></div>
              </div>
            </article>}
            {rest.length > 0 && <div className="grid gap-4">{rest.map(video => <VideoCard key={video.id} video={video} />)}</div>}
          </div> : <div className="mt-4"><EmptyState title="No library videos yet" description="General community videos will appear here when published." /></div>}
        </div>
      </>}
    </section>
  </>
}
