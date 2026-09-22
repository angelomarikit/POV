# Supabase installation

> **This project shares a Supabase database with other live websites.**
> Every object this app owns is prefixed with `pov_` (tables, functions, policies)
> and it uses its own `pov-media` storage bucket. The migration never creates,
> alters, or drops shared objects such as `public.sites`, `public.profiles`,
> `public.set_updated_at()`, the `auth.users` signup trigger, or another site's
> storage bucket. Keep it that way when adding future migrations.

## 1. Install the database and storage policies

1. Open your Supabase project.
2. Go to **SQL Editor → New query**.
3. Open each file in `supabase/migrations` in number order.
4. Copy the complete file into the SQL Editor and click **Run**.
5. Finish `001_initial_schema.sql` before running `002_add_founders.sql`, then `003_add_news.sql`.

This creates the `pov_*` tables, indexes, `updated_at` triggers, Row Level Security policies, seed content, official social links, and the public `pov-media` storage bucket. You do not need to create the bucket manually.

The script is safe to run more than once, and safe to run while the other websites are live.

### Checking for name collisions before you run it

If you ever add a table, use the `pov_` prefix. To confirm nothing already claims a name you are about to create:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

## 2. Create the first admin

Admin access is an explicit allow-list in `public.pov_admins`. There is no trigger on `auth.users`, so nothing happens automatically at signup — this is deliberate, because a signup trigger would be shared with the other websites in this database.

1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter the administrator email and a strong temporary password.
3. Enable **Auto Confirm User**, then click **Create user**.
4. Go to **SQL Editor → New query**.
5. Run the following, replacing the email:

```sql
insert into public.pov_admins (id, email, full_name, role)
select id, email, 'Your Name', 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (id) do update set role = 'admin';
```

6. Confirm the result:

```sql
select id, email, full_name, role
from public.pov_admins;
```

Only users listed in this table can reach the CMS or write content. To create a limited content editor, use `'editor'` instead of `'admin'`.

## 3. Add frontend environment values

1. Go to **Project Settings → API**.
2. Copy **Project URL** into `VITE_SUPABASE_URL`.
3. Copy the **anon public key** into `VITE_SUPABASE_ANON_KEY`.
4. Set `VITE_SITE_SLUG=pinoy-online-venture`.

Do not copy the service-role key into any `VITE_` variable.

## 4. Verify

1. Run `npm run dev`.
2. Open `/admin/login`.
3. Sign in with the admin account.
4. Add one unpublished item, edit it, publish it, verify it publicly, and then delete it.
5. Upload an image and confirm it appears under **Storage → pov-media → pinoy-online-venture**.

If a write returns a permission error, verify that the signed-in user has a row in `public.pov_admins` with role `admin` or `editor`.

## Optional: register the site in the shared `sites` table

The app does not read `public.sites`, so this is not required. If you want this site listed alongside the other tenants, insert a row using only the columns that table actually has:

```sql
insert into public.sites (slug, name, logo_url)
values ('pinoy-online-venture', 'Pinoy Online Venture', '/pov-logo.png')
on conflict (slug) do nothing;
```
