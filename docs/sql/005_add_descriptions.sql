-- Add description fields to tours, transfers, and packages
-- Safe migration: columns are nullable, no data loss

-- Tours
ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Transfers
ALTER TABLE public.transfers
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Packages
ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Note: image_url column remains unchanged for backward compatibility
-- New uploads will use Supabase Storage, but existing URLs will continue to work
