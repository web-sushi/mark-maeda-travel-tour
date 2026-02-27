-- Migration: Add user_id to bookings for optional customer accounts
-- Date: 2026-02-10
-- Description: Allow authenticated users to link bookings to their account while keeping guest checkout

-- Add user_id column (nullable for guest checkout)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);

-- Add comment
COMMENT ON COLUMN public.bookings.user_id IS 'Optional link to authenticated user account. NULL for guest bookings.';

-- RLS Policy: Authenticated users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Note: Do NOT add generic UPDATE policy
-- Updates should go through controlled API routes only
