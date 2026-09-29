import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LoadingGrid } from '../components/common/UI'
import { getMembers, getSiteContent, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Member } from '../types'

const FALLBACK = '/pov-logo.png'

function PortraitCard({ member }: { member: Member }) {
  return (
    <Link to={`/community/${member.slug}`} className="group block text-center transition active:scale-[.98]">
      <div className="aspect-[3/3.5] overflow-hidden rounded-xl bg-neutral-100">
        <img
          src={member.profile_image_url || FALLBACK}
          alt={member.name}
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <h3 className="mt-2.5 text-[12px] font-black leading-tight tracking-tight text-[var(--text-primary)]">
        {member.name}
      </h3>
      {(member.role || member.member_categories?.name) && (
        <p className="mt-1 text-[10px] leading-snug text-neutral-500">
          {member.role || member.member_categories?.name}
        </p>
      )}
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

  const [foundersLabel, managementLabel] = (council?.subtitle || 'Founders|Management').split('|').map(part => part.trim())

  const councilMembers = useMemo(() => {
    const list = [...(members.data || [])]
    list.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return (a.display_order || 0) - (b.display_order || 0) || a.name.localeCompare(b.name)
    })
    return list.slice(0, 3)
  }, [members.data])

  return (
    <div className="bg-white">
      <section className="px-5 pb-6 pt-7">
        <h1 className="text-[28px] font-black leading-[1.1] tracking-tight">{intro?.title || 'Community'}</h1>
        <p className="mt-3 text-[15px] leading-7 text-neutral-600">
          {intro?.subtitle || intro?.body || 'POV is a place where you don’t have to build alone.'}
        </p>
        <SectionImage src={intro?.image_url} alt="Pinoy Online Venture community" />
      </section>

      <section className="space-y-5 border-t border-neutral-100 px-5 py-7">
        <div>
          <p className="text-sm font-black text-[var(--text-primary)]">{mission?.title || 'Mission'}</p>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-neutral-600">
            {mission?.body || 'Add the community mission in Admin → Community page.'}
          </p>
        </div>
        <div>
          <p className="text-sm font-black text-[var(--text-primary)]">{vision?.title || 'Vision'}</p>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-neutral-600">
            {vision?.body || 'Add the community vision in Admin → Community page.'}
          </p>
        </div>
      </section>

      <section className="border-t border-neutral-100 px-5 py-7">
        <h2 className="text-[20px] font-black leading-tight tracking-tight">
          {represents?.title || 'What the community represents.'}
        </h2>
        {represents?.body && <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-neutral-600">{represents.body}</p>}
        <SectionImage src={represents?.image_url} alt={represents?.title || 'What the community represents'} />

        <div className="mt-8">
          <h3 className="text-[17px] font-black leading-snug tracking-tight">
            {ascendra?.title || 'POV powered by Ascendra International'}
          </h3>
          {ascendra?.body && <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-neutral-600">{ascendra.body}</p>}
          <SectionImage src={ascendra?.image_url} alt={ascendra?.title || 'Ascendra International'} />
        </div>
      </section>

      <section className="border-t border-neutral-100 px-5 pb-12 py-7">
        <h2 className="text-center text-[22px] font-black tracking-tight">{council?.title || 'POV Council'}</h2>
        {council?.body && <p className="mx-auto mt-3 max-w-sm whitespace-pre-line text-center text-sm leading-6 text-neutral-600">{council.body}</p>}

        <div className="relative mt-8">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/founders" className="focus-ring rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-5 text-center transition active:scale-[.98]">
              <span className="text-sm font-black tracking-tight">{foundersLabel || 'Founders'}</span>
            </Link>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-5 text-center">
              <span className="text-sm font-black tracking-tight">{managementLabel || 'Management'}</span>
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-[4.4rem] h-6 w-px -translate-x-1/2 bg-neutral-300" aria-hidden />
          <div className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-[5.9rem] h-px bg-neutral-300" aria-hidden />
          <div className="pointer-events-none absolute left-[16.5%] top-[5.9rem] h-5 w-px bg-neutral-300" aria-hidden />
          <div className="pointer-events-none absolute left-1/2 top-[5.9rem] h-5 w-px -translate-x-1/2 bg-neutral-300" aria-hidden />
          <div className="pointer-events-none absolute right-[16.5%] top-[5.9rem] h-5 w-px bg-neutral-300" aria-hidden />

          <div className="mt-10 grid grid-cols-3 gap-2.5">
            {members.isLoading ? (
              <div className="col-span-3"><LoadingGrid count={3} /></div>
            ) : councilMembers.length ? (
              councilMembers.map(member => <PortraitCard key={member.id} member={member} />)
            ) : (
              <p className="col-span-3 text-center text-sm text-neutral-500">Add members to show the POV Council.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
