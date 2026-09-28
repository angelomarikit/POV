import { useCallback, useEffect, useState } from 'react'
import { SITE_SLUG } from '../config/site'
import type { StoredPresentationSchedule } from '../types/presentation'
import { PRESENTATION_SCHEDULE_KEY } from '../types/presentation'

function readStored(): StoredPresentationSchedule | null {
  try {
    const raw = localStorage.getItem(PRESENTATION_SCHEDULE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredPresentationSchedule
    if (!parsed?.scheduledAt || parsed.siteSlug !== SITE_SLUG) return null
    if (Number.isNaN(new Date(parsed.scheduledAt).getTime())) return null
    return parsed
  } catch {
    return null
  }
}

function writeStored(value: StoredPresentationSchedule | null) {
  if (!value) {
    localStorage.removeItem(PRESENTATION_SCHEDULE_KEY)
    return
  }
  localStorage.setItem(PRESENTATION_SCHEDULE_KEY, JSON.stringify(value))
}

export function usePresentationSchedule() {
  const [stored, setStored] = useState<StoredPresentationSchedule | null>(null)
  const [watching, setWatching] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const existing = readStored()
    setStored(existing)
    if (existing?.completed) setWatching(true)
    setHydrated(true)
  }, [])

  const schedule = useCallback((iso: string) => {
    const next: StoredPresentationSchedule = {
      scheduledAt: iso,
      createdAt: new Date().toISOString(),
      siteSlug: SITE_SLUG,
      completed: false,
    }
    writeStored(next)
    setStored(next)
    setWatching(false)
  }, [])

  const clearSchedule = useCallback(() => {
    writeStored(null)
    setStored(null)
    setWatching(false)
  }, [])

  const markCompleted = useCallback(() => {
    setStored(current => {
      if (!current) return current
      const next = { ...current, completed: true }
      writeStored(next)
      return next
    })
    setWatching(true)
  }, [])

  const startWatching = useCallback(() => setWatching(true), [])

  return {
    hydrated,
    stored,
    scheduledAt: stored?.scheduledAt ?? null,
    completed: Boolean(stored?.completed),
    watching,
    schedule,
    clearSchedule,
    markCompleted,
    startWatching,
  }
}
