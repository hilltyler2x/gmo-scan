-- GMO Scan — MVP schema
-- Run this in the Supabase SQL editor after creating your project.
-- Assumes Supabase Auth is enabled (auth.users already exists).

-- Extend user data beyond what auth.users stores
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  created_at timestamptz default now()
);

-- Every barcode/receipt scan a user performs
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  barcode text,
  product_name text,
  brand text,
  verdict text check (verdict in ('confirmed_be', 'likely_be', 'verified_non_gmo', 'unknown')),
  matched_ingredients text[],
  source text check (source in ('barcode_scan', 'manual_entry', 'receipt_ocr')) default 'barcode_scan',
  created_at timestamptz default now()
);

create index if not exists scans_user_id_idx on public.scans(user_id);
create index if not exists scans_created_at_idx on public.scans(created_at);

-- User-defined health/nutrition goals
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  goal_type text not null, -- e.g. 'reduce_be_intake', 'increase_fiber', 'cut_added_sugar'
  target_value numeric,
  current_value numeric default 0,
  created_at timestamptz default now()
);

-- Raw receipt uploads awaiting OCR/matching (Phase 2)
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  image_path text not null, -- Supabase Storage path
  status text check (status in ('pending', 'processed', 'failed')) default 'pending',
  created_at timestamptz default now()
);

-- Row Level Security: every user can only see their own data
alter table public.profiles enable row level security;
alter table public.scans enable row level security;
alter table public.goals enable row level security;
alter table public.receipts enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can view own scans" on public.scans
  for select using (auth.uid() = user_id);
create policy "Users can insert own scans" on public.scans
  for insert with check (auth.uid() = user_id);

create policy "Users can view own goals" on public.goals
  for select using (auth.uid() = user_id);
create policy "Users can manage own goals" on public.goals
  for all using (auth.uid() = user_id);

create policy "Users can view own receipts" on public.receipts
  for select using (auth.uid() = user_id);
create policy "Users can insert own receipts" on public.receipts
  for insert with check (auth.uid() = user_id);
