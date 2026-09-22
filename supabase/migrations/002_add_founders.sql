-- Founders page for Pinoy Online Venture.
-- Safe for the shared database: only pov_ objects are touched.

begin;

create table if not exists public.pov_founders (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  name text not null,
  slug text not null,
  role text,
  image_url text,
  short_description text,
  bio text,
  facebook_url text,
  messenger_url text,
  website_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_slug, slug)
);

create index if not exists pov_founders_site_active_idx
  on public.pov_founders(site_slug, is_active, display_order);

drop trigger if exists set_pov_founders_updated_at on public.pov_founders;
create trigger set_pov_founders_updated_at
  before update on public.pov_founders
  for each row execute function public.pov_set_updated_at();

alter table public.pov_founders enable row level security;

drop policy if exists "pov_founders_public_read" on public.pov_founders;
create policy "pov_founders_public_read"
  on public.pov_founders for select
  using (is_active or public.pov_is_admin());

drop policy if exists "pov_founders_admin_insert" on public.pov_founders;
create policy "pov_founders_admin_insert"
  on public.pov_founders for insert
  with check (public.pov_is_admin());

drop policy if exists "pov_founders_admin_update" on public.pov_founders;
create policy "pov_founders_admin_update"
  on public.pov_founders for update
  using (public.pov_is_admin())
  with check (public.pov_is_admin());

drop policy if exists "pov_founders_admin_delete" on public.pov_founders;
create policy "pov_founders_admin_delete"
  on public.pov_founders for delete
  using (public.pov_is_admin());

commit;
