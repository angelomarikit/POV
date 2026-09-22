-- CMS-managed news for Pinoy Online Venture.
-- Safe for the shared database: only pov_ objects are touched.

begin;

create table if not exists public.pov_news (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  title text not null,
  slug text not null,
  category text not null default 'Announcement',
  excerpt text,
  body text,
  image_url text,
  youtube_url text,
  featured boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_slug, slug),
  constraint pov_news_has_media check (
    nullif(trim(coalesce(image_url, '')), '') is not null
    or nullif(trim(coalesce(youtube_url, '')), '') is not null
  )
);

create index if not exists pov_news_site_published_idx
  on public.pov_news(site_slug, is_published, published_at desc);

drop trigger if exists set_pov_news_updated_at on public.pov_news;
create trigger set_pov_news_updated_at
  before update on public.pov_news
  for each row execute function public.pov_set_updated_at();

alter table public.pov_news enable row level security;

drop policy if exists "pov_news_public_read" on public.pov_news;
create policy "pov_news_public_read"
  on public.pov_news for select
  using (is_published or public.pov_is_admin());

drop policy if exists "pov_news_admin_insert" on public.pov_news;
create policy "pov_news_admin_insert"
  on public.pov_news for insert
  with check (public.pov_is_admin());

drop policy if exists "pov_news_admin_update" on public.pov_news;
create policy "pov_news_admin_update"
  on public.pov_news for update
  using (public.pov_is_admin())
  with check (public.pov_is_admin());

drop policy if exists "pov_news_admin_delete" on public.pov_news;
create policy "pov_news_admin_delete"
  on public.pov_news for delete
  using (public.pov_is_admin());

commit;
