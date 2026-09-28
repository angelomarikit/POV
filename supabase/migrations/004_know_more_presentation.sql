-- Know More About POV: video types + public presentation settings.
-- Safe for the shared database: only pov_ objects are touched.

begin;

-- Existing videos remain usable as "general" (Events video library).
alter table public.pov_videos
  add column if not exists video_type text not null default 'general',
  add column if not exists speaker_name text,
  add column if not exists duration_minutes integer,
  add column if not exists display_order integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pov_videos_video_type_check'
  ) then
    alter table public.pov_videos
      add constraint pov_videos_video_type_check
      check (video_type in ('general', 'testimonial', 'presentation'));
  end if;
end $$;

create index if not exists pov_videos_site_type_idx
  on public.pov_videos(site_slug, video_type, is_published, display_order);

-- Public visitors need the presentation schedule config; other keys stay admin-only.
drop policy if exists "pov_site_settings_admin_read" on public.pov_site_settings;
drop policy if exists "pov_site_settings_public_read" on public.pov_site_settings;
create policy "pov_site_settings_public_read"
  on public.pov_site_settings for select
  using (
    setting_key = 'pov_presentation'
    or public.pov_is_admin()
  );

-- Seed default presentation settings for this site (idempotent).
insert into public.pov_site_settings (site_slug, setting_key, setting_value)
values (
  'pinoy-online-venture',
  'pov_presentation',
  jsonb_build_object(
    'enabled', true,
    'scheduling_enabled', true,
    'section_title', 'Know More About POV',
    'headline', 'Discover the Community Behind the Vision',
    'description', 'Choose a convenient time to watch our Pinoy Online Venture presentation. While you wait, explore real stories and testimonials from our community.',
    'presentation_title', 'Pinoy Online Venture Presentation',
    'presentation_description', 'Learn about our community, opportunities, and how you can be part of the journey.',
    'cta_label', 'Message us',
    'cta_url', null,
    'availability_start', '08:00',
    'availability_end', '22:00',
    'interval_minutes', 30,
    'minimum_lead_minutes', 5,
    'maximum_advance_days', 7,
    'timezone', 'Asia/Manila',
    'is_published', true
  )
)
on conflict (site_slug, setting_key) do nothing;

commit;
