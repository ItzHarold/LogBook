-- ============================================================
-- LogBook — Google Drive Integration Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Remove OneDrive column if it was added, add Google Drive column
alter table public.profiles
  drop column if exists onedrive_refresh_token,
  add column if not exists gdrive_refresh_token text default null;
