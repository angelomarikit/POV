import { SITE_SLUG } from '../config/site'
import { TABLES } from '../config/tables'
import { supabase } from '../lib/supabase'
import type { ContactCTA, ContentSection, Event, GalleryItem, Member, MemberCategory, SocialLink, Video } from '../types'

async function dataOrThrow<T>(promise: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await promise
  if (error) throw new Error(error.message)
  return data as T
}

export const queryKeys = {
  members: ['members', SITE_SLUG] as const,
  categories: ['member-categories', SITE_SLUG] as const,
  events: ['events', SITE_SLUG] as const,
  videos: ['videos', SITE_SLUG] as const,
  gallery: ['gallery', SITE_SLUG] as const,
  content: ['site-content', SITE_SLUG] as const,
  socials: ['social-links', SITE_SLUG] as const,
  ctas: ['contact-ctas', SITE_SLUG] as const,
}

// Aliased embeds keep the response keys (member_categories, event_gallery) stable
// even though the underlying tables are prefixed.
const MEMBER_SELECT = `*, member_categories:${TABLES.categories}(*)`
const EVENT_SELECT = `*, event_gallery:${TABLES.eventGallery}(*)`

export async function getMembers(includeInactive = false): Promise<Member[]> {
  let query = supabase.from(TABLES.members).select(MEMBER_SELECT).eq('site_slug', SITE_SLUG).order('display_order').order('name')
  if (!includeInactive) query = query.eq('is_active', true)
  return dataOrThrow<Member[]>(query)
}

export async function getFeaturedMembers() {
  return (await getMembers()).filter((member) => member.featured)
}

export async function getMemberBySlug(slug: string) {
  const data = await dataOrThrow<Member | null>(
    supabase.from(TABLES.members).select(MEMBER_SELECT).eq('site_slug', SITE_SLUG).eq('slug', slug).eq('is_active', true).maybeSingle(),
  )
  return data
}

export async function getMemberCategories(includeInactive = false): Promise<MemberCategory[]> {
  let query = supabase.from(TABLES.categories).select('*').eq('site_slug', SITE_SLUG).order('display_order')
  if (!includeInactive) query = query.eq('is_active', true)
  return dataOrThrow<MemberCategory[]>(query)
}

export async function getEvents(includeUnpublished = false): Promise<Event[]> {
  let query = supabase.from(TABLES.events).select(EVENT_SELECT).eq('site_slug', SITE_SLUG).order('start_date', { ascending: false })
  if (!includeUnpublished) query = query.eq('is_published', true)
  return dataOrThrow<Event[]>(query)
}

export async function getEventBySlug(slug: string) {
  return dataOrThrow<Event | null>(
    supabase.from(TABLES.events).select(EVENT_SELECT).eq('site_slug', SITE_SLUG).eq('slug', slug).eq('is_published', true).maybeSingle(),
  )
}

export async function getVideos(includeUnpublished = false): Promise<Video[]> {
  let query = supabase.from(TABLES.videos).select('*').eq('site_slug', SITE_SLUG).order('published_at', { ascending: false })
  if (!includeUnpublished) query = query.eq('is_published', true)
  return dataOrThrow<Video[]>(query)
}

export async function getGallery(): Promise<GalleryItem[]> {
  return dataOrThrow<GalleryItem[]>(supabase.from(TABLES.gallery).select('*').eq('site_slug', SITE_SLUG).order('display_order'))
}

export async function getSiteContent(): Promise<ContentSection[]> {
  return dataOrThrow<ContentSection[]>(supabase.from(TABLES.content).select('*').eq('site_slug', SITE_SLUG).eq('is_active', true).order('display_order'))
}

export async function getAllSiteContent(): Promise<ContentSection[]> {
  return dataOrThrow<ContentSection[]>(supabase.from(TABLES.content).select('*').eq('site_slug', SITE_SLUG).order('display_order'))
}

export async function getSocialLinks(includeInactive = false): Promise<SocialLink[]> {
  let query = supabase.from(TABLES.socials).select('*').eq('site_slug', SITE_SLUG).order('display_order')
  if (!includeInactive) query = query.eq('is_active', true)
  return dataOrThrow<SocialLink[]>(query)
}

export async function getContactCtas(): Promise<ContactCTA[]> {
  return dataOrThrow<ContactCTA[]>(supabase.from(TABLES.ctas).select('*').eq('site_slug', SITE_SLUG).order('created_at'))
}

export async function saveRecord(table: string, values: Record<string, unknown>, id?: string) {
  const payload = { ...values, site_slug: SITE_SLUG }
  const query = id
    ? supabase.from(table).update(payload).eq('id', id).eq('site_slug', SITE_SLUG)
    : supabase.from(table).insert(payload)
  return dataOrThrow<Record<string, unknown>[]>(query.select())
}

export async function deleteRecord(table: string, id: string) {
  return dataOrThrow<unknown>(supabase.from(table).delete().eq('id', id).eq('site_slug', SITE_SLUG))
}

export async function isSlugAvailable(table: string, slug: string, excludeId?: string) {
  let query = supabase.from(table).select('id').eq('site_slug', SITE_SLUG).eq('slug', slug)
  if (excludeId) query = query.neq('id', excludeId)
  const result = await dataOrThrow<Array<{ id: string }>>(query.limit(1))
  return result.length === 0
}
