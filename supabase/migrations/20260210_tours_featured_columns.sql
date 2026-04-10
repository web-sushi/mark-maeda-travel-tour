-- Migration: Add is_featured and featured_rank to public.tours
-- These columns power the "Hot Tours" section on the homepage.
-- The admin TourForm writes both values; the homepage queries is_featured = true,
-- ordered by featured_rank ASC (lower number = higher priority).

-- Boolean flag: whether this tour appears in the "Hot Tours" section
ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Display rank: lower number appears first (0 = highest priority)
ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS featured_rank integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.tours.is_featured IS
  'When true, tour appears in the Hot Tours section on the homepage';

COMMENT ON COLUMN public.tours.featured_rank IS
  'Sort order for featured tours (ASC). Lower number = higher priority. 0 is highest.';

-- Partial index for fast homepage query:
-- SELECT * FROM tours WHERE status = 'active' AND is_featured = true ORDER BY featured_rank
CREATE INDEX IF NOT EXISTS idx_tours_featured
  ON public.tours (is_featured, featured_rank)
  WHERE status = 'active' AND is_featured = true;
