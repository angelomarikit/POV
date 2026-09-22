import { useEffect } from 'react'
import { OG_IMAGE, SITE_URL } from '../config/site'

// Share cards need absolute URLs, so relative paths are resolved against the site
// origin and pages without their own image fall back to the brand banner.
function toAbsoluteUrl(value?: string | null) {
  if (!value) return OG_IMAGE
  if (/^https?:\/\//i.test(value)) return value
  return `${SITE_URL}/${value.replace(/^\//, '')}`
}

export function useDocumentMeta(title: string, description?: string, image?: string | null) {
  useEffect(() => {
    document.title = `${title} | Pinoy Online Venture`
    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, value?: string | null) => {
      if (!value) return
      let element = document.head.querySelector<HTMLMetaElement>(selector)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, key)
        document.head.appendChild(element)
      }
      element.content = value
    }
    const shareImage = toAbsoluteUrl(image)
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:image"]', 'property', 'og:image', shareImage)
    setMeta('meta[property="og:url"]', 'property', 'og:url', `${SITE_URL}${window.location.pathname}`)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', shareImage)
  }, [title, description, image])
}
