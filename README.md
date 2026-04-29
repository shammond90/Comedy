# Comedy Tour Manager

Production management for touring comedians: venues, comedians, tours, shows, financials, reminders, and tour books.

**Stack:** Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS) · Drizzle ORM · Tailwind v4 · TypeScript · Vercel

---

## Getting started

### 1. Prerequisites

- Node 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)
- Docker Desktop (used by `supabase start`)

### 2. Install

```bash
npm install
cp .env.local.example .env.local
```

### 3. Start local Supabase

```bash
npm run supabase:start
```

This boots Postgres, Auth, Storage, and the Studio UI in Docker. When it finishes it prints the local API URL, anon key, and service-role key. Copy these into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### 4. Apply schema + RLS

```bash
npm run db:setup
```

This runs all Drizzle migrations and then applies the RLS policies and triggers from `supabase/policies/`.

### 5. Run the dev server

```bash
npm run dev
```

Visit <http://localhost:3000>. You'll be redirected to `/signup` to create an account. A personal organisation is auto-provisioned on first login.

---

## Useful commands

| Command                | What it does                                                |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Next.js dev server                                          |
| `npm run build`        | Production build                                            |
| `npm run db:generate`  | Generate a new Drizzle migration from `src/db/schema.ts`    |
| `npm run db:setup`     | Apply Drizzle migrations + RLS policies                     |
| `npm run db:studio`    | Open Drizzle Studio against your `DATABASE_URL`             |
| `npm run supabase:start` / `:stop` / `:reset` | Manage the local Supabase stack          |

After editing `src/db/schema.ts`:

```bash
npm run db:generate
npm run db:setup
```

If you change RLS policies, edit `supabase/policies/0001_rls_and_constraints.sql` (or add a new file there) and re-run `npm run db:setup`. To wipe the local DB and start fresh: `npm run supabase:reset && npm run db:setup`.

---

## Project structure

```
src/
  app/
    (auth)/            login + signup pages, signOut action
    (app)/             authenticated app — protected by proxy
      page.tsx         dashboard
      tours/           tour management (placeholder)
      venues/          venues CRUD
      comedians/       comedians CRUD
  components/ui/       button, card, input, table primitives
  db/
    schema.ts          single source of truth for the DB
    client.ts          Drizzle client
    migrations/        generated migrations
  lib/
    auth.ts            requireUser / requireOrg helpers
    supabase/          ssr-safe Supabase clients + session refresh
    utils.ts           cn(), formatPence(), formatDate()
  proxy.ts             Next 16 proxy (auth gate)
supabase/
  policies/            hand-written RLS + constraint SQL
  config.toml          local Supabase config
scripts/
  db-setup.ts          migrate + apply policies
drizzle.config.ts
```

---

## Architectural notes

- **Multi-tenancy is built in from day one.** Every domain table has `org_id` and is scoped by RLS via the `org_members` table. V1 auto-creates one personal org per user. Adding team support later is purely a UI/membership change.
- **Money is stored as integer pence** to avoid floating-point drift. Use `formatPence()` / `parsePence()` in `src/lib/utils.ts`.
- **Soft deletes:** entities use an `archived_at` timestamp instead of being deleted, so historical tour data is preserved.
- **Double-booking prevention:** `shows.comedian_id` is denormalised by trigger from `tours.comedian_id`, with a partial unique index on `(comedian_id, show_date)` excluding cancelled/archived rows.
- **Auth gate:** `src/proxy.ts` runs Supabase session refresh on every request and redirects unauthenticated users to `/login` (preserving their target via `?next=`).

---

## Roadmap

Implemented:
- Auth (email/password) + org auto-provisioning
- Dashboard with summary stats
- Venues CRUD
- Comedians CRUD
- Schema + RLS for tours, shows, ticket tiers, accommodation, travel, reminders

Next up:
- Tours + shows CRUD
- Calendar view (`react-big-calendar`)
- Custom CSS-flexbox timeline / Gantt
- Cost entry (accommodation, travel, marketing) per show
- Ticket-tier sales tracking + computed P&L
- Reminders engine
- PDF tour book + settlement sheets (`@react-pdf/renderer`)

---

## Deployment (Vercel + hosted Supabase)

1. Create a Supabase project at [supabase.com](https://supabase.com/dashboard).
2. Set `DATABASE_URL` to the project's connection string and run `npm run db:setup` against it.
3. Push the repo to GitHub and import it into Vercel.
4. In Vercel, set the env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.
5. Deploy.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
