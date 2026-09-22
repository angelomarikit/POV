import { PlaySquare } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { VideoCard } from '../components/public/Cards'
import { EmptyState, LoadingGrid, MessengerCTA, YouTubeEmbed } from '../components/common/UI'
import { getVideos, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { PageIntro } from './PageIntro'

export default function VideosPage() {
  const { data = [], isLoading } = useQuery({ queryKey: queryKeys.videos, queryFn: () => getVideos(), enabled: isSupabaseConfigured, retry: false })
  const featured = data.find(video => video.featured)
  const rest = featured ? data.filter(video => video.id !== featured.id) : data

  return <>
    <PageIntro eyebrow="Stories and insight" title="Watch what the community is learning." description="Conversations, practical ideas, and inspiring stories from our people." icon={<PlaySquare />} />
    <section className="px-5 py-7">
      {isLoading ? <LoadingGrid count={3} /> : data.length ? <>
        {featured && <article className="mb-8 overflow-hidden rounded-3xl bg-[#101012] p-3 text-white">
          <YouTubeEmbed url={featured.youtube_url} title={featured.title} poster={featured.thumbnail_url} />
          <div className="p-3">
            <p className="eyebrow">Featured video</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">{featured.title}</h2>
            {featured.description && <p className="mt-2 text-sm leading-6 text-neutral-400">{featured.description}</p>}
            <div className="mt-5"><MessengerCTA label={featured.cta_label} url={featured.cta_url} /></div>
          </div>
        </article>}
        {rest.length > 0 && <div className="grid gap-4">{rest.map(video => <VideoCard key={video.id} video={video} />)}</div>}
      </> : <EmptyState title="No videos published yet" description="Community stories and learning sessions will appear here." />}
    </section>
  </>
}
