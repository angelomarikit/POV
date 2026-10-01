import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LoadingGrid } from '../components/common/UI'
import { getMembers, getSiteContent, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Member } from '../types'

const FALLBACK = '/pov-logo.png'
const headingClass = 'font-black tracking-tight text-orange-500'
const BRAND_PATTERN = /(POV Community|Pinoy Online Venture \(POV\)|Pinoy Online Venture|POV)/gi

function BrandCopy({ text, className }: { text: string; className?: string }) {
  const parts: ReactNode[] = []
  let last = 0
  const source = text
  for (const match of source.matchAll(BRAND_PATTERN)) {
    const start = match.index ?? 0
    if (start > last) parts.push(source.slice(last, start))
    parts.push(<span key={`${start}-${match[0]}`} className="font-bold text-orange-500">{match[0]}</span>)
    last = start + match[0].length
  }
  if (last < source.length) parts.push(source.slice(last))
  return <p className={className}>{parts.length ? parts : text}</p>
}

function PortraitCard({ member, size }: { member: Member; size: 'lg' | 'sm' }) {
  return (
    <Link to={`/community/${member.slug}`} className="group block w-full min-w-0 text-center transition active:scale-[.98]">
      <div className={`w-full overflow-hidden rounded-xl bg-neutral-100 ${size === 'lg' ? 'aspect-[3/4]' : 'aspect-[3/3.5]'}`}>
        <img
          src={member.profile_image_url || FALLBACK}
          alt={member.name}
          loading="lazy"
          className="size-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <h3 className={`mt-2.5 font-black leading-tight tracking-tight text-[var(--text-primary)] ${size === 'lg' ? 'text-[15px]' : 'text-[12px]'}`}>
        {member.name}
      </h3>
      <p className={`mt-1 min-h-[2.5em] leading-snug text-neutral-500 ${size === 'lg' ? 'text-xs' : 'text-[10px]'}`}>
        {member.role || member.member_categories?.name || '\u00A0'}
      </p>
    </Link>
  )
}

function SectionImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="mt-5 grid aspect-[16/10] w-full place-items-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-sm font-semibold text-neutral-400">
        Upload image in Admin
      </div>
    )
  }
  return <img src={src} alt={alt} className="mt-5 aspect-[16/10] w-full rounded-2xl object-cover" />
}

export default function CommunityPage() {
  const members = useQuery({ queryKey: queryKeys.members, queryFn: () => getMembers(), enabled: isSupabaseConfigured, retry: false })
  const content = useQuery({ queryKey: queryKeys.content, queryFn: getSiteContent, enabled: isSupabaseConfigured, retry: false })

  const section = (key: string) => content.data?.find(item => item.section_key === key)
  const intro = section('community_intro')
  const mission = section('community_mission')
  const vision = section('community_vision')
  const represents = section('community_represents')
  const ascendra = section('community_ascendra')
  const council = section('community_council')

  const sorted = useMemo(() => {
    const list = [...(members.data || [])]
    list.sort((a, b) => (a.display_order || 0) - (b.display_order || 0) || a.name.localeCompare(b.name))
    return list
  }, [members.data])

  const leaders = sorted.slice(0, 2)
  const rest = sorted.slice(2)

  return (
    <div className="bg-white">
      <section className="px-5 pb-6 pt-7">
        <h1 className={`${headingClass} text-[34px] leading-[1.05]`}>{intro?.title || 'Community'}</h1>
        <BrandCopy
          className="mt-3 text-[15px] leading-7 text-neutral-600"
          text={intro?.subtitle || intro?.body || 'POV is a place where you don’t have to build alone.'}
        />
        <SectionImage src={intro?.image_url} alt="Pinoy Online Venture community" />
      </section>

      <section className="space-y-5 border-t border-neutral-100 px-5 py-7">
        <div>
          <p className={`${headingClass} text-[22px]`}>{mission?.title || 'Mission'}</p>
          <BrandCopy
            className="mt-2 whitespace-pre-line text-[15px] leading-7 text-neutral-600"
            text={mission?.body || 'Add the community mission in Admin → Community page.'}
          />
        </div>
        <div>
          <p className={`${headingClass} text-[22px]`}>{vision?.title || 'Vision'}</p>
          <BrandCopy
            className="mt-2 whitespace-pre-line text-[15px] leading-7 text-neutral-600"
            text={vision?.body || 'Add the community vision in Admin → Community page.'}
          />
        </div>
      </section>

      <section className="border-t border-neutral-100 px-5 py-7">
        <h2 className={`${headingClass} text-[24px] leading-tight`}>
          {represents?.title || 'What the community represents.'}
        </h2>
        {represents?.body && (
          <BrandCopy className="mt-3 whitespace-pre-line text-[15px] leading-7 text-neutral-600" text={represents.body} />
        )}
        <SectionImage src={represents?.image_url} alt={represents?.title || 'What the community represents'} />

        <div className="mt-8">
          <h3 className={`${headingClass} text-[22px] leading-snug`}>
            {ascendra?.title || 'POV powered by Ascendra International'}
          </h3>
          {ascendra?.body && (
            <BrandCopy className="mt-3 whitespace-pre-line text-[15px] leading-7 text-neutral-600" text={ascendra.body} />
          )}
          <SectionImage src={ascendra?.image_url} alt={ascendra?.title || 'Ascendra International'} />
        </div>
      </section>

      <section className="border-t border-neutral-100 px-5 py-7 pb-12">
        <h2 className={`${headingClass} text-center text-[26px]`}>{council?.title || 'POV Council'}</h2>
        {council?.body && (
          <BrandCopy
            className="mx-auto mt-3 max-w-sm whitespace-pre-line text-center text-sm leading-6 text-neutral-600"
            text={council.body}
          />
        )}

        <div className="mt-8">
          {members.isLoading ? (
            <LoadingGrid count={4} />
          ) : sorted.length ? (
            <div className="space-y-6">
              {leaders.length > 0 && (
                <div className={`grid gap-4 ${leaders.length === 1 ? 'mx-auto max-w-[50%] grid-cols-1' : 'grid-cols-2'}`}>
                  {leaders.map(member => (
                    <PortraitCard key={member.id} member={member} size="lg" />
                  ))}
                </div>
              )}

              {rest.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5">
                  {rest.map(member => <PortraitCard key={member.id} member={member} size="sm" />)}
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-sm text-neutral-500">Add members in Admin to show the POV Council.</p>
          )}
        </div>
      </section>
    </div>
  )
}
