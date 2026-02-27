# Database Migration Guide

## Apply the public_view_token Migration

You need to add the `public_view_token` column to your Supabase database before testing the new guest booking flow.

### Option 1: Using Supabase Dashboard (Recommended for Quick Testing)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Add public_view_token column to bookings table
-- This token allows guests to view their booking after payment without authentication

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS public_view_token TEXT;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_bookings_public_view_token 
ON bookings(public_view_token) 
WHERE public_view_token IS NOT NULL;

-- Add comment explaining the column's purpose
COMMENT ON COLUMN bookings.public_view_token IS 
'Random token for guest access to booking success/track pages. Generated once at booking creation.';
```

5. Click **Run** to execute the migration
6. Verify the column was added:
   - Navigate to **Table Editor** → **bookings**
   - Check that `public_view_token` column exists

### Option 2: Using Supabase CLI (For Production/Version Control)

If you're using Supabase CLI and migrations:

1. Make sure the migration file exists:
   ```
   supabase/migrations/20260219_add_public_view_token.sql
   ```

2. Apply the migration:
   ```bash
   supabase db push
   ```

3. Or if using remote database:
   ```bash
   supabase db push --linked
   ```

### Verification

After applying the migration, verify it worked:

```sql
-- Check column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'public_view_token';

-- Check index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'bookings' 
AND indexname = 'idx_bookings_public_view_token';
```

Expected results:
- Column: `public_view_token` | `text` | `YES` (nullable)
- Index: `idx_bookings_public_view_token` exists

### Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove index
DROP INDEX IF EXISTS idx_bookings_public_view_token;

-- Remove column
ALTER TABLE bookings DROP COLUMN IF EXISTS public_view_token;
```

### Important Notes

- ✅ **Safe to apply:** This migration only adds a nullable column, so it won't affect existing data
- ✅ **No downtime:** The column is nullable, so existing functionality continues to work
- ✅ **Existing bookings:** Will have `NULL` for `public_view_token` (expected behavior)
- ℹ️ **New bookings:** Will automatically receive a token when created through the API

### Testing After Migration

Once the migration is applied:

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Test the guest booking flow:
   - Add items to cart
   - Proceed to checkout
   - Complete payment
   - Verify success page loads without "Booking Not Found" error

3. Check that token is generated:
   ```sql
   SELECT id, reference_code, public_view_token 
   FROM bookings 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

   New bookings should have a UUID in the `public_view_token` column.
