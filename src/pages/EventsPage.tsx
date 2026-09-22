import { CalendarDays } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { EventCard, VideoCard } from '../components/public/Cards'
import { EmptyState, LoadingGrid, MessengerCTA, YouTubeEmbed } from '../components/common/UI'
import { getEvents, getVideos, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { PageIntro } from './PageIntro'

export default function EventsPage() {
  const [eventsQuery, videosQuery] = useQueries({ queries: [
    { queryKey: queryKeys.events, queryFn: () => getEvents(), enabled: isSupabaseConfigured, retry: false },
    { queryKey: queryKeys.videos, queryFn: () => getVideos(), enabled: isSupabaseConfigured, retry: false },
  ] })
  const events = eventsQuery.data || []
  const videos = videosQuery.data || []
  const isLoading = eventsQuery.isLoading || videosQuery.isLoading
  const upcoming = events.filter(event => event.status === 'upcoming' || new Date(event.start_date) > new Date())
  const past = events.filter(event => !upcoming.includes(event))
  const featured = videos.find(video => video.featured)
  const rest = featured ? videos.filter(video => video.id !== featured.id) : videos

  return <>
    <PageIntro eyebrow="Learn. Connect. Act." title="Events and videos in one place." description="Gatherings, forums, and community videos — watch and join without leaving the app." icon={<CalendarDays />} />
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

        <div id="videos" className="scroll-mt-6 mt-10">
          <h2 className="text-lg font-black tracking-tight">Video library</h2>
          <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">Training, events, business insights, and community stories. Tap play to watch here.</p>
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
          </div> : <div className="mt-4"><EmptyState title="No videos published yet" description="Community stories and learning sessions will appear here." /></div>}
        </div>
      </>}
    </section>
  </>
}
