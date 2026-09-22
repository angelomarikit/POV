export function generateSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

export function withSlugSuffix(base: string, attempt: number): string {
  return attempt <= 1 ? base : `${base}-${attempt}`
}
