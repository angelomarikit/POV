export const SITE_SLUG = import.meta.env.VITE_SITE_SLUG?.trim() || 'pinoy-online-venture'
export const SITE_NAME = 'Pinoy Online Venture'
export const MEDIA_BUCKET = 'pov-media'

// Must match the absolute URLs in index.html. Set VITE_SITE_URL in Vercel once a
// custom domain is attached so shared links point at the real host.
export const SITE_URL = (import.meta.env.VITE_SITE_URL?.trim() || 'https://pinoy-online-venture.vercel.app').replace(/\/$/, '')
export const OG_IMAGE = `${SITE_URL}/brand/og-image.jpg`

export const SOCIAL_DEFAULTS = {
  facebook: 'https://www.facebook.com/share/1HqiLdYS5g/',
  tiktok: 'https://www.tiktok.com/@pinoyonlineventure',
  youtube: 'https://www.youtube.com/@POVmarketing-001',
} as const

export function sitePath(folder: 'branding' | 'members' | 'events' | 'gallery' | 'media') {
  return `${SITE_SLUG}/${folder}`
}
