import { useMemo, useState } from 'react'
import { CalendarDays, ChevronRight, Newspaper } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { EmptyState, LoadingGrid, YouTubeEmbed } from '../components/common/UI'
import { getNews, queryKeys } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { getYouTubeThumbnail } from '../utils/youtube'
import type { NewsArticle } from '../types'

function articleDate(article: NewsArticle) {
  return format(new Date(article.published_at || article.created_at), 'MMM d, yyyy')
}

function readTime(article: NewsArticle) {
  const words = `${article.excerpt || ''} ${article.body || ''}`.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function NewsRow({ article }: { article: NewsArticle }) {
  const thumbnail = article.image_url || (article.youtube_url ? getYouTubeThumbnail(article.youtube_url) : null)
  return <Link to={`/news/${article.slug}`} className="focus-ring flex gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 transition active:scale-[.99]">
    <img src={thumbnail || '/brand/forum-wide.jpg'} alt="" className="size-24 shrink-0 rounded-xl object-cover" />
    <span className="min-w-0 flex-1 py-0.5">
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">{article.category}</span>
      <strong className="mt-1 block line-clamp-2 text-sm leading-5">{article.title}</strong>
      {article.excerpt && <span className="mt-1 block line-clamp-1 text-xs text-[var(--text-secondary)]">{article.excerpt}</span>}
      <span className="mt-2 flex items-center gap-3 text-[10px] text-neutral-500"><span className="inline-flex items-center gap-1"><CalendarDays size={12} />{articleDate(article)}</span><span>{readTime(article)} min read</span></span>
    </span>
    <ChevronRight className="my-auto shrink-0 text-orange-600" size={18} />
  </Link>
}

export default function NewsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: queryKeys.news, queryFn: () => getNews(), enabled: isSupabaseConfigured, retry: false })
  const [category, setCategory] = useState('All')
  const featured = data.find(article => article.featured) || data[0]
  const categories = useMemo(() => ['All', ...Array.from(new Set(data.map(article => article.category)))], [data])
  const articles = data.filter(article => article.id !== featured?.id && (category === 'All' || article.category === category))

  return <>
    <section className="bg-[#0b0b0c] px-5 pb-7 pt-8 text-white">
      <span className="grid size-11 place-items-center rounded-xl bg-orange-500"><Newspaper size={21} /></span>
      <p className="eyebrow mt-5">Stay connected</p>
      <h1 className="mt-2 text-[30px] font-black leading-tight tracking-tight">News and community updates.</h1>
      <p className="mt-3 text-sm leading-6 text-neutral-400">Announcements, achievements, events, and stories from Pinoy Online Venture.</p>
    </section>

    <section className="px-5 py-7">
      {isLoading ? <LoadingGrid count={3} /> : data.length ? <>
        {featured && <article className="overflow-hidden rounded-3xl bg-[#0b0b0c] text-white">
          {featured.youtube_url
            ? <YouTubeEmbed url={featured.youtube_url} title={featured.title} poster={featured.image_url} rounded={false} />
            : <img src={featured.image_url || '/brand/forum-wide.jpg'} alt="" className="aspect-[16/10] w-full object-cover" />}
          <div className="p-5">
            <span className="inline-flex rounded-lg bg-orange-500 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider">{featured.featured ? 'Featured' : featured.category}</span>
            <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight">{featured.title}</h2>
            {featured.excerpt && <p className="mt-2 text-sm leading-6 text-neutral-300">{featured.excerpt}</p>}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-400">{articleDate(featured)} · {readTime(featured)} min read</span>
              <Link to={`/news/${featured.slug}`} className="inline-flex items-center gap-1 text-sm font-bold text-orange-400">Details<ChevronRight size={16} /></Link>
            </div>
          </div>
        </article>}

        <div className="mt-8">
          <h2 className="text-xl font-black tracking-tight">Latest updates</h2>
          <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map(item => <button key={item} type="button" onClick={() => setCategory(item)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold transition ${category === item ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-600'}`}>{item}</button>)}
          </div>
          <div className="mt-4 grid gap-3">
            {articles.length ? articles.map(article => <NewsRow key={article.id} article={article} />) : <p className="rounded-2xl bg-neutral-50 p-6 text-center text-sm text-neutral-500">No other articles in this category yet.</p>}
          </div>
        </div>
      </> : <EmptyState title="No news published yet" description="Announcements and community updates will appear here." />}
    </section>
  </>
}
