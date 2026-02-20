-- ============================================================
-- LogBook — Stripe / Pro Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Run AFTER the original schema.sql
-- ============================================================

alter table public.profiles
  add column if not exists is_pro            boolean default false not null,
  add column if not exists stripe_customer_id text    default null;
