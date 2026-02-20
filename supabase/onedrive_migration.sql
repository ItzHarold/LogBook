-- ============================================================
-- LogBook — OneDrive Integration Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table public.profiles
  add column if not exists onedrive_refresh_token text default null;
