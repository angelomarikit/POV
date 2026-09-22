// This Supabase project is shared with other live websites, so every table this
// app owns is prefixed. Keep these in sync with supabase/migrations.
export const TABLES = {
  admins: 'pov_admins',
  content: 'pov_site_content',
  categories: 'pov_member_categories',
  members: 'pov_members',
  events: 'pov_events',
  eventGallery: 'pov_event_gallery',
  videos: 'pov_videos',
  gallery: 'pov_gallery',
  socials: 'pov_social_links',
  ctas: 'pov_contact_ctas',
  settings: 'pov_site_settings',
} as const
