-- Migration: Make bookings.travel_date nullable
-- Context: travel_date now lives per-item in booking_items table
-- The bookings table should not require a single travel_date anymore

-- Make travel_date nullable (if it has NOT NULL constraint)
ALTER TABLE public.bookings 
  ALTER COLUMN travel_date DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.bookings.travel_date IS 
  'DEPRECATED: Legacy field. Use booking_items.travel_date for per-item dates. Kept for backward compatibility.';

-- Optional: Add a meta jsonb column to bookings if it doesn't exist
-- This allows storing arbitrary booking-level metadata
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.bookings.meta IS 
  'Booking-level metadata (e.g., special requirements, admin notes, etc.)';
