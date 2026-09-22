# Pinoy Online Venture

A mobile-first community platform and secure Supabase CMS built with React, TypeScript, Vite, Tailwind CSS, TanStack Query, and Vite PWA.

Visitor and administrator instructions (how to browse the app, publish content, and use the CMS) are in [USER_GUIDE.md](USER_GUIDE.md).

## Local setup

1. Clone the repository and open it in a terminal.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a Supabase project at [supabase.com](https://supabase.com).
4. In Supabase, open **SQL Editor → New query**.
5. Copy the complete contents of `supabase/migrations/001_initial_schema.sql`, paste them into the query, and click **Run**. This creates the `pov_*` tables, indexes, RLS policies, triggers, seed content, and the `pov-media` bucket. The database is shared with other live sites, so every object is prefixed — see `supabase/README.md`.
6. In Supabase, open **Project Settings → API**. Copy the **Project URL** and **anon public key**. Never use the service-role key in this app.
7. Copy `.env.example` to `.env.local` and fill in:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
   VITE_SITE_SLUG=pinoy-online-venture
   ```
8. Create the first administrator by following `supabase/README.md`.
9. Start the app:
   ```bash
   npm run dev
   ```
10. Open `/admin/login` and sign in.

## Commands

- `npm run dev` — local development
- `npm run build` — TypeScript check and production build
- `npm run preview` — preview the production build
- `npm run lint` — lint source files

## SITE SLUG

`VITE_SITE_SLUG` is the single site identifier. All site-sensitive service queries and CMS writes automatically use it. The default is:

```env
VITE_SITE_SLUG=pinoy-online-venture
```

To reuse the platform for another brand, create its matching `sites` row and set a different SITE SLUG. Administrators never type it into forms.

## Deploy to Vercel

1. Push the project to a private or public GitHub repository.
2. In Vercel, click **Add New → Project**, import the repository, and keep the detected **Vite** framework settings.
3. Open **Project Settings → Environment Variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_SLUG` = `pinoy-online-venture`
4. Deploy. `vercel.json` provides SPA rewrites so direct visits to `/community`, `/events`, content details, and `/admin` work.
5. Replace the temporary Vercel hostname in `public/robots.txt` and `public/sitemap.xml` with the production domain.
6. In Supabase, open **Authentication → URL Configuration** and add the production domain as the **Site URL** and allowed redirect URL.

## Security

- Browser code uses only the Supabase anon key.
- Public users can read active/published content only.
- Inserts, updates, deletes, and storage writes require an authenticated `admin` or `editor` profile.
- `/admin` is route-protected for usability; PostgreSQL RLS is the actual security boundary.
- Keep `.env`, `.env.local`, passwords, private keys, and service-role keys out of Git.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
