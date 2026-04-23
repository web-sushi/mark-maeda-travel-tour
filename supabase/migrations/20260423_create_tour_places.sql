-- Migration: create tour_places table
-- Each tour can have an ordered list of selectable places (image + name + optional description)

CREATE TABLE IF NOT EXISTS public.tour_places (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id         uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  name            text NOT NULL,
  image_path      text,               -- Storage path in public-images bucket (e.g. "tour-places/{tour_id}/{timestamp}.jpg")
  description     text,               -- Optional short description shown on hover/expand
  display_order   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for fast look-up by tour
CREATE INDEX IF NOT EXISTS tour_places_tour_id_idx ON public.tour_places(tour_id, display_order);

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.tour_places ENABLE ROW LEVEL SECURITY;

-- Public can read places for active tours
CREATE POLICY "tour_places_public_read"
  ON public.tour_places FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tours
      WHERE tours.id = tour_places.tour_id
        AND tours.status = 'active'
    )
  );

-- Authenticated admin users can do full CRUD
-- (adjust role check to match your admin setup — here we allow any authenticated user
--  because the admin panel is already protected by middleware)
CREATE POLICY "tour_places_admin_all"
  ON public.tour_places FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
