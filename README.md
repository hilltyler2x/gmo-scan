# GMO Scan

Scan a barcode → find out if the product is bioengineered (BE), likely contains
BE-derived ingredients, or is verified non-GMO. Built as an MVP: Next.js 14
(App Router) + Supabase + Vercel, same stack pattern as TaxSnap.

## What's in this MVP

- **`/` (app/page.tsx)** — camera barcode scanner (via `@zxing/browser`) with a
  manual-entry fallback.
- **`/api/lookup`** — server route that takes a barcode, looks the product up
  on [Open Food Facts](https://world.openfoodfacts.org) (free, no API key needed),
  and runs it through the BE detection logic.
- **`lib/beCheck.ts`** — the actual classification logic. Checks in order:
  1. Explicit USDA Bioengineered disclosure in the source label data
  2. Explicit Non-GMO Project / USDA Organic certification
  3. Ingredient-list inference against the USDA BE crop list + common derivatives
  4. Falls back to "unknown" if there's not enough data
- **`supabase/schema.sql`** — tables for `profiles`, `scans`, `goals`, and
  `receipts` (the last one is scaffolded for Phase 2 receipt OCR), all with
  row-level security so users only see their own data. `delete_policy.sql`
  adds the `scans` DELETE policy alongside it.

## Setup

### 1. Supabase (the database + login)

- Create a free project at [supabase.com](https://supabase.com) — the free tier
  is enough for this app.
- Open **SQL Editor → New query**, paste in `supabase/schema.sql`, and run it.
  Then run `supabase/delete_policy.sql` the same way — without that second one
  the Delete button on the history page silently does nothing, because RLS
  blocks deletes when no matching policy exists. Running it is harmless even if
  your copy of `schema.sql` already creates that policy.
- Open **Project Settings → API** and copy two values:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **`anon` `public` key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

  The `anon` key is safe to expose in the browser — RLS is what protects the
  data. Never put the `service_role` key in this app.

### 2. Run it locally

```bash
cp .env.example .env.local
# paste your Supabase URL + anon key into .env.local
npm install
npm run dev
```

Both `NEXT_PUBLIC_*` vars must be set before `npm run build` too — the Supabase
client is created at module scope, so a build without them fails at prerender
with `supabaseUrl is required`.

### 3. Deploy to Vercel

- Push to GitHub, then **Add New → Project** at [vercel.com](https://vercel.com)
  and import this repo. Vercel detects Next.js on its own; no build settings to
  change.
- Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and `USDA_FDC_API_KEY` if you have one) for
  all environments, then deploy.
- Note the URL it gives you, e.g. `https://gmo-scan.vercel.app`.

### 4. Point Supabase auth at the deployed URL

Back in Supabase, **Authentication → URL Configuration**:

- **Site URL** → your Vercel URL
- **Redirect URLs** → add `https://your-app.vercel.app/**` and, for local work,
  `http://localhost:3000/**`

Until this is set, email confirmation links and the Google button send people
back to `localhost` instead of the live site.

**"Continue with Google" needs one extra step.** It stays broken until you
enable the Google provider under **Authentication → Providers** and paste in a
client ID and secret from a Google Cloud OAuth consent screen. Email + password
sign-in works with no extra setup, so you can ship without Google and add it
later.

The camera scanner only runs over HTTPS (or `localhost`) — that is a browser
rule, not an app setting. Vercel is HTTPS by default, so it works once deployed.

## Known MVP limitations (by design, not oversight)

- **Google sign-in is not configured.** Email + password works out of the box;
  the Google button errors until the provider is set up in Supabase.
- **BE_CROPS / BE_DERIVATIVES lists in `lib/beCheck.ts` are a starting point,
  not exhaustive.** Cross-check against the live [USDA BE List](https://www.ams.usda.gov/rules-regulations/be)
  periodically — it gets updated as new BE crops are approved.
- **Open Food Facts coverage varies.** It's strongest on US/EU packaged goods;
  private-label and regional products may come back "not found." That's a
  candidate to route into a manual "help us add this product" flow later.
- **No receipt OCR yet** (Phase 2) — the `receipts` table and Storage bucket
  convention are scaffolded but no upload UI or OCR pipeline is wired in.
- **No personalization/goals UI yet** (Phase 3) — the `goals` table exists;
  the recommendation engine and goal-tracking screens aren't built.

## Suggested next steps, in order

1. Configure the Google auth provider in Supabase
2. Add app icons + a web manifest under `public/` so it installs as a PWA
3. Add the goals UI (create/track against `goals` table)
4. Receipt upload → Supabase Storage → OCR (Google Vision) → fuzzy match to
   product DB → log to `scans` with `source: 'receipt_ocr'`
