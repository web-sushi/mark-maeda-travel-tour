-- Migration: Create bookings table
-- Description: Core bookings table for tour/transfer/package bookings

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference_code text unique not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  travel_date date not null,
  vehicles_count int not null default 1,
  items jsonb not null default '[]'::jsonb,
  total_amount int not null default 0,
  deposit_choice int not null default 100, -- 25|50|100
  amount_paid int not null default 0,
  remaining_amount int not null default 0,
  booking_status text not null default 'pending', -- pending|confirmed|cancelled|completed
  payment_status text not null default 'unpaid',  -- unpaid|partial|paid|refunded
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.bookings is 'Customer bookings for tours, transfers, and packages';
comment on column public.bookings.reference_code is 'Unique booking reference code';
comment on column public.bookings.items is 'JSON array of booking items (tours/transfers/packages)';
comment on column public.bookings.total_amount is 'Total amount in smallest currency unit (e.g., JPY cents)';
comment on column public.bookings.deposit_choice is 'Deposit percentage chosen: 25, 50, or 100';
comment on column public.bookings.amount_paid is 'Amount paid so far in smallest currency unit';
comment on column public.bookings.remaining_amount is 'Remaining balance in smallest currency unit';
comment on column public.bookings.booking_status is 'Booking status: pending, confirmed, cancelled, completed';
comment on column public.bookings.payment_status is 'Payment status: unpaid, partial, paid, refunded';

-- Create updated_at trigger function if it doesn't exist
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
drop trigger if exists set_updated_at on public.bookings;
create trigger set_updated_at
  before update on public.bookings
  for each row
  execute function public.set_updated_at();

-- Enable RLS
alter table public.bookings enable row level security;

-- Dev policy: allow all operations (adjust for production)
create policy "Allow all operations for bookings" on public.bookings
  for all
  using (true)
  with check (true);
