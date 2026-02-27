-- Create storage bucket for customer photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-photos',
  'customer-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for customer-photos bucket
-- Public read access
CREATE POLICY "Public can view customer photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'customer-photos');

-- Admin upload access
CREATE POLICY "Admins can upload customer photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'customer-photos'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admin update access
CREATE POLICY "Admins can update customer photos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'customer-photos'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admin delete access
CREATE POLICY "Admins can delete customer photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'customer-photos'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Comment
COMMENT ON TABLE storage.buckets IS 'customer-photos bucket for guest gallery images';
