-- ============================================================
-- LogBook — Start/End Time Migration
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table public.entries
  add column if not exists start_time text,
  add column if not exists end_time   text;
