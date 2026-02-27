-- Create customer_gallery table for guest photos and testimonials
CREATE TABLE IF NOT EXISTS public.customer_gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  customer_name text,
  tour_type text,
  testimonial text,
  rating integer CHECK (rating >= 0 AND rating <= 5),
  is_featured boolean DEFAULT false NOT NULL,
  is_visible boolean DEFAULT true NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_customer_gallery_visible ON public.customer_gallery(is_visible);
CREATE INDEX IF NOT EXISTS idx_customer_gallery_featured ON public.customer_gallery(is_featured);
CREATE INDEX IF NOT EXISTS idx_customer_gallery_display_order ON public.customer_gallery(display_order);
CREATE INDEX IF NOT EXISTS idx_customer_gallery_created_at ON public.customer_gallery(created_at DESC);

-- Enable RLS
ALTER TABLE public.customer_gallery ENABLE ROW LEVEL SECURITY;

-- Public read access for visible items
CREATE POLICY "Public can view visible gallery items"
  ON public.customer_gallery
  FOR SELECT
  USING (is_visible = true);

-- Admin full access (adjust admin_role as needed)
CREATE POLICY "Admins can manage all gallery items"
  ON public.customer_gallery
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE public.customer_gallery IS 'Customer photos and testimonials for reviews page';
COMMENT ON COLUMN public.customer_gallery.image_url IS 'URL to image in customer-photos Supabase Storage bucket';
COMMENT ON COLUMN public.customer_gallery.customer_name IS 'Optional guest name';
COMMENT ON COLUMN public.customer_gallery.tour_type IS 'Optional tour/transfer name';
COMMENT ON COLUMN public.customer_gallery.testimonial IS 'Optional review/comment text';
COMMENT ON COLUMN public.customer_gallery.rating IS 'Optional 1-5 star rating (null for photo-only entries)';
COMMENT ON COLUMN public.customer_gallery.is_featured IS 'Show in featured section (larger cards)';
COMMENT ON COLUMN public.customer_gallery.is_visible IS 'Public visibility toggle';
COMMENT ON COLUMN public.customer_gallery.display_order IS 'Manual sort order (lower = earlier)';
