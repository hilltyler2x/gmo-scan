-- Adds the missing DELETE policy for the scans table.
-- Run this in the Supabase SQL editor (same place you ran schema.sql).
-- Without it, the "Delete" button on the history page will always fail —
-- RLS silently blocks deletes when no matching policy exists.
--
-- Safe to run more than once, and safe to run even if you have already run an
-- up-to-date schema.sql (which now creates this policy too).

drop policy if exists "Users can delete own scans" on public.scans;

create policy "Users can delete own scans" on public.scans
  for delete using (auth.uid() = user_id);
