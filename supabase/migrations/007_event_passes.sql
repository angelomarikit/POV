-- Event QR pass registration + staff check-in

alter table public.pov_events
  add column if not exists registration_enabled boolean not null default false,
  add column if not exists registration_status_label text,
  add column if not exists poster_image_url text,
  add column if not exists pass_brand_label text not null default 'POV';

create table if not exists public.pov_event_registrants (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'pinoy-online-venture',
  event_id uuid not null references public.pov_events(id) on delete cascade,
  first_name text not null,
  family_name text not null,
  email text,
  city text,
  invited_by text,
  role text not null default 'guest' check (role in ('guest', 'affiliate', 'member')),
  pass_code text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'checked_in', 'cancelled')),
  checked_in_at timestamptz,
  checked_in_by uuid references public.pov_admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_slug, pass_code)
);

create index if not exists pov_event_registrants_event_idx
  on public.pov_event_registrants(site_slug, event_id, created_at desc);

create index if not exists pov_event_registrants_email_event_idx
  on public.pov_event_registrants(site_slug, event_id, lower(email))
  where email is not null;

create index if not exists pov_event_registrants_status_idx
  on public.pov_event_registrants(site_slug, event_id, status);

drop trigger if exists set_pov_event_registrants_updated_at on public.pov_event_registrants;
create trigger set_pov_event_registrants_updated_at
  before update on public.pov_event_registrants
  for each row execute function public.pov_set_updated_at();

alter table public.pov_event_registrants enable row level security;

-- Guests can create a registration for a published, registration-enabled event.
drop policy if exists "pov_event_registrants_public_insert" on public.pov_event_registrants;
create policy "pov_event_registrants_public_insert"
  on public.pov_event_registrants for insert
  with check (
    site_slug = 'pinoy-online-venture'
    and exists (
      select 1 from public.pov_events e
      where e.id = event_id
        and e.site_slug = site_slug
        and e.is_published = true
        and e.registration_enabled = true
    )
  );

-- Admins can read all registrants. Guests use security-definer RPCs for pass lookup.
drop policy if exists "pov_event_registrants_public_select" on public.pov_event_registrants;
drop policy if exists "pov_event_registrants_admin_select" on public.pov_event_registrants;
create policy "pov_event_registrants_admin_select"
  on public.pov_event_registrants for select
  using (public.pov_is_admin());

create or replace function public.pov_get_pass_by_code(p_code text)
returns setof public.pov_event_registrants
language sql
security definer
set search_path = public
as $$
  select r.*
  from public.pov_event_registrants r
  join public.pov_events e on e.id = r.event_id
  where r.site_slug = 'pinoy-online-venture'
    and r.pass_code = upper(trim(p_code))
    and e.is_published = true
  limit 1;
$$;

create or replace function public.pov_find_pass(p_event_id uuid, p_email text)
returns setof public.pov_event_registrants
language sql
security definer
set search_path = public
as $$
  select r.*
  from public.pov_event_registrants r
  join public.pov_events e on e.id = r.event_id
  where r.site_slug = 'pinoy-online-venture'
    and r.event_id = p_event_id
    and r.email is not null
    and lower(r.email) = lower(trim(p_email))
    and r.status <> 'cancelled'
    and e.is_published = true
  order by r.created_at desc
  limit 1;
$$;

grant execute on function public.pov_get_pass_by_code(text) to anon, authenticated;
grant execute on function public.pov_find_pass(uuid, text) to anon, authenticated;

drop policy if exists "pov_event_registrants_admin_update" on public.pov_event_registrants;
create policy "pov_event_registrants_admin_update"
  on public.pov_event_registrants for update
  using (public.pov_is_admin())
  with check (public.pov_is_admin());

drop policy if exists "pov_event_registrants_admin_delete" on public.pov_event_registrants;
create policy "pov_event_registrants_admin_delete"
  on public.pov_event_registrants for delete
  using (public.pov_is_admin());
