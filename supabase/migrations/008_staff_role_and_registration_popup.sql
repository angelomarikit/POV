-- Staff role (check-in only) + home registration popup toggle

-- Allow staff accounts in pov_admins (CMS stays admin/editor only via pov_is_admin).
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.pov_admins'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%role%';
  if cname is not null then
    execute format('alter table public.pov_admins drop constraint %I', cname);
  end if;
end $$;

alter table public.pov_admins
  add constraint pov_admins_role_check check (role in ('admin', 'editor', 'staff'));

create or replace function public.pov_is_pass_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.pov_admins
    where id = auth.uid() and role in ('admin', 'editor', 'staff')
  );
$$;

-- Staff can read events used for check-in (including unpublished registration events).
drop policy if exists "pov_events_staff_read" on public.pov_events;
create policy "pov_events_staff_read"
  on public.pov_events for select
  using (public.pov_is_pass_staff());

-- Registrant policies: pass staff can list / update / walk-in; delete stays admin/editor.
drop policy if exists "pov_event_registrants_admin_select" on public.pov_event_registrants;
create policy "pov_event_registrants_admin_select"
  on public.pov_event_registrants for select
  using (public.pov_is_pass_staff());

drop policy if exists "pov_event_registrants_admin_update" on public.pov_event_registrants;
create policy "pov_event_registrants_admin_update"
  on public.pov_event_registrants for update
  using (public.pov_is_pass_staff())
  with check (public.pov_is_pass_staff());

-- Walk-ins insert as authenticated staff (public guests still use public_insert).
drop policy if exists "pov_event_registrants_staff_insert" on public.pov_event_registrants;
create policy "pov_event_registrants_staff_insert"
  on public.pov_event_registrants for insert
  with check (
    site_slug = 'pinoy-online-venture'
    and public.pov_is_pass_staff()
  );

alter table public.pov_events
  add column if not exists show_registration_popup boolean not null default false;
