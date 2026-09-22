import { CalendarDays, Image, PlaySquare, Users } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getEvents, getGallery, getMembers, getVideos, queryKeys } from '../../services/content'

export default function AdminDashboardPage() {
  const results = useQueries({ queries: [
    { queryKey: [...queryKeys.members, 'admin'], queryFn: () => getMembers(true) },
    { queryKey: [...queryKeys.events, 'admin'], queryFn: () => getEvents(true) },
    { queryKey: [...queryKeys.videos, 'admin'], queryFn: () => getVideos(true) },
    { queryKey: [...queryKeys.gallery, 'admin'], queryFn: getGallery },
  ] })
  const members = results[0].data || []
  const events = results[1].data || []
  const videos = results[2].data || []
  const gallery = results[3].data || []
  const cards = [
    { label: 'Total members', value: members.length, icon: Users, to: '/admin/members' },
    { label: 'Upcoming events', value: events.filter(e => new Date(e.start_date) > new Date()).length, icon: CalendarDays, to: '/admin/events' },
    { label: 'Published videos', value: videos.filter(v => v.is_published).length, icon: PlaySquare, to: '/admin/videos' },
    { label: 'Gallery images', value: gallery.length, icon: Image, to: '/admin/gallery' },
  ]
  return <div>
    <div className="mb-6">
      <p className="text-sm font-bold text-orange-600">Overview</p>
      <h1 className="mt-1 text-2xl font-black tracking-tight">Community dashboard</h1>
      <p className="mt-1.5 text-sm text-neutral-500">A quick look at what is published across the app.</p>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {cards.map(({ label, value, icon: Icon, to }) => <Link to={to} key={label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition active:scale-[.98]">
        <span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-600"><Icon size={19} /></span>
        <strong className="mt-4 block text-2xl font-black">{value}</strong>
        <span className="mt-0.5 block text-xs text-neutral-500">{label}</span>
      </Link>)}
    </div>
    <div className="mt-5 grid gap-4">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-black">Recently added members</h2>
        {members.length ? <div className="mt-3 divide-y divide-neutral-100">{members.slice(0, 5).map(member => <div key={member.id} className="flex items-center gap-3 py-3">
          <img src={member.profile_image_url || '/pov-logo.png'} alt="" className="size-10 rounded-full object-cover" />
          <div><strong className="block text-sm">{member.name}</strong><span className="text-xs text-neutral-500">{member.role || 'Community member'}</span></div>
        </div>)}</div> : <FirstRun text="No community members yet." to="/admin/members" label="Add your first member" />}
      </section>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-black">Upcoming events</h2>
        {events.length ? <div className="mt-3 divide-y divide-neutral-100">{events.slice(0, 5).map(event => <div key={event.id} className="py-3">
          <strong className="block text-sm">{event.title}</strong><span className="text-xs text-neutral-500">{new Date(event.start_date).toLocaleString()}</span>
        </div>)}</div> : <FirstRun text="No events yet." to="/admin/events" label="Create your first event" />}
      </section>
    </div>
  </div>
}

function FirstRun({ text, to, label }: { text: string; to: string; label: string }) {
  return <div className="mt-5 rounded-xl bg-neutral-50 p-6 text-center"><p className="text-sm text-neutral-500">{text}</p><Link to={to} className="mt-3 inline-block text-sm font-bold text-orange-700">+ {label}</Link></div>
}
