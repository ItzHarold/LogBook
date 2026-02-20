-- ============================================================
-- LogBook — Logbooks Migration
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create logbooks table
create table if not exists public.logbooks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  organization     text not null default '',
  default_location text not null default '',
  created_at       timestamptz default now() not null
);

-- 2. Add logbook_id to entries (nullable to allow migration)
alter table public.entries
  add column if not exists logbook_id uuid references public.logbooks(id) on delete cascade;

-- 3. Create one logbook per existing profile
insert into public.logbooks (id, user_id, name, organization, default_location)
select
  gen_random_uuid(),
  p.id,
  coalesce(p.logbook_name, 'My Logbook'),
  coalesce(p.organization, ''),
  coalesce(p.default_location, '')
from public.profiles p
where not exists (
  select 1 from public.logbooks l where l.user_id = p.id
);

-- 4. Point all existing entries to their user's first logbook
update public.entries e
set logbook_id = (
  select l.id
  from public.logbooks l
  where l.user_id = e.user_id
  order by l.created_at asc
  limit 1
)
where e.logbook_id is null;

-- 5. Enable RLS on logbooks
alter table public.logbooks enable row level security;

create policy "logbooks: own rows only"
  on public.logbooks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Indexes
create index if not exists logbooks_user_id_idx  on public.logbooks(user_id);
create index if not exists entries_logbook_id_idx on public.entries(logbook_id);
