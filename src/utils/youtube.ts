const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/

export function extractYouTubeVideoId(input: string): string | null {
  try {
    const url = new URL(input.trim())
    const host = url.hostname.replace(/^www\./, '')
    let candidate: string | null = null
    if (host === 'youtu.be') candidate = url.pathname.split('/')[1] || null
    if (host.endsWith('youtube.com')) {
      candidate =
        url.searchParams.get('v') ||
        url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/)?.[1] ||
        null
    }
    return candidate && YOUTUBE_ID.test(candidate) ? candidate : null
  } catch {
    return YOUTUBE_ID.test(input) ? input : null
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeVideoId(url)
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeVideoId(url)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}
