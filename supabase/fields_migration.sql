-- ============================================================
-- LogBook — Custom Fields Migration
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. logbook_fields table
create table if not exists public.logbook_fields (
  id          uuid primary key default gen_random_uuid(),
  logbook_id  uuid not null references public.logbooks(id) on delete cascade,
  label       text not null,
  field_key   text not null,        -- slugified label, used as key in custom_data
  type        text not null default 'textarea'
              check (type in ('text','textarea','number','date','time','select','checkbox')),
  required    boolean not null default false,
  options     jsonb,                -- array of strings, only used when type = 'select'
  position    integer not null default 0,
  created_at  timestamptz default now() not null,
  unique (logbook_id, field_key)
);

-- 2. Add custom_data to entries
alter table public.entries
  add column if not exists custom_data jsonb not null default '{}';

-- 3. RLS on logbook_fields
alter table public.logbook_fields enable row level security;

create policy "logbook_fields: own rows only"
  on public.logbook_fields for all
  using (
    exists (
      select 1 from public.logbooks l
      where l.id = logbook_id and l.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.logbooks l
      where l.id = logbook_id and l.user_id = auth.uid()
    )
  );

-- 4. Create default fields for existing logbooks (mirrors old fixed columns)
insert into public.logbook_fields (logbook_id, label, field_key, type, required, position)
select l.id, 'What I worked on',      'worked_on', 'textarea', false, 0 from public.logbooks l
where not exists (select 1 from public.logbook_fields f where f.logbook_id = l.id)
union all
select l.id, 'What I learned',        'learned',   'textarea', false, 1 from public.logbooks l
where not exists (select 1 from public.logbook_fields f where f.logbook_id = l.id)
union all
select l.id, 'Blockers & challenges', 'blockers',  'textarea', false, 2 from public.logbooks l
where not exists (select 1 from public.logbook_fields f where f.logbook_id = l.id)
union all
select l.id, 'Ideas & notes',         'ideas',     'textarea', false, 3 from public.logbooks l
where not exists (select 1 from public.logbook_fields f where f.logbook_id = l.id)
union all
select l.id, 'Tomorrow''s plan',      'tomorrow',  'textarea', false, 4 from public.logbooks l
where not exists (select 1 from public.logbook_fields f where f.logbook_id = l.id);

-- 5. Indexes
create index if not exists logbook_fields_logbook_id_idx on public.logbook_fields(logbook_id);
