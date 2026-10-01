import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit3, GripVertical, Plus, Trash2, X } from 'lucide-react'
import { Button, ConfirmDialog, EmptyState, ImageUploader } from '../../components/common/UI'
import { TABLES } from '../../config/tables'
import {
  deleteRecord, getAllSiteContent, getContactCtas, getEvents, getFounders, getGallery, getMemberCategories, getMembers,
  getNews, getSocialLinks, getVideos, isSlugAvailable, queryKeys, saveRecord, updateDisplayOrders,
} from '../../services/content'
import { generateSlug, withSlugSuffix } from '../../utils/slug'
import { extractYouTubeVideoId } from '../../utils/youtube'

type Kind = 'members' | 'founders' | 'categories' | 'events' | 'videos' | 'news' | 'gallery' | 'homepage' | 'community' | 'social' | 'contacts' | 'settings'
type FieldType = 'text' | 'textarea' | 'url' | 'date' | 'datetime-local' | 'number' | 'checkbox' | 'image' | 'select'
interface Field { key: string; label: string; type: FieldType; required?: boolean; help?: string; options?: Array<{ value: string; label: string }>; folder?: 'branding' | 'members' | 'events' | 'gallery' | 'media' }
interface Config { title: string; singular: string; table: string; key: readonly unknown[]; load: () => Promise<unknown[]>; nameKey: string; fields: Field[] }

const baseConfigs: Record<Kind, Omit<Config, 'fields'> & { fields: Field[] }> = {
  members: { title: 'Community members', singular: 'member', table: TABLES.members, key: queryKeys.members, load: () => getMembers(true), nameKey: 'name', fields: [
    { key: 'name', label: 'Full name', type: 'text', required: true }, { key: 'slug', label: 'URL slug', type: 'text', help: 'Created automatically from the name.' }, { key: 'role', label: 'Role or title', type: 'text', help: 'Shown under the name on the Community grid (example: Founder & President).' }, { key: 'category_id', label: 'Member category', type: 'select' }, { key: 'profile_image_url', label: 'Profile image', type: 'image', folder: 'members', help: 'Use a clear portrait photo. This is the main image on Community.' }, { key: 'short_description', label: 'Short introduction', type: 'textarea' }, { key: 'bio', label: 'Full biography', type: 'textarea' }, { key: 'company', label: 'Business or company', type: 'text' }, { key: 'occupation', label: 'Occupation', type: 'text' }, { key: 'location', label: 'Location', type: 'text' }, { key: 'messenger_url', label: 'Messenger link', type: 'url' }, { key: 'facebook_url', label: 'Facebook link', type: 'url' }, { key: 'tiktok_url', label: 'TikTok link', type: 'url' }, { key: 'youtube_url', label: 'YouTube link', type: 'url' }, { key: 'website_url', label: 'Website', type: 'url' }, { key: 'joined_at', label: 'Join date', type: 'date' }, { key: 'featured', label: 'Top leadership row', type: 'checkbox', help: 'Optional. Council layout uses drag order: #1 and #2 are the large Vision/Management photos.' }, { key: 'is_active', label: 'Visible on public site', type: 'checkbox' }, { key: 'display_order', label: 'Display order', type: 'number', help: 'Auto-updated when you drag the list. #1–#2 = large photos; remaining members use the 3-column grid.' },
  ]},
  founders: { title: 'Founders', singular: 'founder', table: TABLES.founders, key: queryKeys.founders, load: () => getFounders(true), nameKey: 'name', fields: [
    { key: 'name', label: 'Full name', type: 'text', required: true }, { key: 'slug', label: 'URL slug', type: 'text', help: 'Created automatically from the name.' }, { key: 'role', label: 'Role or title', type: 'text' }, { key: 'image_url', label: 'Founder photo', type: 'image', folder: 'members' }, { key: 'short_description', label: 'Short introduction', type: 'textarea' }, { key: 'bio', label: 'Full story or biography', type: 'textarea' }, { key: 'messenger_url', label: 'Messenger link', type: 'url' }, { key: 'facebook_url', label: 'Facebook link', type: 'url' }, { key: 'website_url', label: 'Website', type: 'url' }, { key: 'display_order', label: 'Display order', type: 'number' }, { key: 'is_active', label: 'Visible on public site', type: 'checkbox' },
  ]},
  categories: { title: 'Member categories', singular: 'category', table: TABLES.categories, key: queryKeys.categories, load: () => getMemberCategories(true), nameKey: 'name', fields: [{ key: 'name', label: 'Category name', type: 'text', required: true }, { key: 'slug', label: 'URL slug', type: 'text' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'display_order', label: 'Display order', type: 'number' }, { key: 'is_active', label: 'Active', type: 'checkbox' }] },
  events: { title: 'Events', singular: 'event', table: TABLES.events, key: queryKeys.events, load: () => getEvents(true), nameKey: 'title', fields: [
    { key: 'title', label: 'Event title', type: 'text', required: true }, { key: 'slug', label: 'URL slug', type: 'text' }, { key: 'cover_image_url', label: 'Cover image', type: 'image', folder: 'events' }, { key: 'short_description', label: 'Short summary', type: 'textarea' }, { key: 'description', label: 'Full description', type: 'textarea' }, { key: 'start_date', label: 'Start date and time', type: 'datetime-local', required: true }, { key: 'end_date', label: 'End date and time', type: 'datetime-local' }, { key: 'location', label: 'Location', type: 'text' }, { key: 'maps_url', label: 'Google Maps link', type: 'url' }, { key: 'status', label: 'Status override', type: 'select', options: [{ value: '', label: 'Automatic from date' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'ongoing', label: 'Ongoing' }, { value: 'completed', label: 'Completed' }] }, { key: 'cta_label', label: 'Button label', type: 'text' }, { key: 'cta_url', label: 'Messenger link', type: 'url' }, { key: 'featured', label: 'Featured event', type: 'checkbox' }, { key: 'is_published', label: 'Published', type: 'checkbox' },
  ]},
  videos: { title: 'Videos', singular: 'video', table: TABLES.videos, key: queryKeys.videos, load: () => getVideos(true), nameKey: 'title', fields: [
    { key: 'title', label: 'Video title', type: 'text', required: true }, { key: 'slug', label: 'URL slug', type: 'text' }, { key: 'video_type', label: 'Video type', type: 'select', required: true, options: [{ value: 'general', label: 'General (Events library)' }, { value: 'testimonial', label: 'Testimonial (Know More waiting room)' }, { value: 'presentation', label: 'Main POV presentation' }], help: 'Presentation = unlock video on /know-more. Testimonial = videos while waiting. General = Events video library.' }, { key: 'speaker_name', label: 'Speaker / member name', type: 'text' }, { key: 'duration_minutes', label: 'Duration (minutes)', type: 'number', help: 'Used to recommend testimonials during the countdown.' }, { key: 'youtube_url', label: 'YouTube URL', type: 'url', required: true, help: 'Paste a watch, youtu.be, Shorts, or embed URL.' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'thumbnail_url', label: 'Custom thumbnail (optional)', type: 'image', folder: 'media' }, { key: 'cta_label', label: 'CTA button label', type: 'text' }, { key: 'cta_url', label: 'Messenger link', type: 'url' }, { key: 'published_at', label: 'Publication date', type: 'datetime-local' }, { key: 'display_order', label: 'Display order', type: 'number' }, { key: 'featured', label: 'Featured video', type: 'checkbox', help: 'For presentations, featured marks the primary main video.' }, { key: 'is_published', label: 'Published', type: 'checkbox' },
  ]},
  news: { title: 'News', singular: 'article', table: TABLES.news, key: queryKeys.news, load: () => getNews(true), nameKey: 'title', fields: [
    { key: 'title', label: 'Headline', type: 'text', required: true }, { key: 'slug', label: 'URL slug', type: 'text', help: 'Created automatically from the headline.' }, { key: 'category', label: 'Category', type: 'select', required: true, options: [{ value: 'Announcement', label: 'Announcement' }, { value: 'Achievement', label: 'Achievement' }, { value: 'Event', label: 'Event' }, { value: 'Community', label: 'Community' }, { value: 'Business', label: 'Business' }] }, { key: 'excerpt', label: 'Short summary', type: 'textarea' }, { key: 'body', label: 'Full article details', type: 'textarea' }, { key: 'image_url', label: 'Article image', type: 'image', folder: 'media' }, { key: 'youtube_url', label: 'YouTube video (alternative to image)', type: 'url', help: 'Add an image above or paste a YouTube URL here. At least one is required.' }, { key: 'published_at', label: 'Publication date', type: 'datetime-local' }, { key: 'featured', label: 'Featured article', type: 'checkbox' }, { key: 'is_published', label: 'Published', type: 'checkbox' },
  ]},
  gallery: { title: 'Community gallery', singular: 'image', table: TABLES.gallery, key: queryKeys.gallery, load: getGallery, nameKey: 'title', fields: [{ key: 'image_url', label: 'Gallery image', type: 'image', folder: 'gallery', required: true }, { key: 'title', label: 'Title', type: 'text' }, { key: 'caption', label: 'Caption', type: 'textarea' }, { key: 'category', label: 'Category', type: 'text' }, { key: 'featured', label: 'Featured image', type: 'checkbox' }, { key: 'display_order', label: 'Display order', type: 'number' }] },
  homepage: { title: 'Homepage content', singular: 'section', table: TABLES.content, key: queryKeys.content, load: getAllSiteContent, nameKey: 'title', fields: [{ key: 'section_key', label: 'Section', type: 'select', required: true, options: [{ value: 'hero', label: 'Hero' }, { value: 'know_more_promo', label: 'Know More About POV promo' }, { value: 'cta', label: 'Final call to action' }] }, { key: 'title', label: 'Headline', type: 'text', required: true }, { key: 'subtitle', label: 'Supporting message / eyebrow', type: 'textarea', help: 'For Know More promo, this is the small label above the headline (e.g. Discover Pinoy Online Venture).' }, { key: 'body', label: 'Body copy', type: 'textarea' }, { key: 'image_url', label: 'Section image', type: 'image', folder: 'branding' }, { key: 'button_text', label: 'Button text', type: 'text' }, { key: 'button_url', label: 'Button or Messenger link', type: 'url' }, { key: 'is_active', label: 'Visible', type: 'checkbox' }, { key: 'display_order', label: 'Display order', type: 'number' }] },
  community: { title: 'Community page', singular: 'section', table: TABLES.content, key: queryKeys.content, load: getAllSiteContent, nameKey: 'title', fields: [
    { key: 'section_key', label: 'Section', type: 'select', required: true, options: [
      { value: 'community_intro', label: 'Community — hero (title, tagline, picture)' },
      { value: 'community_mission', label: 'Mission' },
      { value: 'community_vision', label: 'Vision' },
      { value: 'community_represents', label: 'What the community represents ( + picture)' },
      { value: 'community_ascendra', label: 'POV powered by Ascendra ( + picture)' },
      { value: 'community_council', label: 'POV Council heading' },
    ], help: 'These sections appear only on the public Community page.' },
    { key: 'title', label: 'Heading', type: 'text', required: true },
    { key: 'subtitle', label: 'Tagline / council labels', type: 'textarea', help: 'Hero: tagline under Community. POV Council: use The People Behind the Vision|Management for labels above the first two large photos.' },
    { key: 'body', label: 'Content', type: 'textarea', help: 'Mission, Vision, and optional supporting text under image sections.' },
    { key: 'image_url', label: 'Picture', type: 'image', folder: 'branding', help: 'Used by hero, represents, and Ascendra sections.' },
    { key: 'is_active', label: 'Visible', type: 'checkbox' },
    { key: 'display_order', label: 'Display order', type: 'number' },
  ] },
  social: { title: 'Social links', singular: 'social link', table: TABLES.socials, key: queryKeys.socials, load: () => getSocialLinks(true), nameKey: 'label', fields: [{ key: 'platform', label: 'Platform', type: 'text', required: true }, { key: 'label', label: 'Public label', type: 'text', required: true }, { key: 'url', label: 'Profile URL', type: 'url', required: true }, { key: 'display_order', label: 'Display order', type: 'number' }, { key: 'is_active', label: 'Visible', type: 'checkbox' }] },
  contacts: { title: 'Contact calls to action', singular: 'contact CTA', table: TABLES.ctas, key: queryKeys.ctas, load: getContactCtas, nameKey: 'name', fields: [{ key: 'name', label: 'Internal name', type: 'text', required: true }, { key: 'label', label: 'Button label', type: 'text', required: true }, { key: 'messenger_url', label: 'Messenger URL', type: 'url', required: true }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'is_active', label: 'Active', type: 'checkbox' }] },
  settings: { title: 'About Us on Home', singular: 'content section', table: TABLES.content, key: queryKeys.content, load: getAllSiteContent, nameKey: 'title', fields: [{ key: 'section_key', label: 'Section', type: 'select', required: true, options: [{ value: 'about_us', label: 'About Us — intro' }, { value: 'about_purpose', label: 'Our Purpose' }, { value: 'about_stand_for', label: 'What We Stand For' }] }, { key: 'title', label: 'Heading', type: 'text', required: true }, { key: 'subtitle', label: 'Tagline or eyebrow', type: 'textarea', help: 'About Us intro: small “About Us” label. What We Stand For: the tagline (Learn. Connect. Take Action. Grow.).' }, { key: 'body', label: 'Content', type: 'textarea', help: 'Separate paragraphs with a blank line. The last paragraph of What We Stand For can be the welcome line.' }, { key: 'is_active', label: 'Visible', type: 'checkbox' }, { key: 'display_order', label: 'Display order', type: 'number' }] },
}

export default function AdminContentPage({ kind }: { kind: Kind }) {
  const client = useQueryClient()
  const categories = useQuery({ queryKey: [...queryKeys.categories, 'admin-options'], queryFn: () => getMemberCategories(true), enabled: kind === 'members' })
  const config = useMemo<Config>(() => {
    const base = baseConfigs[kind]
    const fields = base.fields.map(field => field.key === 'category_id' ? { ...field, options: [{ value: '', label: 'No category' }, ...(categories.data || []).map(item => ({ value: item.id, label: item.name }))] } : field)
    return { ...base, fields }
  }, [kind, categories.data])
  // Seed a new record only with fields this content type actually has, otherwise
  // the insert carries columns the table does not define (e.g. videos have no display_order).
  const blankRecord = useMemo(() => {
    const record: Record<string, unknown> = {}
    for (const field of config.fields) {
      if (field.type === 'checkbox') record[field.key] = field.key !== 'featured'
      if (field.type === 'number') record[field.key] = 0
      if (field.type === 'select' && field.required && field.options?.length) record[field.key] = field.options[0].value
    }
    return record
  }, [config])
  const list = useQuery({ queryKey: [...config.key, 'admin-list', kind], queryFn: config.load })
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [deleting, setDeleting] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')
  const save = useMutation({ mutationFn: async (values: Record<string, unknown>) => {
    const payload = { ...values }
    if ('slug' in payload) {
      const seed = String(payload.slug || payload[config.nameKey] || config.singular)
      const baseSlug = generateSlug(seed)
      let candidate = baseSlug
      let attempt = 1
      while (!(await isSlugAvailable(config.table, candidate, String(payload.id || '') || undefined))) candidate = withSlugSuffix(baseSlug, ++attempt)
      payload.slug = candidate
    }
    if (kind === 'videos' && !extractYouTubeVideoId(String(payload.youtube_url || ''))) throw new Error('Enter a valid YouTube watch, Shorts, youtu.be, or embed URL.')
    if (kind === 'news') {
      if (!payload.image_url && !payload.youtube_url) throw new Error('Add an article image or a YouTube video.')
      if (payload.youtube_url && !extractYouTubeVideoId(String(payload.youtube_url))) throw new Error('Enter a valid YouTube URL for the article video.')
    }
    const id = typeof payload.id === 'string' ? payload.id : undefined
    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.member_categories; delete payload.event_gallery
    return saveRecord(config.table, payload, id)
  }, onSuccess: async () => { await client.invalidateQueries({ queryKey: config.key }); setEditing(null) }, onError: reason => setError(reason instanceof Error ? reason.message : 'Unable to save this item.') })
  const remove = useMutation({ mutationFn: () => deleteRecord(config.table, String(deleting?.id)), onSuccess: async () => { await client.invalidateQueries({ queryKey: config.key }); setDeleting(null) } })
  const canReorder = config.fields.some(field => field.key === 'display_order')
  const filteredList = useMemo(() => {
    const rows = (list.data || []).filter(item => {
      if (kind === 'homepage') return ['hero', 'know_more_promo', 'cta'].includes(String((item as Record<string, unknown>).section_key))
      if (kind === 'community') return ['community_intro', 'community_mission', 'community_vision', 'community_represents', 'community_ascendra', 'community_council'].includes(String((item as Record<string, unknown>).section_key))
      if (kind === 'settings') return ['about_us', 'about_purpose', 'about_stand_for'].includes(String((item as Record<string, unknown>).section_key))
      return true
    }) as Record<string, unknown>[]
    if (!canReorder) return rows
    return [...rows].sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0) || String(a[config.nameKey] || '').localeCompare(String(b[config.nameKey] || '')))
  }, [list.data, kind, canReorder, config.nameKey])
  const [orderedItems, setOrderedItems] = useState<Record<string, unknown>[] | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [reorderError, setReorderError] = useState('')
  useEffect(() => { setOrderedItems(null); setReorderError('') }, [list.dataUpdatedAt, kind])
  const displayItems = orderedItems || filteredList
  const reorder = useMutation({
    mutationFn: (items: Record<string, unknown>[]) => updateDisplayOrders(config.table, items.map(item => String(item.id))),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: config.key }); setReorderError('') },
    onError: reason => setReorderError(reason instanceof Error ? reason.message : 'Unable to save the new order.'),
  })

  const onDragStart = (index: number) => setDragIndex(index)
  const onDragOver = (event: DragEvent, index: number) => {
    if (!canReorder || dragIndex === null || dragIndex === index) return
    event.preventDefault()
    setOrderedItems(current => {
      const items = [...(current || filteredList)]
      const [moved] = items.splice(dragIndex, 1)
      items.splice(index, 0, moved)
      setDragIndex(index)
      return items
    })
  }
  const onDragEnd = () => {
    if (!canReorder) return
    setDragIndex(null)
    setOrderedItems(current => {
      const items = current || filteredList
      void reorder.mutateAsync(items)
      return items
    })
  }

  return <div><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-orange-600">Content management</p><h1 className="mt-1 text-3xl font-black tracking-tight">{config.title}</h1><p className="mt-2 text-sm text-neutral-500">{canReorder ? 'Drag rows to set sequence. For members: #1 and #2 show as the same-size large photos on Community; the rest use a 3-column grid.' : 'Create, update, reorder, publish, or hide content without editing code.'}</p></div><Button onClick={() => setEditing({ ...blankRecord })}><Plus size={18} />Add {config.singular}</Button></div>
    {reorderError && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{reorderError}</p>}
    {list.isLoading ? <div className="skeleton h-64 rounded-2xl" /> : displayItems.length ? <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"><div className="divide-y divide-neutral-100">{displayItems.map((item, index) => <div key={String(item.id)} draggable={canReorder} onDragStart={() => onDragStart(index)} onDragOver={event => onDragOver(event, index)} onDragEnd={onDragEnd} className={`flex items-center gap-3 p-4 ${dragIndex === index ? 'bg-orange-50' : ''} ${canReorder ? 'cursor-grab active:cursor-grabbing' : ''}`}>{canReorder && <span className="text-neutral-400" aria-hidden><GripVertical size={18} /></span>}{canReorder && <span className="w-5 shrink-0 text-center text-xs font-bold text-orange-600">{index + 1}</span>}<ItemThumb item={item} /><div className="min-w-0 flex-1"><strong className="block truncate">{String(item[config.nameKey] || item.section_key || 'Untitled')}</strong><span className="block truncate text-xs text-neutral-500">{kind === 'members' && index < 2 ? 'Council top row (large) · ' : ''}{String(item.section_key || item.role || item.platform || item.short_description || item.caption || item.slug || '')}</span></div><button aria-label="Edit" onClick={() => setEditing(item)} className="grid size-10 place-items-center rounded-xl border border-neutral-200 hover:bg-neutral-50"><Edit3 size={17} /></button><button aria-label="Delete" onClick={() => setDeleting(item)} className="grid size-10 place-items-center rounded-xl border border-red-100 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button></div>)}</div></div> : <EmptyState title={`No ${config.title.toLowerCase()} yet`} description={`Add your first ${config.singular} to get started.`} action={<Button onClick={() => setEditing({ ...blankRecord })}><Plus size={18} />Add {config.singular}</Button>} />}
    {editing && <EditorModal config={config} initial={editing} busy={save.isPending} error={error} onClose={() => { setEditing(null); setError('') }} onSave={values => save.mutate(values)} />}
    <ConfirmDialog open={Boolean(deleting)} title={`Delete ${String(deleting?.[config.nameKey] || config.singular)}?`} description="This action cannot be undone. Any shared storage images are preserved to prevent accidental file loss." busy={remove.isPending} onCancel={() => setDeleting(null)} onConfirm={() => remove.mutate()} />
  </div>
}

function ItemThumb({ item }: { item: Record<string, unknown> }) {
  const src = String(item.profile_image_url || item.cover_image_url || item.thumbnail_url || item.image_url || '')
  return src ? <img src={src} alt="" className="size-12 rounded-xl object-cover" /> : <div className="grid size-12 place-items-center rounded-xl bg-orange-50 font-black text-orange-600">{String(item.name || item.title || item.label || '?').charAt(0)}</div>
}

function EditorModal({ config, initial, busy, error, onClose, onSave }: { config: Config; initial: Record<string, unknown>; busy: boolean; error: string; onClose: () => void; onSave: (value: Record<string, unknown>) => void }) {
  const [values, setValues] = useState(initial)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id))
  const submit = (event: FormEvent) => { event.preventDefault(); onSave(values) }
  return <div className="fixed inset-0 z-[80] flex justify-center bg-black/55" role="dialog" aria-modal="true"><button aria-label="Close editor" className="absolute inset-0" onClick={onClose} /><form onSubmit={submit} className="relative h-full w-full max-w-[var(--app-width)] overflow-y-auto bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-5 py-4 backdrop-blur"><div><h2 className="text-xl font-black">{initial.id ? 'Edit' : 'Add'} {config.singular}</h2><p className="text-xs text-neutral-500">Fields marked required must be completed.</p></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full border border-neutral-200"><X /></button></div><div className="space-y-5 p-5">{config.fields.map(field => <FormField key={field.key} field={field} value={values[field.key]} onChange={value => {
    setValues(current => {
      const next = { ...current, [field.key]: value }
      if (field.key === config.nameKey && !slugTouched && config.fields.some(item => item.key === 'slug')) next.slug = generateSlug(String(value || ''))
      return next
    })
    if (field.key === 'slug') setSlugTouched(true)
  }} />)}{error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}</div><div className="sticky bottom-0 flex justify-end gap-3 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button></div></form></div>
}

function FormField({ field, value, onChange }: { field: Field; value: unknown; onChange: (value: unknown) => void }) {
  if (field.type === 'image') return <ImageUploader label={field.label} value={String(value || '')} folder={field.folder || 'media'} onChange={onChange} />
  if (field.type === 'checkbox') return <label className="flex items-center justify-between rounded-xl border border-neutral-200 p-4"><span className="font-semibold">{field.label}</span><input type="checkbox" checked={Boolean(value)} onChange={event => onChange(event.target.checked)} className="size-5 accent-orange-500" /></label>
  const className = 'focus-ring w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 outline-none'
  return <label className="block"><span className="mb-2 block text-sm font-bold">{field.label}{field.required && <span className="text-red-600"> *</span>}</span>{field.type === 'textarea' ? <textarea required={field.required} rows={field.key === 'bio' || field.key === 'description' || field.key === 'body' ? 7 : 3} value={String(value || '')} onChange={event => onChange(event.target.value)} className={className} /> : field.type === 'select' ? <select required={field.required} value={String(value || '')} onChange={event => onChange(event.target.value || null)} className={className}>{field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input required={field.required} type={field.type} value={String(value || '')} onChange={event => onChange(field.type === 'number' ? Number(event.target.value) : event.target.value)} className={className} />}{field.help && <span className="mt-1.5 block text-xs text-neutral-500">{field.help}</span>}{field.key === 'slug' && value ? <span className="mt-1 block text-xs text-orange-700">URL preview: /{configPathForSlug(field, String(value))}</span> : null}</label>
}

function configPathForSlug(_field: Field, slug: string) { return `community-or-content/${slug}` }
