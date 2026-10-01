import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Save } from 'lucide-react'
import { Button } from '../../components/common/UI'
import { getPresentationSettings, queryKeys, savePresentationSettings } from '../../services/content'
import { DEFAULT_PRESENTATION_SETTINGS, type PresentationSettings } from '../../types/presentation'
import { extractYouTubeVideoId } from '../../utils/youtube'

export default function AdminPresentationPage() {
  const client = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: [...queryKeys.presentation, 'admin'], queryFn: getPresentationSettings })
  const [values, setValues] = useState<PresentationSettings>(DEFAULT_PRESENTATION_SETTINGS)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (data) setValues(data)
  }, [data])

  const save = useMutation({
    mutationFn: async () => {
      const waitingUrl = values.waiting_youtube_url.trim()
      const presentationUrl = values.presentation_youtube_url.trim()
      if (waitingUrl && !extractYouTubeVideoId(waitingUrl)) {
        throw new Error('Waiting-room YouTube URL is invalid. Use a watch, Shorts, youtu.be, or embed link.')
      }
      if (presentationUrl && !extractYouTubeVideoId(presentationUrl)) {
        throw new Error('Main presentation YouTube URL is invalid. Use a watch, Shorts, youtu.be, or embed link.')
      }
      return savePresentationSettings({
        ...values,
        waiting_youtube_url: waitingUrl,
        presentation_youtube_url: presentationUrl,
      })
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.presentation })
      setError('')
      setMessage('Presentation settings saved.')
    },
    onError: reason => {
      setMessage('')
      setError(reason instanceof Error ? reason.message : 'Unable to save settings.')
    },
  })

  const set = <K extends keyof PresentationSettings>(key: K, value: PresentationSettings[K]) => {
    setValues(current => ({ ...current, [key]: value }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  if (isLoading) return <div className="skeleton h-80 rounded-2xl" />

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-orange-600">Content management</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">POV Presentation</h1>
          <p className="mt-2 text-sm text-neutral-500">Set the waiting-room video and the main presentation video (after countdown), plus schedule and CTA options.</p>
        </div>
        <Link to="/know-more" target="_blank" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-bold">
          <ExternalLink size={16} />View public page
        </Link>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-black">Presentation settings</h2>
          <div className="mt-4 space-y-4">
            <Toggle label="Published / active" checked={values.is_published && values.enabled} onChange={checked => { set('is_published', checked); set('enabled', checked) }} />
            <Field label="Section title" value={values.section_title} onChange={value => set('section_title', value)} />
            <Field label="Headline" value={values.headline} onChange={value => set('headline', value)} />
            <Area label="Description" value={values.description} onChange={value => set('description', value)} />
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-orange-600">Video 1 · During countdown</p>
          <h2 className="mt-1 text-lg font-black">Waiting-room video</h2>
          <p className="mt-1 text-sm text-neutral-500">Shown on Know More while visitors wait for their scheduled presentation time.</p>
          <div className="mt-4 space-y-4">
            <Field label="YouTube URL" type="url" value={values.waiting_youtube_url} onChange={value => set('waiting_youtube_url', value)} />
            <Field label="Title" value={values.waiting_title} onChange={value => set('waiting_title', value)} />
            <Area label="Description" value={values.waiting_description} onChange={value => set('waiting_description', value)} />
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-orange-600">Video 2 · After countdown</p>
          <h2 className="mt-1 text-lg font-black">Main presentation video</h2>
          <p className="mt-1 text-sm text-neutral-500">Appears automatically when the countdown finishes and starts playing right away.</p>
          <div className="mt-4 space-y-4">
            <Field label="YouTube URL" type="url" value={values.presentation_youtube_url} onChange={value => set('presentation_youtube_url', value)} />
            <Field label="Title" value={values.presentation_title} onChange={value => set('presentation_title', value)} />
            <Area label="Description" value={values.presentation_description} onChange={value => set('presentation_description', value)} />
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-black">Schedule settings</h2>
          <div className="mt-4 space-y-4">
            <Toggle label="Scheduling enabled" checked={values.scheduling_enabled} onChange={checked => set('scheduling_enabled', checked)} />
            <p className="text-xs text-neutral-500">If scheduling is off, visitors can watch the main presentation immediately.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Available from" type="time" value={values.availability_start} onChange={value => set('availability_start', value)} />
              <Field label="Available until" type="time" value={values.availability_end} onChange={value => set('availability_end', value)} />
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Interval</span>
              <select value={values.interval_minutes} onChange={event => set('interval_minutes', Number(event.target.value))} className="focus-ring h-12 w-full rounded-xl border border-neutral-200 px-4 outline-none">
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Minimum lead time (minutes)" type="number" value={String(values.minimum_lead_minutes)} onChange={value => set('minimum_lead_minutes', Number(value) || 0)} />
              <Field label="Maximum advance days" type="number" value={String(values.maximum_advance_days)} onChange={value => set('maximum_advance_days', Number(value) || 0)} />
            </div>
            <Field label="Timezone" value={values.timezone} onChange={value => set('timezone', value)} />
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-black">CTA settings</h2>
          <div className="mt-4 space-y-4">
            <Field label="Messenger button label" value={values.cta_label} onChange={value => set('cta_label', value)} />
            <Field label="Messenger URL" type="url" value={values.cta_url || ''} onChange={value => set('cta_url', value || null)} />
            <p className="text-xs text-neutral-500">Leave the URL empty to use the first active CTA from CTA / Messenger.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-5 text-sm text-neutral-700">
          <strong className="block font-black text-orange-800">Extra testimonial clips (optional)</strong>
          <p className="mt-2">You can still add more waiting-room clips in <Link to="/admin/videos" className="font-bold text-orange-700">Videos</Link> (type <strong>Testimonial</strong>). They appear under the main waiting video.</p>
        </section>

        {message && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</p>}
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto"><Save size={17} />{save.isPending ? 'Saving…' : 'Save presentation settings'}</Button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span><input type={type} value={value} onChange={event => onChange(event.target.value)} className="focus-ring h-12 w-full rounded-xl border border-neutral-200 px-4 outline-none" /></label>
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span><textarea rows={4} value={value} onChange={event => onChange(event.target.value)} className="focus-ring w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none" /></label>
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center justify-between rounded-xl border border-neutral-200 p-4"><span className="font-semibold">{label}</span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="size-5 accent-orange-500" /></label>
}
