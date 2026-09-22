import { CalendarDays } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { EventCard } from '../components/public/Cards'
import { EmptyState, LoadingGrid } from '../components/common/UI'
import { getEvents, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { PageIntro } from './PageIntro'

export default function EventsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: queryKeys.events, queryFn: () => getEvents(), enabled: isSupabaseConfigured, retry: false })
  const upcoming = data.filter(event => event.status === 'upcoming' || new Date(event.start_date) > new Date())
  const past = data.filter(event => !upcoming.includes(event))

  return <>
    <PageIntro eyebrow="Learn. Connect. Act." title="Events built for real momentum." description="Gatherings, forums, and activities bringing the community together." icon={<CalendarDays />} />
    <section className="px-5 py-7">
      {isLoading ? <LoadingGrid count={3} /> : data.length ? <div className="space-y-9">
        {upcoming.length > 0 && <div>
          <h2 className="mb-4 text-lg font-black tracking-tight">Upcoming and ongoing</h2>
          <div className="grid gap-4">{upcoming.map(event => <EventCard key={event.id} event={event} />)}</div>
        </div>}
        {past.length > 0 && <div>
          <h2 className="mb-4 text-lg font-black tracking-tight">Past events</h2>
          <div className="grid gap-4">{past.map(event => <EventCard key={event.id} event={event} />)}</div>
        </div>}
      </div> : <EmptyState title="No events published yet" description="New community events will appear here when announced." />}
    </section>
  </>
}
