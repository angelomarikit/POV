import type { TABLES } from '../config/tables'

export interface Site {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  favicon_url: string | null
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: 'admin' | 'editor'
}

export interface MemberCategory {
  id: string
  site_slug: string
  name: string
  slug: string
  description: string | null
  display_order: number
  is_active: boolean
}

export interface Member {
  id: string
  site_slug: string
  category_id: string | null
  name: string
  slug: string
  role: string | null
  short_description: string | null
  bio: string | null
  profile_image_url: string | null
  company: string | null
  occupation: string | null
  location: string | null
  facebook_url: string | null
  messenger_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  website_url: string | null
  joined_at: string | null
  featured: boolean
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
  member_categories?: MemberCategory | null
}

export type EventStatus = 'upcoming' | 'ongoing' | 'completed'
export interface Event {
  id: string
  site_slug: string
  title: string
  slug: string
  cover_image_url: string | null
  short_description: string | null
  description: string | null
  start_date: string
  end_date: string | null
  location: string | null
  maps_url: string | null
  cta_label: string | null
  cta_url: string | null
  status: EventStatus | null
  featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
  event_gallery?: EventGalleryItem[]
}

export interface EventGalleryItem {
  id: string
  event_id: string
  image_url: string
  caption: string | null
  display_order: number
}

export interface Video {
  id: string
  site_slug: string
  title: string
  slug: string
  youtube_url: string
  description: string | null
  thumbnail_url: string | null
  cta_label: string | null
  cta_url: string | null
  featured: boolean
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface GalleryItem {
  id: string
  site_slug: string
  image_url: string
  title: string | null
  caption: string | null
  category: string | null
  featured: boolean
  display_order: number
  created_at: string
}

export interface SocialLink {
  id: string
  site_slug: string
  platform: string
  label: string
  url: string
  display_order: number
  is_active: boolean
}

export interface ContentSection {
  id: string
  site_slug: string
  section_key: string
  title: string | null
  subtitle: string | null
  body: string | null
  image_url: string | null
  button_text: string | null
  button_url: string | null
  metadata: Record<string, unknown>
  is_active: boolean
  display_order: number
}

export interface ContactCTA {
  id: string
  site_slug: string
  name: string
  label: string
  messenger_url: string
  description: string | null
  is_active: boolean
}

export type ContentTable = (typeof TABLES)[keyof typeof TABLES]

export type ContentRecord = Member | MemberCategory | Event | Video | GalleryItem | ContentSection | SocialLink | ContactCTA
