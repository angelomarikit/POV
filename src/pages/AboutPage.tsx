import { Compass, Eye, HeartHandshake, Info, Lightbulb, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getSiteContent, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { PageIntro } from './PageIntro'

const values = [
  { icon: Users, title: 'People first', body: 'Community starts with trust, respect, and real human connection.' },
  { icon: Lightbulb, title: 'Practical learning', body: 'Ideas matter most when they help people make meaningful progress.' },
  { icon: HeartHandshake, title: 'Shared success', body: 'We create more opportunity when we build with one another.' },
]

export default function AboutPage() {
  const { data = [] } = useQuery({ queryKey: queryKeys.content, queryFn: getSiteContent, enabled: isSupabaseConfigured, retry: false })
  const section = (key: string) => data.find(item => item.section_key === key)
  const story = section('about_story')
  const mission = section('mission')
  const vision = section('vision')

  return <>
    <PageIntro eyebrow="About POV" title="A community designed around shared growth." description="The purpose, values, and people-first thinking behind Pinoy Online Venture." icon={<Info />} />
    <section className="px-5 py-8">
      <img src={story?.image_url || '/brand/forum-wide.jpg'} alt="Pinoy Online Venture community" className="aspect-[4/3] w-full rounded-3xl object-cover" />
      <p className="eyebrow mt-6">Our story</p>
      <h2 className="heading-section mt-2">{story?.title || 'Opportunity grows when people grow together.'}</h2>
      <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[var(--text-secondary)]">{story?.body || 'Pinoy Online Venture is a Filipino community centered on connection, practical learning, and meaningful opportunity. This platform brings the real people, activities, events, and stories of the organization into one accessible place.'}</p>
    </section>

    <section className="grid gap-4 bg-[var(--muted)] px-5 py-8">
      <div className="card p-6">
        <Compass className="text-orange-600" size={28} />
        <p className="eyebrow mt-5">Mission</p>
        <h2 className="mt-2 text-xl font-black tracking-tight">{mission?.title || 'Create access to learning and connection.'}</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{mission?.body || 'Our detailed mission statement will be shared here by the Pinoy Online Venture team.'}</p>
      </div>
      <div className="card p-6">
        <Eye className="text-orange-600" size={28} />
        <p className="eyebrow mt-5">Vision</p>
        <h2 className="mt-2 text-xl font-black tracking-tight">{vision?.title || 'Build a stronger Filipino entrepreneurial community.'}</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{vision?.body || 'Our detailed vision statement will be shared here by the Pinoy Online Venture team.'}</p>
      </div>
    </section>

    <section className="px-5 py-8">
      <p className="eyebrow">Community philosophy</p>
      <h2 className="heading-section mt-2">What guides the way we show up</h2>
      <div className="mt-6 grid gap-3">
        {values.map(item => <div key={item.title} className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <item.icon className="text-orange-600" size={22} />
          <h3 className="mt-4 text-lg font-black">{item.title}</h3>
          <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">{item.body}</p>
        </div>)}
      </div>
    </section>
  </>
}
