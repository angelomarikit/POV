import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { EmptyState, LoadingGrid } from '../components/common/UI'
import { getMemberCategories, getMembers, getSiteContent, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Member } from '../types'

const FALLBACK = '/pov-logo.png'

function PortraitCard({ member, size }: { member: Member; size: 'lg' | 'sm' }) {
  return (
    <Link to={`/community/${member.slug}`} className="group block text-center transition active:scale-[.98]">
      <div className={`overflow-hidden rounded-xl bg-neutral-100 ${size === 'lg' ? 'aspect-[3/3.6]' : 'aspect-[3/3.5]'}`}>
        <img
          src={member.profile_image_url || FALLBACK}
          alt={member.name}
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <h3 className={`mt-2.5 font-black leading-tight tracking-tight text-[var(--text-primary)] ${size === 'lg' ? 'text-[15px]' : 'text-[12px]'}`}>
        {member.name}
      </h3>
      {(member.role || member.member_categories?.name) && (
        <p className={`mt-1 leading-snug text-neutral-500 ${size === 'lg' ? 'text-xs' : 'text-[10px]'}`}>
          {member.role || member.member_categories?.name}
        </p>
      )}
    </Link>
  )
}

export default function CommunityPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const members = useQuery({ queryKey: queryKeys.members, queryFn: () => getMembers(), enabled: isSupabaseConfigured, retry: false })
  const categories = useQuery({ queryKey: queryKeys.categories, queryFn: () => getMemberCategories(), enabled: isSupabaseConfigured, retry: false })
  const content = useQuery({ queryKey: queryKeys.content, queryFn: getSiteContent, enabled: isSupabaseConfigured, retry: false })

  const intro = content.data?.find(item => item.section_key === 'community_intro')
  const title = intro?.title || 'PINOY ONLINE VENTURE Community'
  const description = intro?.body || 'A dedicated community of people learning, growing, and building opportunities together—united by a shared commitment to raise the standard and move POV onward and upward.'

  const sorted = useMemo(() => {
    const list = [...(members.data || [])]
    list.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return (a.display_order || 0) - (b.display_order || 0) || a.name.localeCompare(b.name)
    })
    return list
  }, [members.data])

  const filtered = useMemo(() => sorted.filter(member => {
    const matchesSearch = `${member.name} ${member.role || ''} ${member.company || ''}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (category === 'all' || member.category_id === category)
  }), [sorted, search, category])

  // Top row: up to 2 featured leaders. If fewer than 2 featured, fill from the start of the list.
  const featuredIds = filtered.filter(member => member.featured).slice(0, 2).map(member => member.id)
  const leaders = featuredIds.length
    ? filtered.filter(member => featuredIds.includes(member.id)).slice(0, 2)
    : filtered.slice(0, Math.min(2, filtered.length))
  const leaderIds = new Set(leaders.map(member => member.id))
  const rest = filtered.filter(member => !leaderIds.has(member.id))

  const chips = [{ id: 'all', name: 'All' }, ...(categories.data || []).map(item => ({ id: item.id, name: item.name }))]
  const filtering = Boolean(search.trim()) || category !== 'all'

  return (
    <div className="bg-white">
      <section className="px-5 pb-5 pt-7">
        <h1 className="text-[26px] font-black leading-[1.12] tracking-tight">{title}</h1>
        <p className="mt-3 text-[15px] leading-7 text-neutral-600">{description}</p>
        {intro?.image_url && <img src={intro.image_url} alt="" className="mt-5 aspect-[16/10] w-full rounded-2xl object-cover" />}
      </section>

      <div className="px-5 pb-3">
        <label className="relative block">
          <span className="sr-only">Search members</span>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search name or role"
            className="focus-ring h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-3 text-sm outline-none"
          />
        </label>
        {chips.length > 1 && (
          <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chips.map(chip => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setCategory(chip.id)}
                className={`focus-ring shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${category === chip.id ? 'bg-orange-500 text-white' : 'border border-neutral-200 bg-white text-neutral-600'}`}
              >
                {chip.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <section className="px-5 pb-12 pt-2">
        {members.isLoading ? <LoadingGrid count={4} />
          : filtered.length ? (
            <div className="space-y-3">
              {leaders.length > 0 && (
                <div className={`grid gap-3 ${leaders.length === 1 ? 'grid-cols-1 max-w-[70%] mx-auto' : 'grid-cols-2'}`}>
                  {leaders.map(member => <PortraitCard key={member.id} member={member} size="lg" />)}
                </div>
              )}
              {rest.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5">
                  {rest.map(member => <PortraitCard key={member.id} member={member} size="sm" />)}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title={filtering ? 'No matching members' : 'No community members yet'}
              description={filtering ? 'Try a different search or category.' : 'Published member profiles will appear here.'}
            />
          )}
      </section>
    </div>
  )
}
