-- Create stripe_webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  booking_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_booking_id 
  ON public.stripe_webhook_events(booking_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_created_at 
  ON public.stripe_webhook_events(created_at DESC);

-- Add Stripe session tracking columns to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_deposit_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_balance_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_deposit_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_balance_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Add index for faster Stripe session lookups
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_deposit_session 
  ON public.bookings(stripe_deposit_session_id);

CREATE INDEX IF NOT EXISTS idx_bookings_stripe_balance_session 
  ON public.bookings(stripe_balance_session_id);

-- Add new payment statuses to check constraint (if it exists)
-- First, drop existing constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_payment_status_check'
  ) THEN
    ALTER TABLE public.bookings 
      DROP CONSTRAINT bookings_payment_status_check;
  END IF;
END $$;

-- Recreate constraint with new statuses
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded', 'payment_failed'));

-- Comment on table
COMMENT ON TABLE public.stripe_webhook_events IS 
  'Tracks processed Stripe webhook events for idempotency. Prevents duplicate payment processing.';

COMMENT ON TABLE public.bookings IS 
  'Updated to track Stripe session IDs for deposit and balance payments, plus refund information.';
