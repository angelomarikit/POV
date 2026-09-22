import { BriefcaseBusiness, Globe, MapPin, MessageCircle, Music2, PlaySquare } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessengerCTA } from '../components/common/UI'
import { getMemberBySlug } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import NotFoundPage from './NotFoundPage'

export default function MemberProfilePage() {
  const { slug = '' } = useParams()
  const { data: member, isLoading } = useQuery({ queryKey: ['member', slug], queryFn: () => getMemberBySlug(slug), enabled: isSupabaseConfigured, retry: false })
  useDocumentMeta(member?.name || 'Community Member', member?.short_description || undefined, member?.profile_image_url)

  if (isLoading) return <div className="px-5 py-6"><div className="skeleton aspect-square rounded-3xl" /><div className="skeleton mt-5 h-8 w-2/3 rounded" /><div className="skeleton mt-3 h-4 rounded" /></div>
  if (!member) return <NotFoundPage compact title="Member not found" />

  const socials = [
    { url: member.facebook_url, label: 'Facebook', icon: MessageCircle },
    { url: member.tiktok_url, label: 'TikTok', icon: Music2 },
    { url: member.youtube_url, label: 'YouTube', icon: PlaySquare },
    { url: member.website_url, label: 'Website', icon: Globe },
  ].filter(item => item.url)

  return <article>
    <div className="relative aspect-[4/4.4] bg-neutral-100">
      <img src={member.profile_image_url || '/pov-logo.png'} alt={member.name} className="size-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-20 text-white">
        {member.member_categories && <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">{member.member_categories.name}</span>}
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight">{member.name}</h1>
        {member.role && <p className="mt-1 text-sm font-semibold text-orange-300">{member.role}</p>}
      </div>
    </div>
    <div className="px-5 py-7">
      <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
        {member.location && <span className="inline-flex items-center gap-1.5"><MapPin size={16} />{member.location}</span>}
        {(member.company || member.occupation) && <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness size={16} />{member.occupation || member.company}</span>}
      </div>
      {member.bio && <p className="mt-6 whitespace-pre-line text-[15px] leading-7 text-[var(--text-secondary)]">{member.bio}</p>}
      <div className="mt-8 grid gap-3">
        <MessengerCTA label="Message this member" url={member.messenger_url} />
        {socials.length > 0 && <div className="flex gap-3">
          {socials.map(({ url, label, icon: Icon }) => <a key={label} href={url || '#'} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-12 place-items-center rounded-2xl border border-[var(--border)] bg-white transition active:border-orange-400 active:text-orange-600"><Icon size={19} /></a>)}
        </div>}
      </div>
    </div>
  </article>
}
