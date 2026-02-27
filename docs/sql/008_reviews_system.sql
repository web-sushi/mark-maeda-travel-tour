-- Migration: Reviews System
-- Creates booking_items, review_requests, and reviews tables with RLS

-- 1. booking_items table
CREATE TABLE IF NOT EXISTS public.booking_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('tour', 'transfer', 'package')),
  item_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  vehicle_selection jsonb NOT NULL DEFAULT '{}'::jsonb,
  vehicle_rates jsonb NOT NULL DEFAULT '{}'::jsonb,
  subtotal_amount numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_items_booking_id 
  ON public.booking_items(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_items_item 
  ON public.booking_items(item_type, item_id);

COMMENT ON TABLE public.booking_items IS 
  'Individual items in a booking (tours, transfers, packages) for per-item reviews';

-- 2. review_requests table
CREATE TABLE IF NOT EXISTS public.review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_requests_booking_id 
  ON public.review_requests(booking_id);

CREATE INDEX IF NOT EXISTS idx_review_requests_token 
  ON public.review_requests(token);

COMMENT ON TABLE public.review_requests IS 
  'Token-based review request links (one per booking, expires in 30 days)';

-- 3. reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_item_id uuid NOT NULL REFERENCES public.booking_items(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  display_name text,
  approved boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_booking_item_id 
  ON public.reviews(booking_item_id);

CREATE INDEX IF NOT EXISTS idx_reviews_booking_id 
  ON public.reviews(booking_id);

CREATE INDEX IF NOT EXISTS idx_reviews_approved_featured 
  ON public.reviews(approved, featured) 
  WHERE approved = true;

COMMENT ON TABLE public.reviews IS 
  'Customer reviews for booking items (requires admin approval to display publicly)';

-- RLS Policies
-- All three tables require admin access (public cannot read/write directly)

-- booking_items RLS
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can select booking_items"
  ON public.booking_items
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin can insert booking_items"
  ON public.booking_items
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update booking_items"
  ON public.booking_items
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete booking_items"
  ON public.booking_items
  FOR DELETE
  USING (public.is_admin());

-- review_requests RLS
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can select review_requests"
  ON public.review_requests
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin can insert review_requests"
  ON public.review_requests
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update review_requests"
  ON public.review_requests
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- reviews RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can select reviews"
  ON public.reviews
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin can insert reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update reviews"
  ON public.reviews
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete reviews"
  ON public.reviews
  FOR DELETE
  USING (public.is_admin());
