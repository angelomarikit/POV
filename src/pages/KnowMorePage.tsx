import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, CheckCircle2, Clock3, MessageCircle, Play, Sparkles, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { EmptyState, MessengerCTA, YouTubeEmbed } from '../components/common/UI'
import { useCountdown } from '../hooks/useCountdown'
import { usePresentationSchedule } from '../hooks/usePresentationSchedule'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { isSupabaseConfigured } from '../lib/supabase'
import { SOCIAL_DEFAULTS } from '../config/site'
import {
  getContactCtas,
  getMainPresentation,
  getPresentationSettings,
  getTestimonialVideos,
  queryKeys,
} from '../services/content'
import type { PresentationFlowState, PresentationSettings } from '../types/presentation'
import type { Video } from '../types'
import {
  formatDayChip,
  formatPresentationDate,
  formatPresentationTime,
  generateAvailableSlots,
  groupSlotsByDay,
  pad2,
  timezoneLabel,
  validateScheduledAt,
} from '../utils/schedule'
import { extractYouTubeVideoId, getYouTubeThumbnail } from '../utils/youtube'

function track(event: string, detail?: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent('pov-analytics', { detail: { event, ...detail } }))
}

function CountdownDisplay({ days, hours, minutes, seconds }: { days: number; hours: number; minutes: number; seconds: number }) {
  const cells = days > 0
    ? [
        { value: pad2(days), label: 'Days' },
        { value: pad2(hours), label: 'Hours' },
        { value: pad2(minutes), label: 'Min' },
        { value: pad2(seconds), label: 'Sec' },
      ]
    : [
        { value: pad2(hours), label: 'Hours' },
        { value: pad2(minutes), label: 'Minutes' },
        { value: pad2(seconds), label: 'Seconds' },
      ]

  return (
    <div className={`grid gap-2 sm:gap-3 ${cells.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`} aria-hidden="true">
      {cells.map(cell => (
        <div key={cell.label} className="rounded-2xl border border-orange-500/30 bg-black/40 px-2 py-4 text-center shadow-[0_0_40px_-18px_rgba(249,115,22,.8)]">
          <strong className="block font-mono text-3xl font-black tracking-tight text-white sm:text-4xl">{cell.value}</strong>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[.16em] text-orange-400">{cell.label}</span>
        </div>
      ))}
    </div>
  )
}

function TestimonialCard({ video }: { video: Video }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <YouTubeEmbed url={video.youtube_url} title={video.title} poster={video.thumbnail_url} rounded={false} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white">{video.title}</h3>
            {video.speaker_name && <p className="mt-1 text-xs font-semibold text-orange-400">{video.speaker_name}</p>}
          </div>
          {video.duration_minutes ? <span className="shrink-0 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold text-orange-300">{video.duration_minutes} min</span> : null}
        </div>
        {video.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-400">{video.description}</p>}
      </div>
    </article>
  )
}

function Scheduler({ settings, onSchedule }: { settings: PresentationSettings; onSchedule: (iso: string) => void }) {
  const days = useMemo(() => groupSlotsByDay(generateAvailableSlots(settings)), [settings])
  const [dayKeySelected, setDayKeySelected] = useState(days[0]?.key || '')
  const selectedDay = days.find(day => day.key === dayKeySelected) || days[0]
  const [selected, setSelected] = useState(selectedDay?.slots[0]?.toISOString() || '')
  const [error, setError] = useState('')

  const pickDay = (key: string) => {
    const day = days.find(item => item.key === key)
    setDayKeySelected(key)
    setSelected(day?.slots[0]?.toISOString() || '')
    setError('')
  }

  const submit = () => {
    const message = validateScheduledAt(selected, settings)
    if (message) {
      setError(message)
      return
    }
    setError('')
    onSchedule(selected)
    track('presentation_schedule_created', { scheduledAt: selected })
  }

  if (!days.length || !selectedDay) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-neutral-300">No available presentation times right now. Please check back soon.</div>
  }

  const chip = formatDayChip(selectedDay.date)

  return (
    <div className="rounded-[1.75rem] border border-orange-500/25 bg-gradient-to-b from-white/10 to-white/[.03] p-5 shadow-[0_30px_80px_-40px_rgba(249,115,22,.55)]">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-orange-500 text-white"><CalendarClock size={20} /></span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-400">Choose viewing schedule</p>
          <h2 className="text-lg font-black text-white">When would you like to watch?</h2>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-bold text-neutral-300">1. Pick a day</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map(day => {
            const label = formatDayChip(day.date)
            const active = day.key === selectedDay.key
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => pickDay(day.key)}
                className={`focus-ring min-w-[4.75rem] shrink-0 rounded-2xl border px-3 py-3 text-center transition ${active ? 'border-orange-500 bg-orange-500 text-white' : 'border-white/15 bg-black/30 text-neutral-300'}`}
              >
                <span className={`block text-[10px] font-bold uppercase tracking-wider ${active ? 'text-orange-100' : 'text-orange-400'}`}>{label.eyebrow}</span>
                <span className="mt-1 block text-sm font-black">{label.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-end justify-between gap-3">
          <p className="text-sm font-bold text-neutral-300">2. Pick a time</p>
          <p className="text-[11px] text-neutral-500">{timezoneLabel(settings.timezone)}</p>
        </div>
        <p className="mb-3 text-xs text-neutral-400">{chip.eyebrow} · {formatPresentationDate(selectedDay.date.toISOString(), settings.timezone)}</p>
        <div className="grid grid-cols-3 gap-2">
          {selectedDay.slots.map(slot => {
            const iso = slot.toISOString()
            const active = selected === iso
            return (
              <button
                key={iso}
                type="button"
                onClick={() => { setSelected(iso); setError('') }}
                className={`focus-ring min-h-11 rounded-xl border px-2 text-sm font-bold transition ${active ? 'border-orange-500 bg-orange-500 text-white' : 'border-white/15 bg-black/30 text-neutral-200 active:bg-white/10'}`}
              >
                {formatPresentationTime(iso, settings.timezone)}
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <p className="mt-4 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-center text-sm text-neutral-300">
          Selected: <strong className="text-white">{formatPresentationTime(selected, settings.timezone)}</strong>
          <span className="block text-xs text-neutral-500">{formatDayChip(new Date(selected)).eyebrow}, {formatDayChip(new Date(selected)).label}</span>
        </p>
      )}

      {error && <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}
      <button type="button" onClick={submit} disabled={!selected} className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-50">
        Schedule presentation
      </button>
    </div>
  )
}

function deriveState(args: {
  hydrated: boolean
  scheduledAt: string | null
  completed: boolean
  watching: boolean
  isReady: boolean
}): PresentationFlowState {
  if (!args.hydrated) return 'unscheduled'
  if (args.completed) return 'completed'
  if (args.watching) return 'watching'
  if (!args.scheduledAt) return 'unscheduled'
  if (args.isReady) return 'ready'
  return 'waiting'
}

export default function KnowMorePage() {
  const settingsQuery = useQuery({ queryKey: queryKeys.presentation, queryFn: getPresentationSettings, enabled: isSupabaseConfigured, retry: false })
  const presentationQuery = useQuery({ queryKey: [...queryKeys.videos, 'presentation'], queryFn: () => getMainPresentation(), enabled: isSupabaseConfigured, retry: false })
  const testimonialsQuery = useQuery({ queryKey: [...queryKeys.videos, 'testimonials'], queryFn: () => getTestimonialVideos(), enabled: isSupabaseConfigured, retry: false })
  const ctasQuery = useQuery({ queryKey: queryKeys.ctas, queryFn: getContactCtas, enabled: isSupabaseConfigured, retry: false })

  const settings = settingsQuery.data
  const catalogPresentation = presentationQuery.data
  const testimonials = testimonialsQuery.data || []
  const messenger = settings?.cta_url || ctasQuery.data?.find(item => item.is_active)?.messenger_url || SOCIAL_DEFAULTS.facebook

  const settingsYoutubeUrl = settings?.presentation_youtube_url?.trim() || ''
  const waitingYoutubeUrl = settings?.waiting_youtube_url?.trim() || ''
  const hasWaitingVideo = Boolean(extractYouTubeVideoId(waitingYoutubeUrl))
  const presentationUrl = extractYouTubeVideoId(settingsYoutubeUrl)
    ? settingsYoutubeUrl
    : catalogPresentation?.youtube_url || ''
  const presentationTitle = settings?.presentation_title || catalogPresentation?.title || 'Pinoy Online Venture Presentation'
  const presentationDescription = settings?.presentation_description || catalogPresentation?.description || ''
  const presentationPoster = catalogPresentation?.thumbnail_url || (presentationUrl ? getYouTubeThumbnail(presentationUrl) : null)
  const hasPresentation = Boolean(presentationUrl)

  useDocumentMeta(
    settings?.section_title || 'Know More About POV',
    settings?.description || 'Schedule and watch the Pinoy Online Venture presentation.',
  )

  const scheduleApi = usePresentationSchedule()
  const countdown = useCountdown(scheduleApi.scheduledAt)
  const state = deriveState({
    hydrated: scheduleApi.hydrated,
    scheduledAt: scheduleApi.scheduledAt,
    completed: scheduleApi.completed,
    watching: scheduleApi.watching,
    isReady: countdown.isReady,
  })

  const [confirmReschedule, setConfirmReschedule] = useState(false)
  const autoStartedRef = useRef(false)

  // When countdown hits zero, open the presentation player and autoplay immediately.
  useEffect(() => {
    if (!scheduleApi.hydrated || scheduleApi.completed || scheduleApi.watching) return
    if (!scheduleApi.scheduledAt || !countdown.isReady || !hasPresentation) return
    if (autoStartedRef.current) return
    autoStartedRef.current = true
    scheduleApi.startWatching()
    track('presentation_unlocked')
    track('presentation_started', { auto: true })
  }, [
    scheduleApi.hydrated,
    scheduleApi.completed,
    scheduleApi.watching,
    scheduleApi.scheduledAt,
    scheduleApi.startWatching,
    countdown.isReady,
    hasPresentation,
  ])

  useEffect(() => {
    if (!countdown.isReady) autoStartedRef.current = false
  }, [countdown.isReady])

  const recommended = useMemo(() => {
    if (!scheduleApi.scheduledAt || countdown.isReady) return testimonials
    const remainingMinutes = Math.max(1, Math.ceil(countdown.remainingMs / 60_000))
    let used = 0
    const picked: Video[] = []
    for (const video of testimonials) {
      const duration = video.duration_minutes || 8
      if (used + duration <= remainingMinutes + 5 || picked.length < 2) {
        picked.push(video)
        used += duration
      }
      if (picked.length >= 6) break
    }
    return picked.length ? picked : testimonials.slice(0, 3)
  }, [countdown.isReady, countdown.remainingMs, scheduleApi.scheduledAt, testimonials])

  if (settingsQuery.isLoading || !settings) {
    return <div className="bg-[#0b0b0c] px-5 py-10"><div className="skeleton h-48 rounded-3xl" /><div className="skeleton mt-4 h-32 rounded-3xl" /></div>
  }

  if (!settings.is_published || !settings.enabled) {
    return <section className="bg-[#0b0b0c] px-5 py-12"><EmptyState title="Presentation coming soon" description="The Pinoy Online Venture presentation is being prepared. Please check back shortly." /></section>
  }

  const tz = settings.timezone
  const ctaLabel = settings.cta_label || 'Message us'
  const autoPlayPresentation = state === 'watching' && !scheduleApi.completed

  return (
    <div className="bg-[#0b0b0c] text-white">
      <section className="relative overflow-hidden px-5 pb-8 pt-8">
        <div className="absolute -right-16 -top-20 size-56 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-orange-300">
            <Sparkles size={13} />{settings.section_title}
          </span>
          <h1 className="mt-4 text-[30px] font-black leading-[1.08] tracking-tight">{settings.headline}</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-400">{settings.description}</p>
        </div>
      </section>

      <section className="px-5 pb-12">
        {state === 'unscheduled' && (
          settings.scheduling_enabled
            ? <Scheduler settings={settings} onSchedule={iso => scheduleApi.schedule(iso)} />
            : <div className="rounded-[1.75rem] border border-orange-500/25 bg-white/5 p-5">
                <h2 className="text-xl font-black">{presentationTitle}</h2>
                <p className="mt-2 text-sm text-neutral-400">{presentationDescription}</p>
                {!hasPresentation
                  ? <p className="mt-5 rounded-xl bg-white/5 p-4 text-sm text-neutral-400">Add a YouTube URL in Admin → POV Presentation.</p>
                  : <button
                      type="button"
                      onClick={() => {
                        scheduleApi.schedule(new Date().toISOString())
                        scheduleApi.startWatching()
                        track('presentation_started')
                      }}
                      className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 font-bold text-white"
                    >
                      <Play size={18} fill="currentColor" />Watch presentation now
                    </button>}
              </div>
        )}

        {state === 'waiting' && scheduleApi.scheduledAt && (
          <div className="space-y-5">
            <div className="rounded-[1.75rem] border border-orange-500/25 bg-gradient-to-b from-orange-500/10 to-transparent p-5">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-400">Your presentation is scheduled</p>
              <p className="mt-2 text-lg font-black">{formatPresentationDate(scheduleApi.scheduledAt, tz)}</p>
              <p className="text-sm text-neutral-300">{formatPresentationTime(scheduleApi.scheduledAt, tz)} · {timezoneLabel(tz)}</p>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[.2em] text-neutral-400">Your presentation starts in</p>
                <CountdownDisplay {...countdown.parts} />
              </motion.div>

              <button type="button" onClick={() => setConfirmReschedule(true)} className="mt-5 w-full text-center text-sm font-semibold text-neutral-400 underline-offset-2 hover:text-orange-300 hover:underline">
                Change schedule
              </button>
            </div>

            <div>
              <p className="eyebrow">While you wait</p>
              <h2 className="mt-1.5 text-xl font-black">{settings.waiting_title || 'While you wait'}</h2>
              <p className="mt-2 text-sm text-neutral-400">{settings.waiting_description || 'Watch this video while your presentation countdown is running.'}</p>

              {hasWaitingVideo ? (
                <article className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                  <YouTubeEmbed
                    url={waitingYoutubeUrl}
                    title={settings.waiting_title || 'Waiting room video'}
                    poster={getYouTubeThumbnail(waitingYoutubeUrl)}
                    rounded={false}
                  />
                </article>
              ) : null}

              {recommended.length ? (
                <div className={`grid gap-4 ${hasWaitingVideo ? 'mt-4' : 'mt-5'}`}>
                  {recommended.map(video => <TestimonialCard key={video.id} video={video} />)}
                </div>
              ) : !hasWaitingVideo ? (
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-400">
                  Your presentation is scheduled. Please return when the countdown reaches zero.
                </div>
              ) : null}
            </div>
          </div>
        )}

        {(state === 'ready' || state === 'watching' || state === 'completed') && (
          <div className="space-y-5">
            {state === 'ready' && (
              <div className="rounded-[1.75rem] border border-orange-500/25 bg-gradient-to-b from-orange-500/10 to-transparent p-5 text-center" role="status" aria-live="polite">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-orange-500 text-white"><CheckCircle2 size={28} /></span>
                <h2 className="mt-4 text-2xl font-black">Your presentation is ready</h2>
                <p className="mt-2 text-sm text-neutral-400">
                  {hasPresentation ? 'Starting your Pinoy Online Venture presentation…' : 'Add a YouTube URL in Admin → POV Presentation.'}
                </p>
                {hasPresentation && (
                  <button
                    type="button"
                    onClick={() => { scheduleApi.startWatching(); track('presentation_unlocked'); track('presentation_started') }}
                    className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 font-bold text-white"
                  >
                    <Play size={18} fill="currentColor" />Watch presentation
                  </button>
                )}
              </div>
            )}

            {(state === 'watching' || state === 'completed') && (
              !hasPresentation ? (
                <EmptyState title="Presentation unavailable" description="Add a YouTube URL in Admin → POV Presentation, or publish a Presentation video." />
              ) : (
                <article className="overflow-hidden rounded-[1.75rem] border border-orange-500/20 bg-[#111113]">
                  <YouTubeEmbed
                    url={presentationUrl}
                    title={presentationTitle}
                    poster={presentationPoster}
                    rounded={false}
                    autoPlay={autoPlayPresentation}
                  />
                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-400">Main presentation</p>
                    <h2 className="mt-2 text-2xl font-black">{presentationTitle}</h2>
                    {presentationDescription && <p className="mt-3 text-sm leading-6 text-neutral-400">{presentationDescription}</p>}
                    {autoPlayPresentation && (
                      <p className="mt-3 text-xs text-neutral-500">Video starts automatically (muted so browsers allow playback). Tap the speaker icon on the player to unmute.</p>
                    )}
                    <div className="mt-6">
                      <MessengerCTA label={ctaLabel} url={messenger} className="w-full" />
                    </div>
                    {state === 'watching' && (
                      <button type="button" onClick={() => scheduleApi.markCompleted()} className="mt-4 w-full text-sm font-semibold text-neutral-400 underline-offset-2 hover:text-orange-300 hover:underline">
                        I’ve finished watching
                      </button>
                    )}
                  </div>
                </article>
              )
            )}

            {state === 'completed' && (
              <div className="rounded-[1.75rem] bg-orange-500 p-6 text-white">
                <h2 className="text-2xl font-black">Thank you for watching</h2>
                <p className="mt-3 text-sm leading-6 text-orange-50">Now that you’ve learned more about Pinoy Online Venture, connect with our community and discover how you can be part of the journey.</p>
                <div className="mt-6 grid gap-2.5">
                  <a href={messenger} target="_blank" rel="noopener noreferrer" onClick={() => track('messenger_cta_clicked')} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b0b0c] font-bold">
                    <MessageCircle size={18} />{ctaLabel}
                  </a>
                  <Link to="/community" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/30 font-bold"><Users size={18} />Explore community</Link>
                  <Link to="/events" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/30 font-bold"><Clock3 size={18} />View events</Link>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {confirmReschedule && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-5" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-[var(--text-primary)]">
            <h2 className="text-xl font-black">Change schedule?</h2>
            <p className="mt-2 text-sm text-neutral-600">This will replace your current presentation time and reset the countdown.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setConfirmReschedule(false)} className="focus-ring flex-1 rounded-full border border-neutral-200 py-3 text-sm font-bold">Cancel</button>
              <button type="button" onClick={() => { scheduleApi.clearSchedule(); setConfirmReschedule(false); autoStartedRef.current = false }} className="focus-ring flex-1 rounded-full bg-orange-500 py-3 text-sm font-bold text-white">Change</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
