export const SITE_SLUG = import.meta.env.VITE_SITE_SLUG?.trim() || 'pinoy-online-venture'
export const SITE_NAME = 'Pinoy Online Venture'
export const MEDIA_BUCKET = 'pov-media'

export const SOCIAL_DEFAULTS = {
  facebook: 'https://www.facebook.com/share/1HqiLdYS5g/',
  tiktok: 'https://www.tiktok.com/@pinoyonlineventure',
  youtube: 'https://www.youtube.com/@POVmarketing-001',
} as const

export function sitePath(folder: 'branding' | 'members' | 'events' | 'gallery' | 'media') {
  return `${SITE_SLUG}/${folder}`
}
