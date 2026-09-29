import { ArrowRight, CalendarClock, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { MessengerCTA } from '../components/common/UI'
import { getSiteContent, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { SOCIAL_DEFAULTS } from '../config/site'

function paragraphs(text: string | null | undefined, fallback: string[]) {
  const parts = (text || '').split(/\n\s*\n/).map(part => part.trim()).filter(Boolean)
  return parts.length ? parts : fallback
}

const DEFAULT_ABOUT_INTRO = [
  'Pinoy Online Venture (POV) is a growing community designed to help Filipinos explore the opportunities of the online world, develop valuable digital skills, and build a mindset focused on growth and purposeful entrepreneurship.',
  'We believe that everyone deserves an opportunity to learn, grow, and create possibilities online—whether you are an employee, OFW, student, parent, professional, or aspiring entrepreneur.',
  'Through the POV Community, we provide access to learning sessions, mentorship, community support, digital tools, business education, and practical strategies that can help members take meaningful steps toward their personal and entrepreneurial goals.',
]

const DEFAULT_STAND_FOR = [
  'We encourage our members to continuously develop their skills, build meaningful connections, take consistent action, and support one another along the journey.',
  'POV is more than just a community. It is a space where ideas become action, skills become opportunities, and people grow together.',
  'Welcome to POV Community — your online journey starts here.',
]

export default function HomePage() {
  const { data: content = [] } = useQuery({
    queryKey: queryKeys.content,
    queryFn: getSiteContent,
    enabled: isSupabaseConfigured,
    retry: false,
  })
  const section = (key: string) => content.find(item => item.section_key === key)
  const hero = section('hero')
  const about = section('about_us')
  const purpose = section('about_purpose')
  const standFor = section('about_stand_for')
  const knowMore = section('know_more_promo')
  const cta = section('cta')

  const aboutParas = paragraphs(about?.body, DEFAULT_ABOUT_INTRO)
  const standParas = paragraphs(standFor?.body, DEFAULT_STAND_FOR)
  const welcome = standParas[standParas.length - 1]
  const standBody = standParas.length > 1 ? standParas.slice(0, -1) : standParas

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
          <Link to="/know-more" className="focus-ring inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 font-bold backdrop-blur transition active:scale-[.98]"><CalendarClock size={17} />Know More About POV</Link>
        </div>
      </motion.div>
    </section>

    {(about?.is_active !== false) && <section className="px-5 py-9">
      <p className="eyebrow">{about?.subtitle || 'About Us'}</p>
      <h2 className="heading-section mt-2 text-balance">{about?.title || 'Pinoy Online Venture (POV) Community'}</h2>
      <div className="mt-5 space-y-4 text-[15px] leading-7 text-[var(--text-secondary)]">
        {aboutParas.map(para => <p key={para.slice(0, 48)}>{para}</p>)}
      </div>

      {(purpose?.is_active !== false) && <div className="mt-8 border-t border-[var(--border)] pt-7">
        <p className="eyebrow">{purpose?.title || 'Our Purpose'}</p>
        <p className="mt-3 text-[15px] leading-7 text-[var(--text-primary)]">{purpose?.body || 'To build a community where Filipinos can learn, connect, take action, and grow together in the digital economy.'}</p>
      </div>}

      {(standFor?.is_active !== false) && <div className="mt-8 border-t border-[var(--border)] pt-7">
        <p className="eyebrow">{standFor?.title || 'What We Stand For'}</p>
        <p className="mt-3 text-lg font-black tracking-tight text-[var(--text-primary)]">{standFor?.subtitle || 'Learn. Connect. Take Action. Grow.'}</p>
        <div className="mt-4 space-y-4 text-[15px] leading-7 text-[var(--text-secondary)]">
          {standBody.map(para => <p key={para.slice(0, 48)}>{para}</p>)}
          {standParas.length > 1 && <p className="font-semibold text-[var(--text-primary)]">{welcome}</p>}
        </div>
      </div>}
    </section>}

    {(knowMore?.is_active !== false) && <section className="bg-[#101012] px-5 py-9 text-white">
      <p className="eyebrow !text-orange-400">{knowMore?.subtitle || 'Discover Pinoy Online Venture'}</p>
      <h2 className="mt-1.5 text-[22px] font-black leading-tight tracking-tight">{knowMore?.title || 'Know More About POV'}</h2>
      <p className="mt-3 text-sm leading-6 text-neutral-400">{knowMore?.body || 'Discover our community, hear real stories from our members, and watch the Pinoy Online Venture presentation at a time that works for you.'}</p>
      <Link to={knowMore?.button_url || '/know-more'} className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 font-bold text-white transition active:scale-[.98]"><CalendarClock size={17} />{knowMore?.button_text || 'Know More About POV'}</Link>
    </section>}

    <section className="px-5 py-9">
      <div className="rounded-3xl bg-orange-500 p-7 text-white">
        <h2 className="text-2xl font-black leading-tight tracking-tight">{cta?.title || 'Ready to connect with the community?'}</h2>
        <p className="mt-3 text-sm leading-6 text-orange-50">{cta?.body || 'Start a conversation, learn more about Pinoy Online Venture, and find your next opportunity.'}</p>
        <div className="mt-6"><MessengerCTA label={cta?.button_text || 'Message Pinoy Online Venture'} url={cta?.button_url || SOCIAL_DEFAULTS.facebook} variant="secondary" /></div>
      </div>
    </section>
  </>
}
