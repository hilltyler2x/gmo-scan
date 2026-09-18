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
  row-level security so users only see their own data.

## Setup

1. **Supabase**
   - Create a project at supabase.com
   - Go to the SQL Editor, paste in `supabase/schema.sql`, run it
   - Go to Project Settings → API, copy the Project URL and `anon` public key

2. **Local env**
   ```bash
   cp .env.example .env.local
   # paste your Supabase URL + anon key into .env.local
   npm install
   npm run dev
   ```

3. **Deploy**
   - Push to GitHub, import into Vercel
   - Add the same two env vars in Vercel's project settings
   - Deploy

## Known MVP limitations (by design, not oversight)

- **No user accounts wired up yet.** Supabase Auth tables/policies are ready
  in the schema, but the scan page doesn't log scans to `scans` yet — add an
  auth flow (Supabase Auth UI or your own) before wiring that up, so scans
  attach to a real `user_id`.
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

1. Wire up Supabase Auth (email or Google) and log each scan to `scans`
2. Build a simple scan history page reading from `scans`
3. Add the goals UI (create/track against `goals` table)
4. Receipt upload → Supabase Storage → OCR (Google Vision) → fuzzy match to
   product DB → log to `scans` with `source: 'receipt_ocr'`
