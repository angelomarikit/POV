import { SITE_SLUG, SITE_URL } from '../config/site'
import { TABLES } from '../config/tables'
import { supabase } from '../lib/supabase'
import type { Event, EventRegistrant, EventRegistrationInput, RegistrantStatus } from '../types'
import { generatePassCode, normalizePassCode } from '../utils/passes'

async function dataOrThrow<T>(promise: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await promise
  if (error) throw new Error(error.message)
  return data as T
}

const REGISTRANT_SELECT = `*, pov_events:${TABLES.events}(id, title, slug, start_date, location, pass_brand_label, registration_status_label, poster_image_url, cover_image_url)`

export const passQueryKeys = {
  pass: (code: string) => ['event-pass', SITE_SLUG, code] as const,
  registrants: (eventId: string) => ['event-registrants', SITE_SLUG, eventId] as const,
  stats: (eventId: string) => ['event-registrant-stats', SITE_SLUG, eventId] as const,
}

function nextPassCode(brand = 'POV') {
  return generatePassCode(brand)
}

function absoluteAppUrl(path: string) {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (SITE_URL) return `${SITE_URL}${clean}`
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${clean}`
  }
  return clean
}

/** Public pass page URL (guest can reopen their pass). */
export function passPublicUrl(code: string) {
  return absoluteAppUrl(`/pass/${encodeURIComponent(normalizePassCode(code))}`)
}

/**
 * Payload encoded in the POV-generated confirmation QR.
 * Staff Console scans this to confirm / check in the registrant.
 */
export function passQrValue(code: string) {
  return passPublicUrl(code)
}

/** POV-generated registration QR target — opens the Get Your QR Pass form. */
export function eventRegisterUrl(slug: string) {
  return absoluteAppUrl(`/events/${encodeURIComponent(slug)}/register`)
}

export async function registerForEvent(input: EventRegistrationInput): Promise<EventRegistrant> {
  const first = input.first_name.trim()
  const family = input.family_name.trim()
  const mobile = input.mobile?.trim() || ''
  if (!first || !family) throw new Error('First name and family name are required.')
  if (!mobile) throw new Error('Mobile number is required.')

  const event = await dataOrThrow<Pick<Event, 'id' | 'registration_enabled' | 'is_published' | 'pass_brand_label'> | null>(
    supabase.from(TABLES.events).select('id, registration_enabled, is_published, pass_brand_label').eq('site_slug', SITE_SLUG).eq('id', input.event_id).maybeSingle(),
  )
  if (!event?.is_published || !event.registration_enabled) {
    throw new Error('Registration is not open for this event.')
  }

  const email = input.email?.trim().toLowerCase() || null
  if (email) {
    const existing = await findPass(input.event_id, email)
    if (existing) return existing
  }

  const brand = event.pass_brand_label || 'POV'
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const pass_code = nextPassCode(brand)
    const payload = {
      site_slug: SITE_SLUG,
      event_id: input.event_id,
      first_name: first,
      family_name: family,
      mobile,
      email,
      city: input.city?.trim() || null,
      invited_by: input.invited_by?.trim() || null,
      role: input.role || 'guest',
      pass_code,
      status: 'confirmed' as RegistrantStatus,
    }
    // Insert without RETURNING — anon guests have insert but not list/select RLS.
    const { error } = await supabase.from(TABLES.registrants).insert(payload)
    if (!error) {
      const created = await getPassByCode(pass_code)
      if (created) return created
    }
    if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message)
  }
  throw new Error('Unable to create your pass. Please try again.')
}

async function attachEvent(row: EventRegistrant | null): Promise<EventRegistrant | null> {
  if (!row) return null
  const event = await dataOrThrow<EventRegistrant['pov_events']>(
    supabase.from(TABLES.events).select('id, title, slug, start_date, location, pass_brand_label, registration_status_label, poster_image_url, cover_image_url').eq('id', row.event_id).maybeSingle(),
  )
  return { ...row, pov_events: event }
}

export async function getPassByCode(code: string): Promise<EventRegistrant | null> {
  const pass_code = normalizePassCode(code)
  if (!pass_code) return null
  const rows = await dataOrThrow<EventRegistrant[]>(
    supabase.rpc('pov_get_pass_by_code', { p_code: pass_code }),
  )
  return attachEvent(rows[0] || null)
}

export async function findPass(eventId: string, email: string): Promise<EventRegistrant | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) throw new Error('Enter the email used during registration.')
  const rows = await dataOrThrow<EventRegistrant[]>(
    supabase.rpc('pov_find_pass', { p_event_id: eventId, p_email: normalized }),
  )
  return attachEvent(rows[0] || null)
}

export async function listRegistrants(eventId: string): Promise<EventRegistrant[]> {
  return dataOrThrow<EventRegistrant[]>(
    supabase.from(TABLES.registrants).select(REGISTRANT_SELECT).eq('site_slug', SITE_SLUG).eq('event_id', eventId).order('created_at', { ascending: false }),
  )
}

export async function getRegistrantStats(eventId: string) {
  const rows = await listRegistrants(eventId)
  const active = rows.filter(row => row.status !== 'cancelled')
  return {
    confirmed: active.length,
    checkedIn: active.filter(row => row.status === 'checked_in' || Boolean(row.checked_in_at)).length,
    rows: active,
  }
}

export async function checkInByCode(code: string, adminId?: string | null): Promise<EventRegistrant> {
  const pass = await getPassByCode(code)
  if (!pass) throw new Error('Pass not found.')
  if (pass.status === 'cancelled') throw new Error('This pass was cancelled.')
  if (pass.status === 'checked_in' || pass.checked_in_at) return pass

  const rows = await dataOrThrow<EventRegistrant[]>(
    supabase.from(TABLES.registrants).update({
      status: 'checked_in',
      checked_in_at: new Date().toISOString(),
      checked_in_by: adminId || null,
    }).eq('id', pass.id).eq('site_slug', SITE_SLUG).select('*'),
  )
  if (!rows[0]) throw new Error('Unable to check in this pass.')
  return (await attachEvent(rows[0]))!
}

export async function createWalkIn(input: EventRegistrationInput & { check_in?: boolean }, adminId?: string | null): Promise<EventRegistrant> {
  const created = await registerForEvent(input)
  if (input.check_in) return checkInByCode(created.pass_code, adminId)
  return created
}

export async function getRegistrationEvents(includeUnpublished = false): Promise<Event[]> {
  let query = supabase.from(TABLES.events).select('*').eq('site_slug', SITE_SLUG).eq('registration_enabled', true).order('start_date', { ascending: true })
  if (!includeUnpublished) query = query.eq('is_published', true)
  return dataOrThrow<Event[]>(query)
}
