-- Update customer_gallery table policies to use public.admin_users table

-- Drop old admin policy based on user_metadata
DROP POLICY IF EXISTS "Admins can manage all gallery items" ON public.customer_gallery;

-- Create new admin policy based on public.admin_users table
CREATE POLICY "Admin users can manage all gallery items"
  ON public.customer_gallery
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Public read policy remains unchanged
-- (Already exists: "Public can view visible gallery items")

COMMENT ON POLICY "Admin users can manage all gallery items" ON public.customer_gallery 
  IS 'Allows users in public.admin_users table to perform all operations on customer_gallery';
