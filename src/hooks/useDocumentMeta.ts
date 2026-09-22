import { useEffect } from 'react'

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
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:image"]', 'property', 'og:image', image)
  }, [title, description, image])
}
