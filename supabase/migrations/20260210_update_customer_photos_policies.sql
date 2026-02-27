-- Update customer-photos bucket policies to use public.admin_users table

-- Drop old admin policies based on user_metadata
DROP POLICY IF EXISTS "Admins can upload customer photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update customer photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete customer photos" ON storage.objects;

-- Create new admin policies based on public.admin_users table
CREATE POLICY "Admin users can upload customer photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'customer-photos'
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can update customer photos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'customer-photos'
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can delete customer photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'customer-photos'
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Public read access remains unchanged
-- (Already exists: "Public can view customer photos")
