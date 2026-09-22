-- =============================================================================
-- Pinoy Online Venture — tenant schema
-- =============================================================================
-- This Supabase project is shared by several live websites. Every object below
-- is prefixed with "pov_" so this migration can never create, alter, replace or
-- drop anything belonging to another tenant.
--
-- Deliberately NOT touched by this file:
--   * public.sites            (shared tenant registry owned by the landing app)
--   * public.profiles         (shared, different role model)
--   * public.set_updated_at() (shared trigger function)
--   * public.handle_new_user() and the auth.users signup trigger
--   * any storage bucket other than "pov-media"
--
-- Safe to run more than once.
-- =============================================================================

begin;

create extension if not exists "pgcrypto";

-- Our own trigger function, so the shared public.set_updated_at() is left alone.
create or replace function public.pov_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- -----------------------------------------------------------------------------
-- Admin access
-- -----------------------------------------------------------------------------
-- A dedicated allow-list instead of a shared profiles table. No trigger is added
-- to auth.users, so signups for the other websites are unaffected. Grant access
-- by inserting a row here (see supabase/README.md).

create table if not exists public.pov_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'editor' check (role in ('admin','editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.pov_is_admin()
returns boolean security definer stable set search_path = public language sql as $$
  select exists (
    select 1 from public.pov_admins
    where id = auth.uid() and role in ('admin','editor')
  );
$$;

-- -----------------------------------------------------------------------------
-- Content tables
-- -----------------------------------------------------------------------------
-- site_slug keeps the data scoped to VITE_SITE_SLUG. It is a plain column rather
-- than a foreign key to public.sites so this schema stays fully independent.

create table if not exists public.pov_site_content (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  section_key text not null,
  title text,
  subtitle text,
  body text,
  image_url text,
  button_text text,
  button_url text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_slug, section_key)
);

create table if not exists public.pov_member_categories (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  name text not null,
  slug text not null,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_slug, slug)
);

create table if not exists public.pov_members (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  category_id uuid references public.pov_member_categories(id) on delete set null,
  name text not null,
  slug text not null,
  role text,
  short_description text,
  bio text,
  profile_image_url text,
  company text,
  occupation text,
  location text,
  facebook_url text,
  messenger_url text,
  tiktok_url text,
  youtube_url text,
  website_url text,
  joined_at date,
  featured boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_slug, slug)
);

create table if not exists public.pov_events (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  title text not null,
  slug text not null,
  cover_image_url text,
  short_description text,
  description text,
  start_date timestamptz not null,
  end_date timestamptz,
  location text,
  maps_url text,
  cta_label text,
  cta_url text,
  status text check (status is null or status in ('upcoming','ongoing','completed')),
  featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_slug, slug),
  check (end_date is null or end_date >= start_date)
);

create table if not exists public.pov_event_gallery (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  event_id uuid not null references public.pov_events(id) on delete cascade,
  image_url text not null,
  caption text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pov_videos (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  title text not null,
  slug text not null,
  youtube_url text not null,
  description text,
  thumbnail_url text,
  cta_label text,
  cta_url text,
  featured boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_slug, slug)
);

create table if not exists public.pov_gallery (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  image_url text not null,
  title text,
  caption text,
  category text,
  featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pov_social_links (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  platform text not null,
  label text not null,
  url text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_slug, platform)
);

create table if not exists public.pov_contact_ctas (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  name text not null,
  label text not null,
  messenger_url text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pov_site_settings (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_slug, setting_key)
);

create index if not exists pov_members_site_active_idx on public.pov_members(site_slug, is_active, display_order);
create index if not exists pov_members_category_idx on public.pov_members(category_id);
create index if not exists pov_events_site_published_date_idx on public.pov_events(site_slug, is_published, start_date);
create index if not exists pov_videos_site_published_idx on public.pov_videos(site_slug, is_published, published_at desc);
create index if not exists pov_gallery_site_order_idx on public.pov_gallery(site_slug, display_order);
create index if not exists pov_site_content_site_order_idx on public.pov_site_content(site_slug, display_order);

do $$
declare target text;
begin
  foreach target in array array[
    'pov_admins','pov_site_content','pov_member_categories','pov_members',
    'pov_events','pov_videos','pov_social_links','pov_contact_ctas','pov_site_settings'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', target, target);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.pov_set_updated_at()', target, target);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Row level security (only on pov_ tables)
-- -----------------------------------------------------------------------------

do $$
declare target text;
begin
  foreach target in array array[
    'pov_admins','pov_site_content','pov_member_categories','pov_members','pov_events',
    'pov_event_gallery','pov_videos','pov_gallery','pov_social_links','pov_contact_ctas','pov_site_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', target);
  end loop;
end $$;

drop policy if exists "pov_admins_read_self" on public.pov_admins;
create policy "pov_admins_read_self" on public.pov_admins for select using (id = auth.uid() or public.pov_is_admin());

drop policy if exists "pov_site_content_public_read" on public.pov_site_content;
create policy "pov_site_content_public_read" on public.pov_site_content for select using (is_active or public.pov_is_admin());

drop policy if exists "pov_member_categories_public_read" on public.pov_member_categories;
create policy "pov_member_categories_public_read" on public.pov_member_categories for select using (is_active or public.pov_is_admin());

drop policy if exists "pov_members_public_read" on public.pov_members;
create policy "pov_members_public_read" on public.pov_members for select using (is_active or public.pov_is_admin());

drop policy if exists "pov_events_public_read" on public.pov_events;
create policy "pov_events_public_read" on public.pov_events for select using (is_published or public.pov_is_admin());

drop policy if exists "pov_event_gallery_public_read" on public.pov_event_gallery;
create policy "pov_event_gallery_public_read" on public.pov_event_gallery for select using (exists (select 1 from public.pov_events e where e.id = event_id and e.is_published) or public.pov_is_admin());

drop policy if exists "pov_videos_public_read" on public.pov_videos;
create policy "pov_videos_public_read" on public.pov_videos for select using (is_published or public.pov_is_admin());

drop policy if exists "pov_gallery_public_read" on public.pov_gallery;
create policy "pov_gallery_public_read" on public.pov_gallery for select using (true);

drop policy if exists "pov_social_links_public_read" on public.pov_social_links;
create policy "pov_social_links_public_read" on public.pov_social_links for select using (is_active or public.pov_is_admin());

drop policy if exists "pov_contact_ctas_public_read" on public.pov_contact_ctas;
create policy "pov_contact_ctas_public_read" on public.pov_contact_ctas for select using (is_active or public.pov_is_admin());

drop policy if exists "pov_site_settings_admin_read" on public.pov_site_settings;
create policy "pov_site_settings_admin_read" on public.pov_site_settings for select using (public.pov_is_admin());

do $$
declare target text;
begin
  foreach target in array array[
    'pov_site_content','pov_member_categories','pov_members','pov_events','pov_event_gallery',
    'pov_videos','pov_gallery','pov_social_links','pov_contact_ctas','pov_site_settings'
  ]
  loop
    execute format('drop policy if exists "pov_%1$s_admin_insert" on public.%1$I', target);
    execute format('create policy "pov_%1$s_admin_insert" on public.%1$I for insert with check (public.pov_is_admin())', target);
    execute format('drop policy if exists "pov_%1$s_admin_update" on public.%1$I', target);
    execute format('create policy "pov_%1$s_admin_update" on public.%1$I for update using (public.pov_is_admin()) with check (public.pov_is_admin())', target);
    execute format('drop policy if exists "pov_%1$s_admin_delete" on public.%1$I', target);
    execute format('create policy "pov_%1$s_admin_delete" on public.%1$I for delete using (public.pov_is_admin())', target);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Storage: a dedicated bucket, never reconfiguring an existing one
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pov-media', 'pov-media', true, 12582912, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "pov_media_public_read" on storage.objects;
create policy "pov_media_public_read" on storage.objects for select using (bucket_id = 'pov-media');

drop policy if exists "pov_media_admin_insert" on storage.objects;
create policy "pov_media_admin_insert" on storage.objects for insert with check (bucket_id = 'pov-media' and public.pov_is_admin());

drop policy if exists "pov_media_admin_update" on storage.objects;
create policy "pov_media_admin_update" on storage.objects for update using (bucket_id = 'pov-media' and public.pov_is_admin()) with check (bucket_id = 'pov-media' and public.pov_is_admin());

drop policy if exists "pov_media_admin_delete" on storage.objects;
create policy "pov_media_admin_delete" on storage.objects for delete using (bucket_id = 'pov-media' and public.pov_is_admin());

-- -----------------------------------------------------------------------------
-- Seed content (only pov_ tables, only this site's slug)
-- -----------------------------------------------------------------------------

insert into public.pov_social_links (site_slug, platform, label, url, display_order)
values
  ('pinoy-online-venture','facebook','Facebook','https://www.facebook.com/share/1HqiLdYS5g/',1),
  ('pinoy-online-venture','tiktok','TikTok','https://www.tiktok.com/@pinoyonlineventure',2),
  ('pinoy-online-venture','youtube','YouTube','https://www.youtube.com/@POVmarketing-001',3)
on conflict (site_slug, platform) do update set label = excluded.label, url = excluded.url, display_order = excluded.display_order;

insert into public.pov_site_content (site_slug, section_key, title, subtitle, body, button_text, button_url, display_order)
values
  ('pinoy-online-venture','hero','Where Filipino ambition becomes shared momentum.','Meet the people, ideas, events, and real stories powering the Pinoy Online Venture community.',null,'Explore our community','/community',1),
  ('pinoy-online-venture','about_intro','Real people building better opportunities together.',null,'Pinoy Online Venture brings aspiring entrepreneurs, mentors, leaders, and partners into one active community—making learning, connection, and collaboration more accessible.','Discover our story','/about',2),
  ('pinoy-online-venture','cta','Ready to connect with the community?',null,'Start a conversation, learn more about Pinoy Online Venture, and find your next opportunity.','Message Pinoy Online Venture',null,3)
on conflict (site_slug, section_key) do nothing;

commit;
