import type { PresentationSettings } from '../types/presentation'

function parseHm(value: string) {
  const [h = '0', m = '0'] = value.split(':')
  return { hours: Number(h) || 0, minutes: Number(m) || 0 }
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function combineLocalDateAndTime(date: Date, hours: number, minutes: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0)
}

/** Build upcoming start times within admin availability rules. */
export function generateAvailableSlots(settings: PresentationSettings, from = new Date()): Date[] {
  const { hours: startH, minutes: startM } = parseHm(settings.availability_start)
  const { hours: endH, minutes: endM } = parseHm(settings.availability_end)
  const interval = Math.max(5, settings.interval_minutes || 30)
  const leadMs = Math.max(0, settings.minimum_lead_minutes || 0) * 60_000
  const maxDays = Math.max(0, settings.maximum_advance_days || 7)
  const earliest = new Date(from.getTime() + leadMs)
  const lastDay = startOfLocalDay(from)
  lastDay.setDate(lastDay.getDate() + maxDays)

  const slots: Date[] = []
  for (let dayOffset = 0; dayOffset <= maxDays; dayOffset++) {
    const day = startOfLocalDay(from)
    day.setDate(day.getDate() + dayOffset)
    if (day > lastDay) break

    let cursor = combineLocalDateAndTime(day, startH, startM)
    const dayEnd = combineLocalDateAndTime(day, endH, endM)

    while (cursor <= dayEnd) {
      if (cursor >= earliest) slots.push(new Date(cursor))
      cursor = new Date(cursor.getTime() + interval * 60_000)
    }
  }
  return slots
}

/** Local-calendar day key (YYYY-MM-DD) for grouping slots. */
export function dayKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function groupSlotsByDay(slots: Date[]) {
  const groups: Array<{ key: string; date: Date; slots: Date[] }> = []
  for (const slot of slots) {
    const key = dayKey(slot)
    const existing = groups.find(group => group.key === key)
    if (existing) existing.slots.push(slot)
    else groups.push({ key, date: startOfLocalDay(slot), slots: [slot] })
  }
  return groups
}

export function formatDayChip(date: Date, now = new Date()) {
  const today = startOfLocalDay(now)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const target = startOfLocalDay(date)
  if (target.getTime() === today.getTime()) return { eyebrow: 'Today', label: formatShortDay(date) }
  if (target.getTime() === tomorrow.getTime()) return { eyebrow: 'Tomorrow', label: formatShortDay(date) }
  return {
    eyebrow: new Intl.DateTimeFormat('en-PH', { weekday: 'short' }).format(date),
    label: formatShortDay(date),
  }
}

function formatShortDay(date: Date) {
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(date)
}

export function validateScheduledAt(iso: string, settings: PresentationSettings, now = new Date()) {
  const scheduled = new Date(iso)
  if (Number.isNaN(scheduled.getTime())) return 'Choose a valid date and time.'
  if (scheduled.getTime() < now.getTime() + Math.max(0, settings.minimum_lead_minutes) * 60_000) {
    return 'That time is too soon. Pick a later slot.'
  }
  const max = startOfLocalDay(now)
  max.setDate(max.getDate() + Math.max(0, settings.maximum_advance_days) + 1)
  if (scheduled >= max) return 'That date is too far ahead.'

  const { hours: startH, minutes: startM } = parseHm(settings.availability_start)
  const { hours: endH, minutes: endM } = parseHm(settings.availability_end)
  const minutes = scheduled.getHours() * 60 + scheduled.getMinutes()
  const startMin = startH * 60 + startM
  const endMin = endH * 60 + endM
  if (minutes < startMin || minutes > endMin) {
    return `Presentations are available from ${settings.availability_start} to ${settings.availability_end}.`
  }
  return null
}

export function formatPresentationDate(iso: string, timeZone = 'Asia/Manila') {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatPresentationTime(iso: string, timeZone = 'Asia/Manila') {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

export function timezoneLabel(timeZone: string) {
  if (timeZone === 'Asia/Manila') return 'Philippine Time (PHT)'
  return timeZone
}

export function pad2(value: number) {
  return String(Math.max(0, value)).padStart(2, '0')
}

export function splitRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return { days, hours, minutes, seconds, totalSeconds: total }
}
