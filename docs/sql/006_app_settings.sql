-- =====================================================
-- Migration: App Settings Table
-- Description: Create singleton app_settings table for 
--              persistent admin configuration
-- =====================================================

-- Ensure pgcrypto extension exists for gen_random_uuid()
create extension if not exists pgcrypto;

-- Create app_settings table
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key text unique not null default 'default',
  business_name text,
  support_email text,
  support_phone text,
  admin_notify_email text,
  timezone text not null default 'Asia/Tokyo',
  email_toggles jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Add comment explaining singleton pattern
comment on column public.app_settings.singleton_key is 
  'Enforces single-row constraint. Always use "default".';

-- Create trigger function for updated_at
create or replace function public.update_app_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach trigger to app_settings
drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
  before update on public.app_settings
  for each row
  execute function public.update_app_settings_updated_at();

-- Enable RLS
alter table public.app_settings enable row level security;

-- RLS Policies: Admin-only access
create policy "Admin can select app_settings"
  on public.app_settings
  for select
  using (public.is_admin());

create policy "Admin can insert app_settings"
  on public.app_settings
  for insert
  with check (public.is_admin());

create policy "Admin can update app_settings"
  on public.app_settings
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Optional: Insert default row
-- (Admin UI will create if not exists, but this is helpful for initial setup)
insert into public.app_settings (singleton_key, email_toggles)
values ('default', '{
  "booking_received_customer": true,
  "booking_received_admin": true,
  "booking_confirmed": true,
  "payment_paid": true,
  "booking_cancelled": true
}'::jsonb)
on conflict (singleton_key) do nothing;
