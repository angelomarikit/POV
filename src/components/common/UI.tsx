import { useRef, useState, type ReactNode } from 'react'
import { ImagePlus, LoaderCircle, MessageCircle, Play, Trash2, UploadCloud } from 'lucide-react'
import { clsx } from 'clsx'
import { uploadImage, type MediaFolder } from '../../services/storage'
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '../../utils/youtube'

export function Button({ children, className, variant = 'primary', type = 'button', disabled, onClick }: {
  children: ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={clsx(
      'focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
      variant === 'primary' && 'bg-[var(--primary)] text-white shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 hover:bg-[var(--primary-strong)]',
      variant === 'secondary' && 'bg-[var(--secondary)] text-white hover:-translate-y-0.5 hover:bg-black',
      variant === 'ghost' && 'border border-[var(--border)] bg-white text-[var(--text-primary)] hover:border-orange-300 hover:bg-orange-50',
      variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
      className,
    )}>{children}</button>
  )
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="heading-section text-balance">{title}</h2>
        {description && <p className="mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="card flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-orange-50 text-orange-600"><ImagePlus /></div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-[var(--text-secondary)]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function LoadingGrid({ count = 3 }: { count?: number }) {
  return <div className="grid gap-4">{Array.from({ length: count }, (_, index) => (
    <div key={index} className="card overflow-hidden"><div className="skeleton aspect-[4/3]" /><div className="space-y-3 p-5"><div className="skeleton h-5 w-2/3 rounded" /><div className="skeleton h-4 rounded" /><div className="skeleton h-4 w-4/5 rounded" /></div></div>
  ))}</div>
}

export function MessengerCTA({ label, url, variant = 'primary', className }: { label?: string | null; url?: string | null; variant?: 'primary' | 'secondary' | 'ghost'; className?: string }) {
  if (!url || !/^https?:\/\//i.test(url)) return null
  return <a href={url} target="_blank" rel="noopener noreferrer" className={clsx(
    'focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 active:scale-[.98]',
    variant === 'primary' && 'bg-[var(--primary)] text-white shadow-lg shadow-orange-500/25 hover:bg-[var(--primary-strong)]',
    variant === 'secondary' && 'bg-[var(--secondary)] text-white',
    variant === 'ghost' && 'border border-[var(--border)] bg-white text-[var(--text-primary)] hover:border-orange-300 hover:bg-orange-50',
    className,
  )}><MessageCircle size={18} />{label?.trim() || 'Message us'}</a>
}

// Click-to-play facade: the iframe is only mounted once the visitor presses play,
// so the video opens in the app instead of sending them to YouTube.
export function YouTubeEmbed({ url, title, poster, rounded = true }: { url: string; title: string; poster?: string | null; rounded?: boolean }) {
  const [playing, setPlaying] = useState(false)
  const embedUrl = getYouTubeEmbedUrl(url)
  const image = poster || getYouTubeThumbnail(url)
  const shape = rounded ? 'rounded-2xl' : ''
  if (!embedUrl) return <div className={clsx('grid aspect-video place-items-center bg-neutral-100 text-sm text-neutral-500', shape)}>Video URL is unavailable.</div>
  if (playing) return <div className={clsx('aspect-video overflow-hidden bg-black', shape)}>
    <iframe className="size-full" src={`${embedUrl}?autoplay=1&rel=0&modestbranding=1&playsinline=1`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
  </div>
  return <button type="button" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`} className={clsx('group relative block aspect-video w-full overflow-hidden bg-neutral-950', shape)}>
    {image && <img src={image} alt="" loading="lazy" className="size-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-75" />}
    <span className="absolute inset-0 grid place-items-center">
      <span className="grid size-16 place-items-center rounded-full bg-orange-500 text-white shadow-xl transition group-hover:scale-110 group-active:scale-95"><Play size={26} fill="currentColor" /></span>
    </span>
  </button>
}

export function ImageUploader({ value, folder, label, onChange }: { value?: string; folder: MediaFolder; label: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const process = async (file?: File) => {
    if (!file) return
    setError('')
    try {
      const result = await uploadImage(file, folder, setProgress)
      onChange(result.url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Upload failed. Please try again.')
    } finally {
      setProgress(0)
    }
  }

  return <div>
    <label className="mb-2 block text-sm font-semibold">{label}</label>
    {value ? <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-neutral-100">
      <img src={value} alt="" className="aspect-video w-full object-cover" />
      <div className="absolute bottom-3 right-3 flex gap-2">
        <Button variant="ghost" className="bg-white/95" onClick={() => inputRef.current?.click()}><UploadCloud size={16} /> Replace</Button>
        <Button variant="danger" className="px-3" onClick={() => onChange('')}><Trash2 size={16} /></Button>
      </div>
    </div> : <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void process(event.dataTransfer.files[0]) }} className={clsx('focus-ring flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition', dragging ? 'border-orange-500 bg-orange-50' : 'border-neutral-300 bg-neutral-50 hover:border-orange-400')}>
      {progress ? <LoaderCircle className="animate-spin text-orange-600" /> : <UploadCloud className="text-orange-600" />}
      <span className="mt-3 font-semibold">{progress ? `Uploading ${progress}%` : 'Drop an image or click to upload'}</span>
      <span className="mt-1 text-xs text-neutral-500">JPG, PNG or WEBP · up to 12 MB</span>
    </button>}
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void process(event.target.files?.[0])} />
    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
  </div>
}

export function ConfirmDialog({ open, title, description, busy, onCancel, onConfirm }: { open: boolean; title: string; description: string; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
    <div className="card w-full max-w-md p-6">
      <h2 id="confirm-title" className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      <div className="mt-7 flex justify-end gap-3"><Button variant="ghost" onClick={onCancel}>Cancel</Button><Button variant="danger" disabled={busy} onClick={onConfirm}>{busy ? 'Deleting…' : 'Delete'}</Button></div>
    </div>
  </div>
}
