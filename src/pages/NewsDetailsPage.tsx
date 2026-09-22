import { CalendarDays, Clock3 } from 'lucide-react'
import { format } from 'date-fns'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { YouTubeEmbed } from '../components/common/UI'
import { getNewsBySlug } from '../services/content'
import { isSupabaseConfigured } from '../lib/supabase'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import NotFoundPage from './NotFoundPage'

export default function NewsDetailsPage() {
  const { slug = '' } = useParams()
  const { data: article, isLoading } = useQuery({ queryKey: ['news-article', slug], queryFn: () => getNewsBySlug(slug), enabled: isSupabaseConfigured, retry: false })
  useDocumentMeta(article?.title || 'Community News', article?.excerpt || undefined, article?.image_url)

  if (isLoading) return <div className="px-5 py-6"><div className="skeleton aspect-video rounded-3xl" /><div className="skeleton mt-5 h-8 w-3/4 rounded" /><div className="skeleton mt-3 h-4 rounded" /></div>
  if (!article) return <NotFoundPage compact title="News article not found" />

  const words = `${article.excerpt || ''} ${article.body || ''}`.trim().split(/\s+/).filter(Boolean).length
  const readingMinutes = Math.max(1, Math.ceil(words / 200))

  return <article>
    {article.youtube_url
      ? <YouTubeEmbed url={article.youtube_url} title={article.title} poster={article.image_url} rounded={false} />
      : <img src={article.image_url || '/brand/forum-wide.jpg'} alt="" className="aspect-[16/10] w-full object-cover" />}
    <div className="px-5 py-7">
      <span className="inline-flex rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-orange-700">{article.category}</span>
      <h1 className="mt-4 text-[29px] font-black leading-[1.12] tracking-tight">{article.title}</h1>
      <div className="mt-4 flex flex-wrap gap-4 border-b border-[var(--border)] pb-5 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{format(new Date(article.published_at || article.created_at), 'MMMM d, yyyy')}</span>
        <span className="inline-flex items-center gap-1.5"><Clock3 size={15} />{readingMinutes} min read</span>
      </div>
      {article.excerpt && <p className="mt-6 text-lg font-semibold leading-8">{article.excerpt}</p>}
      {article.body && <div className="mt-5 whitespace-pre-line text-[15px] leading-8 text-[var(--text-secondary)]">{article.body}</div>}
    </div>
  </article>
}
