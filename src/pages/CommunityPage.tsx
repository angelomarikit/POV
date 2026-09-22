import { Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MemberCard } from '../components/public/Cards'
import { EmptyState, LoadingGrid } from '../components/common/UI'
import { getMemberCategories, getMembers, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { PageIntro } from './PageIntro'

export default function CommunityPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const members = useQuery({ queryKey: queryKeys.members, queryFn: () => getMembers(), enabled: isSupabaseConfigured, retry: false })
  const categories = useQuery({ queryKey: queryKeys.categories, queryFn: () => getMemberCategories(), enabled: isSupabaseConfigured, retry: false })
  const filtered = useMemo(() => (members.data || []).filter(member => {
    const matchesSearch = `${member.name} ${member.role || ''} ${member.company || ''}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (category === 'all' || member.category_id === category)
  }), [members.data, search, category])
  const chips = [{ id: 'all', name: 'All' }, ...(categories.data || []).map(item => ({ id: item.id, name: item.name }))]

  return <>
    <PageIntro eyebrow="Our people" title="Meet the community behind the movement." description="Leaders, mentors, partners, and members building opportunities together." icon={<Users />} />
    <div className="sticky top-15 z-40 bg-[var(--background)]/95 px-5 pb-3 pt-4 backdrop-blur-xl">
      <label className="relative block">
        <span className="sr-only">Search members</span>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, role, or company" className="focus-ring h-12 w-full rounded-2xl border border-[var(--border)] bg-white pl-11 pr-4 text-[15px] outline-none" />
      </label>
      {chips.length > 1 && <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map(chip => <button key={chip.id} type="button" onClick={() => setCategory(chip.id)} className={`focus-ring shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${category === chip.id ? 'bg-black text-white' : 'border border-[var(--border)] bg-white text-neutral-600'}`}>{chip.name}</button>)}
      </div>}
    </div>
    <section className="px-5 pb-10 pt-2">
      {members.isLoading ? <LoadingGrid count={4} />
        : filtered.length ? <div className="grid gap-4">{filtered.map(member => <MemberCard key={member.id} member={member} />)}</div>
        : <EmptyState title={search || category !== 'all' ? 'No matching members' : 'No community members yet'} description={search || category !== 'all' ? 'Try a different search or category.' : 'Published member profiles will appear here.'} />}
    </section>
  </>
}
