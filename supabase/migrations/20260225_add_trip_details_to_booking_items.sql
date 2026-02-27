-- Migration: Add trip details fields to booking_items
-- Adds pickup/dropoff locations, dates, and metadata for per-item trip planning

ALTER TABLE public.booking_items
ADD COLUMN IF NOT EXISTS pickup_location text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS dropoff_location text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS travel_date date,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS pickup_time time,
ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;

-- Add comments
COMMENT ON COLUMN public.booking_items.pickup_location IS 'Pickup location (required for all items)';
COMMENT ON COLUMN public.booking_items.dropoff_location IS 'Drop-off location (required for all items)';
COMMENT ON COLUMN public.booking_items.travel_date IS 'Travel date for tours and transfers';
COMMENT ON COLUMN public.booking_items.start_date IS 'Start date for packages';
COMMENT ON COLUMN public.booking_items.end_date IS 'End date for packages';
COMMENT ON COLUMN public.booking_items.pickup_time IS 'Pickup time (optional, mainly for transfers)';
COMMENT ON COLUMN public.booking_items.meta IS 'Additional metadata (flight_number, special_requests, etc.)';

-- Create index for date queries
CREATE INDEX IF NOT EXISTS idx_booking_items_travel_date 
  ON public.booking_items(travel_date) 
  WHERE travel_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_booking_items_start_date 
  ON public.booking_items(start_date) 
  WHERE start_date IS NOT NULL;
