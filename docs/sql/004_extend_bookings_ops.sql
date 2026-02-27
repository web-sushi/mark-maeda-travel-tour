-- Migration: Extend bookings table for admin operations
-- Description: Add admin_notes and last_action_at to bookings table

-- Add admin_notes column
alter table public.bookings
  add column if not exists admin_notes text;

comment on column public.bookings.admin_notes is 'Admin-only notes, not visible to customers';

-- Add last_action_at column
alter table public.bookings
  add column if not exists last_action_at timestamptz;

comment on column public.bookings.last_action_at is 'Timestamp of the last admin action on this booking';

-- Create booking_events table
create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event_type text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.booking_events is 'Audit log of booking events and admin actions';
comment on column public.booking_events.event_type is 'Type of event (e.g., booking_confirmed, payment_marked_paid, booking_cancelled)';
comment on column public.booking_events.event_payload is 'Additional event data as JSON';

-- Create index for faster queries
create index if not exists idx_booking_events_booking_id on public.booking_events(booking_id);
create index if not exists idx_booking_events_created_at on public.booking_events(created_at desc);

-- Enable RLS
alter table public.booking_events enable row level security;

-- Policy: allow admins to read and insert events
create policy "Allow admins to manage booking events" on public.booking_events
  for all
  using (public.is_admin())
  with check (public.is_admin());
