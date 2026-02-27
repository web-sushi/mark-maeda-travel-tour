-- Migration: Production RLS with Admin Allowlist
-- Description: Implements secure RLS policies with admin allowlist for tours, transfers, packages, and bookings
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. Create admin_users table
-- ============================================================================

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is 'Allowlist of admin users who can manage tours, transfers, packages, and bookings';

-- Enable RLS on admin_users (only admins can view)
alter table public.admin_users enable row level security;

-- Only admins can view the admin_users table (chicken-and-egg: use service role to insert first admin)
create policy "Admins can view admin_users" on public.admin_users
  for select
  using (public.is_admin());

-- ============================================================================
-- 2. Create is_admin() helper function
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if current user's ID exists in admin_users
  return exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
end;
$$;

comment on function public.is_admin() is 'Returns true if the current authenticated user is an admin';

-- ============================================================================
-- 3. Drop existing dev "allow all" policies
-- ============================================================================

-- Tours
drop policy if exists "Allow all for dev" on public.tours;
drop policy if exists "Allow all operations for tours" on public.tours;

-- Transfers
drop policy if exists "Allow all for dev" on public.transfers;
drop policy if exists "Allow all operations for transfers" on public.transfers;

-- Packages
drop policy if exists "Allow all for dev" on public.packages;
drop policy if exists "Allow all operations for packages" on public.packages;

-- Bookings
drop policy if exists "Allow all for dev" on public.bookings;
drop policy if exists "Allow all operations for bookings" on public.bookings;

-- ============================================================================
-- 4. Create production RLS policies for tours
-- ============================================================================

-- Public can SELECT only active tours
create policy "Public can view active tours" on public.tours
  for select
  using (status = 'active');

-- Admin can SELECT all tours
create policy "Admin can view all tours" on public.tours
  for select
  using (public.is_admin());

-- Admin can INSERT tours
create policy "Admin can insert tours" on public.tours
  for insert
  with check (public.is_admin());

-- Admin can UPDATE tours
create policy "Admin can update tours" on public.tours
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admin can DELETE tours
create policy "Admin can delete tours" on public.tours
  for delete
  using (public.is_admin());

-- ============================================================================
-- 5. Create production RLS policies for transfers
-- ============================================================================

-- Public can SELECT only active transfers
create policy "Public can view active transfers" on public.transfers
  for select
  using (status = 'active');

-- Admin can SELECT all transfers
create policy "Admin can view all transfers" on public.transfers
  for select
  using (public.is_admin());

-- Admin can INSERT transfers
create policy "Admin can insert transfers" on public.transfers
  for insert
  with check (public.is_admin());

-- Admin can UPDATE transfers
create policy "Admin can update transfers" on public.transfers
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admin can DELETE transfers
create policy "Admin can delete transfers" on public.transfers
  for delete
  using (public.is_admin());

-- ============================================================================
-- 6. Create production RLS policies for packages
-- ============================================================================

-- Public can SELECT only active packages
create policy "Public can view active packages" on public.packages
  for select
  using (status = 'active');

-- Admin can SELECT all packages
create policy "Admin can view all packages" on public.packages
  for select
  using (public.is_admin());

-- Admin can INSERT packages
create policy "Admin can insert packages" on public.packages
  for insert
  with check (public.is_admin());

-- Admin can UPDATE packages
create policy "Admin can update packages" on public.packages
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admin can DELETE packages
create policy "Admin can delete packages" on public.packages
  for delete
  using (public.is_admin());

-- ============================================================================
-- 7. Create production RLS policies for bookings
-- ============================================================================

-- Public can INSERT bookings (create booking)
create policy "Public can create bookings" on public.bookings
  for insert
  with check (true);

-- Admin can SELECT all bookings
create policy "Admin can view all bookings" on public.bookings
  for select
  using (public.is_admin());

-- Admin can UPDATE bookings
create policy "Admin can update bookings" on public.bookings
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admin can DELETE bookings
create policy "Admin can delete bookings" on public.bookings
  for delete
  using (public.is_admin());

-- ============================================================================
-- 8. Instructions for adding first admin
-- ============================================================================

-- To add the first admin user, run this in Supabase SQL Editor (using service role):
-- 
-- INSERT INTO public.admin_users (user_id, email)
-- SELECT id, email
-- FROM auth.users
-- WHERE email = 'your-admin@example.com';
--
-- Or, if you know the user_id:
--
-- INSERT INTO public.admin_users (user_id, email)
-- VALUES ('<user-uuid>', 'your-admin@example.com');
