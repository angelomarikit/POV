import { Globe, MessageCircle, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getFounders, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { EmptyState, LoadingGrid } from '../components/common/UI'
import { PageIntro } from './PageIntro'

export default function FoundersPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.founders,
    queryFn: () => getFounders(),
    enabled: isSupabaseConfigured,
    retry: false,
  })

  return <>
    <PageIntro
      eyebrow="Leadership"
      title="Meet the founders behind the vision."
      description="The people who started Pinoy Online Venture and continue to guide its community, purpose, and growth."
      icon={<Users />}
    />
    <section className="px-5 py-8">
      {isLoading ? <LoadingGrid count={2} /> : data.length ? <div className="grid gap-5">
        {data.map(founder => <article key={founder.id} className="card overflow-hidden">
          <div className="relative aspect-[4/4.25] overflow-hidden bg-neutral-100">
            <img src={founder.image_url || '/pov-logo.png'} alt={founder.name} className="size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-5 pb-5 pt-20 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-orange-400">{founder.role || 'Founder'}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{founder.name}</h2>
            </div>
          </div>
          <div className="p-5">
            {founder.short_description && <p className="font-semibold leading-6">{founder.short_description}</p>}
            {founder.bio && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--text-secondary)]">{founder.bio}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              {founder.messenger_url && <a href={founder.messenger_url} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-bold text-white"><MessageCircle size={17} />Message</a>}
              {founder.website_url && <a href={founder.website_url} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] px-5 text-sm font-bold"><Globe size={17} />Website</a>}
              {founder.facebook_url && <a href={founder.facebook_url} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-5 text-sm font-bold">Facebook</a>}
            </div>
          </div>
        </article>)}
      </div> : <EmptyState title="Founder profiles are coming soon" description="The people behind Pinoy Online Venture will be introduced here." />}
    </section>
  </>
}
