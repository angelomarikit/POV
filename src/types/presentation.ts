export type PresentationFlowState = 'unscheduled' | 'waiting' | 'ready' | 'watching' | 'completed'

export type VideoType = 'general' | 'testimonial' | 'presentation'

export interface PresentationSettings {
  enabled: boolean
  scheduling_enabled: boolean
  section_title: string
  headline: string
  description: string
  presentation_title: string
  presentation_description: string
  cta_label: string
  cta_url: string | null
  availability_start: string
  availability_end: string
  interval_minutes: number
  minimum_lead_minutes: number
  maximum_advance_days: number
  timezone: string
  is_published: boolean
}

export interface StoredPresentationSchedule {
  scheduledAt: string
  createdAt: string
  siteSlug: string
  completed?: boolean
}

export const PRESENTATION_SETTING_KEY = 'pov_presentation'
export const PRESENTATION_SCHEDULE_KEY = 'pov_presentation_schedule_v1'

export const DEFAULT_PRESENTATION_SETTINGS: PresentationSettings = {
  enabled: true,
  scheduling_enabled: true,
  section_title: 'Know More About POV',
  headline: 'Discover the Community Behind the Vision',
  description: 'Choose a convenient time to watch our Pinoy Online Venture presentation. While you wait, explore real stories and testimonials from our community.',
  presentation_title: 'Pinoy Online Venture Presentation',
  presentation_description: 'Learn about our community, opportunities, and how you can be part of the journey.',
  cta_label: 'Message us',
  cta_url: null,
  availability_start: '08:00',
  availability_end: '22:00',
  interval_minutes: 30,
  minimum_lead_minutes: 5,
  maximum_advance_days: 7,
  timezone: 'Asia/Manila',
  is_published: true,
}
