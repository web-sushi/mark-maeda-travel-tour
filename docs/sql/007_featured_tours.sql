-- Add featured/hot tour columns to public.tours table
-- Run this migration if you haven't already added these columns

-- Add is_featured column (boolean flag)
ALTER TABLE public.tours 
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Add featured_rank column (lower number = higher priority)
ALTER TABLE public.tours 
  ADD COLUMN IF NOT EXISTS featured_rank integer DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.tours.is_featured IS 
  'Whether this tour should appear in the "Hot Tours" section on homepage';

COMMENT ON COLUMN public.tours.featured_rank IS 
  'Display order for featured tours (lower number appears first, 0 = highest priority)';

-- Optional: Create an index for better query performance on featured tours
CREATE INDEX IF NOT EXISTS idx_tours_featured 
  ON public.tours(is_featured, featured_rank) 
  WHERE status = 'active' AND is_featured = true;

-- Optional: Set some example featured tours (update IDs as needed)
-- UPDATE public.tours 
--   SET is_featured = true, featured_rank = 1 
--   WHERE slug = 'your-tour-slug-here';
