-- ============================================================
-- LogBook — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- PROFILES
-- Stores each user's onboarding answers
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  logbook_name text not null,
  organization text not null,
  default_location text not null,
  created_at   timestamptz default now() not null
);

-- ENTRIES
-- Stores all work log entries
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  hours       numeric(4, 1) not null check (hours > 0 and hours <= 24),
  energy      text not null check (energy in ('green', 'yellow', 'red')),
  location    text not null,
  worked_on   text default '',
  learned     text default '',
  blockers    text default '',
  ideas       text default '',
  tomorrow    text default '',
  created_at  timestamptz default now() not null
);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists entries_user_id_idx on public.entries(user_id);
create index if not exists entries_date_idx on public.entries(date desc);

-- ============================================================
-- Row Level Security
-- Users can only read/write their own data
-- ============================================================
alter table public.profiles enable row level security;
alter table public.entries  enable row level security;

-- Profiles: full access to own row only
create policy "profiles: own row only"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Entries: full access to own rows only
create policy "entries: own rows only"
  on public.entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
