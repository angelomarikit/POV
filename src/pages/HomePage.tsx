import { ArrowRight, ChevronRight, Play, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQueries } from '@tanstack/react-query'
import { EventCard, MemberCard, VideoCard } from '../components/public/Cards'
import { EmptyState, MessengerCTA } from '../components/common/UI'
import { getEvents, getGallery, getMembers, getSiteContent, getVideos, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { SOCIAL_DEFAULTS } from '../config/site'

const reveal = { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: .45 } }

function ScreenSection({ eyebrow, title, to, action, children }: { eyebrow: string; title: string; to?: string; action?: string; children: React.ReactNode }) {
  return <motion.section {...reveal} className="px-5 py-8">
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-1.5 text-[22px] font-black leading-tight tracking-tight">{title}</h2>
      </div>
      {to && <Link to={to} className="focus-ring inline-flex shrink-0 items-center gap-0.5 rounded-full text-sm font-bold text-orange-700">{action || 'See all'}<ChevronRight size={16} /></Link>}
    </div>
    {children}
  </motion.section>
}

function Rail({ children }: { children: React.ReactNode }) {
  return <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
}

export default function HomePage() {
  const results = useQueries({ queries: [
    { queryKey: queryKeys.content, queryFn: getSiteContent, enabled: isSupabaseConfigured, retry: false },
    { queryKey: queryKeys.members, queryFn: () => getMembers(), enabled: isSupabaseConfigured, retry: false },
    { queryKey: queryKeys.events, queryFn: () => getEvents(), enabled: isSupabaseConfigured, retry: false },
    { queryKey: queryKeys.videos, queryFn: () => getVideos(), enabled: isSupabaseConfigured, retry: false },
    { queryKey: queryKeys.gallery, queryFn: getGallery, enabled: isSupabaseConfigured, retry: false },
  ] })
  const content = results[0].data || []
  const members = results[1].data || []
  const events = results[2].data || []
  const videos = results[3].data || []
  const gallery = results[4].data || []
  const hero = content.find(item => item.section_key === 'hero')
  const intro = content.find(item => item.section_key === 'about_intro')
  const cta = content.find(item => item.section_key === 'cta')
  const featured = members.filter(member => member.featured)
  const hasStats = members.length > 0 || events.length > 0 || videos.length > 0

  return <>
    <section className="relative isolate overflow-hidden bg-[#0b0b0c] px-5 pb-10 pt-8 text-white">
      <div className="absolute inset-0 -z-10">
        <img src={hero?.image_url || '/brand/forum-wide.jpg'} alt="" className="size-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/95" />
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] backdrop-blur"><Sparkles size={13} className="text-orange-400" />People. Opportunity. Growth.</span>
        <h1 className="heading-display mt-5 text-balance">{hero?.title || 'Where Filipino ambition becomes shared momentum.'}</h1>
        <p className="mt-4 text-[15px] leading-7 text-neutral-300">{hero?.subtitle || 'Meet the people, ideas, events, and real stories powering the Pinoy Online Venture community.'}</p>
        <div className="mt-7 grid gap-2.5">
          <Link to={hero?.button_url || '/community'} className="focus-ring inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-orange-500 font-bold text-white transition active:scale-[.98]">{hero?.button_text || 'Explore our community'}<ArrowRight size={18} /></Link>
          <Link to="/videos" className="focus-ring inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 font-bold backdrop-blur transition active:scale-[.98]"><Play size={17} />Video Library</Link>
        </div>
      </motion.div>
    </section>

    {hasStats && <section className="grid grid-cols-3 divide-x divide-[var(--border)] border-b border-[var(--border)] bg-white py-5 text-center">
      <div><strong className="block text-2xl font-black">{members.length}</strong><span className="mt-0.5 block text-[11px] text-neutral-500">Members</span></div>
      <div><strong className="block text-2xl font-black">{events.length}</strong><span className="mt-0.5 block text-[11px] text-neutral-500">Events</span></div>
      <div><strong className="block text-2xl font-black">{videos.length}</strong><span className="mt-0.5 block text-[11px] text-neutral-500">Videos</span></div>
    </section>}

    <motion.section {...reveal} className="px-5 py-8">
      <img src={intro?.image_url || '/brand/executive-edge.png'} alt="Pinoy Online Venture community" className="aspect-[4/3] w-full rounded-3xl object-cover" />
      <p className="eyebrow mt-6">A community in motion</p>
      <h2 className="heading-section mt-2">{intro?.title || 'Real people building better opportunities together.'}</h2>
      <p className="mt-4 text-[15px] leading-7 text-[var(--text-secondary)]">{intro?.body || 'Pinoy Online Venture brings aspiring entrepreneurs, mentors, leaders, and partners into one active community—making learning, connection, and collaboration more accessible.'}</p>
      <Link to="/about" className="mt-5 inline-flex items-center gap-1.5 font-bold text-orange-700">Discover our story<ArrowRight size={17} /></Link>
    </motion.section>

    <ScreenSection eyebrow="People of POV" title="Meet the community" to="/community" action="See all">
      {featured.length ? <Rail>{featured.slice(0, 6).map(member => <div key={member.id} className={`shrink-0 snap-start ${featured.length === 1 ? 'w-full' : 'w-[72%]'}`}><MemberCard member={member} /></div>)}</Rail>
        : <EmptyState title="Community profiles are coming" description="Featured members will appear here as soon as they are published." />}
    </ScreenSection>

    {gallery.length > 0 && <ScreenSection eyebrow="Inside the community" title="Moments that move us forward">
      <div className="grid grid-cols-2 gap-2.5">
        {gallery.slice(0, 5).map((item, index) => <figure key={item.id} className={`relative overflow-hidden rounded-2xl ${index === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-square'}`}>
          <img src={item.image_url} alt={item.caption || item.title || 'Community activity'} loading="lazy" className="size-full object-cover" />
          {(item.title || item.caption) && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 pt-10 text-xs font-bold text-white">{item.title || item.caption}</figcaption>}
        </figure>)}
      </div>
    </ScreenSection>}

    <ScreenSection eyebrow="What's happening" title="Community events" to="/events">
      {events.length ? <div className="grid gap-4">{events.slice(0, 2).map(event => <EventCard key={event.id} event={event} />)}</div>
        : <EmptyState title="No published events yet" description="Upcoming community events will be announced here." />}
    </ScreenSection>

    <section className="bg-[#101012] px-5 py-9 text-white">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div><p className="eyebrow">Watch and learn</p><h2 className="mt-1.5 text-[22px] font-black leading-tight tracking-tight">Stories and insight</h2></div>
        <Link to="/videos" className="inline-flex shrink-0 items-center gap-0.5 text-sm font-bold text-orange-400">See all<ChevronRight size={16} /></Link>
      </div>
      {videos.length ? <Rail>{videos.slice(0, 5).map(video => <div key={video.id} className={`shrink-0 snap-start ${videos.length === 1 ? 'w-full' : 'w-[85%]'}`}><VideoCard video={video} /></div>)}</Rail>
        : <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-neutral-400"><Play className="mx-auto mb-3 text-orange-500" />Videos will appear here when published.</div>}
    </section>

    <section className="px-5 py-9">
      <div className="rounded-3xl bg-orange-500 p-7 text-white">
        <h2 className="text-2xl font-black leading-tight tracking-tight">{cta?.title || 'Ready to connect with the community?'}</h2>
        <p className="mt-3 text-sm leading-6 text-orange-50">{cta?.body || 'Start a conversation, learn more about Pinoy Online Venture, and find your next opportunity.'}</p>
        <div className="mt-6"><MessengerCTA label={cta?.button_text || 'Message Pinoy Online Venture'} url={cta?.button_url || SOCIAL_DEFAULTS.facebook} variant="secondary" /></div>
      </div>
    </section>
  </>
}
