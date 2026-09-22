import { Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage({ compact = false, title = 'Page not found' }: { compact?: boolean; title?: string }) {
  return <section className={compact ? 'px-5 py-16 text-center' : 'grid min-h-[60svh] place-items-center px-5 text-center'}>
    <div>
      <p className="text-6xl font-black text-orange-500">404</p>
      <h1 className="mt-3 text-2xl font-black tracking-tight">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[var(--text-secondary)]">The page may have moved, been unpublished, or never existed.</p>
      <Link to="/" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-black px-6 text-sm font-bold text-white"><Home size={17} />Back to home</Link>
    </div>
  </section>
}
