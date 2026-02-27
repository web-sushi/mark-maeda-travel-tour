# Admin Detection via public.admin_users Table

## Overview
Admin access is now controlled via the `public.admin_users` table instead of user metadata. This provides more secure and flexible admin management.

## Architecture

### 1. Admin Users Table
**Table:** `public.admin_users`
- **Purpose:** Whitelist of users with admin privileges
- **Schema:**
  ```sql
  CREATE TABLE public.admin_users (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now()
  );
  ```

### 2. API Endpoint: `/api/admin/is-admin`
**File:** `src/app/api/admin/is-admin/route.ts`

**Purpose:** Server-side admin check that queries `public.admin_users`

**Request:**
```typescript
GET /api/admin/is-admin
// No parameters needed (uses auth session)
```

**Response:**
```json
{
  "isAdmin": true,
  "userId": "uuid-here",
  "email": "admin@example.com"
}
```

**How it works:**
1. Gets current authenticated user via `supabase.auth.getUser()`
2. Queries `public.admin_users` for matching `user_id`
3. Returns `isAdmin: true` if found, `false` otherwise

### 3. Client-Side Helper
**File:** `src/components/admin/GalleryList.tsx`

**Helper function:**
```typescript
const checkIsAdmin = async (): Promise<boolean> => {
  const response = await fetch("/api/admin/is-admin");
  const data = await response.json();
  
  if (!data.isAdmin) {
    alert("Admin access only");
    return false;
  }
  return true;
};
```

**Used before:**
- File uploads
- Gallery item create/update/delete
- Visibility/featured toggles

## Updated Files

### Created:
1. **`src/app/api/admin/is-admin/route.ts`** - Admin check API endpoint
2. **`supabase/migrations/20260210_update_customer_photos_policies.sql`** - Storage policies
3. **`supabase/migrations/20260210_update_customer_gallery_policies.sql`** - Table policies

### Modified:
1. **`src/components/admin/GalleryList.tsx`**
   - Added `checkIsAdmin()` helper
   - Calls API before all admin operations
   - Removed user_metadata/app_metadata checks

## RLS Policies Updated

### Storage Bucket: `customer-photos`
```sql
-- Upload
CREATE POLICY "Admin users can upload customer photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'customer-photos'
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Update & Delete (similar pattern)
```

### Table: `public.customer_gallery`
```sql
CREATE POLICY "Admin users can manage all gallery items"
  ON public.customer_gallery FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );
```

## Setup Instructions

### 1. Run Migrations
```bash
# Via Supabase CLI
supabase migration up

# Or via Supabase Dashboard SQL Editor
# Run these files:
# - 20260210_update_customer_photos_policies.sql
# - 20260210_update_customer_gallery_policies.sql
```

### 2. Add Admin Users
```sql
-- Add user to admin_users table
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'admin@example.com';

-- Or multiple users
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users 
WHERE email IN ('admin1@example.com', 'admin2@example.com');
```

### 3. Verify Admin Status
```bash
# Test the API endpoint
curl http://localhost:3000/api/admin/is-admin \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# Expected response:
# {"isAdmin":true,"userId":"...","email":"..."}
```

### 4. Test Gallery Upload
1. Log in as admin user
2. Navigate to `/admin/gallery`
3. Open browser console (F12)
4. Try uploading an image
5. Check console for `[Gallery] Admin check: { isAdmin: true, ... }`

## Console Debug Output

### Successful Admin Check:
```
[Gallery] Admin check: {
  isAdmin: true,
  userId: "uuid-here",
  email: "admin@example.com"
}
[Gallery Upload] User authenticated: admin@example.com
[Gallery Upload] Admin verified, uploading file: image.jpg
```

### Failed Admin Check:
```
[Gallery] Admin check: { isAdmin: false }
// Alert: "Admin access only"
```

## Troubleshooting

### Issue: "Admin access only" error

**Cause:** User not in `public.admin_users` table

**Fix:**
```sql
-- Check if user exists
SELECT * FROM public.admin_users 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- If no results, add them
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'your-email@example.com';
```

### Issue: Storage upload fails with RLS error

**Cause:** Storage policies not updated

**Fix:**
```sql
-- Check current policies
SELECT * FROM storage.policies WHERE bucket_id = 'customer-photos';

-- Re-run migration
-- supabase/migrations/20260210_update_customer_photos_policies.sql
```

### Issue: API returns `{ isAdmin: false }` for admin user

**Check 1 - User in table:**
```sql
SELECT 
  au.user_id,
  u.email,
  au.created_at
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'your-email@example.com';
```

**Check 2 - RLS on admin_users:**
```sql
-- admin_users should allow authenticated users to read their own entry
SELECT * FROM public.admin_users WHERE user_id = auth.uid();
```

**Check 3 - API logs:**
```bash
# Check server logs for "[is-admin]" messages
# Should show query result
```

### Issue: CRUD operations fail after admin check passes

**Cause:** Table RLS policies not updated

**Fix:**
```sql
-- Check customer_gallery policies
SELECT * FROM pg_policies 
WHERE tablename = 'customer_gallery';

-- Should include "Admin users can manage all gallery items"
-- If not, re-run migration:
-- supabase/migrations/20260210_update_customer_gallery_policies.sql
```

## Security Benefits

### Before (user_metadata):
- ❌ User could manually set `role: "admin"` in metadata
- ❌ No audit trail of who became admin
- ❌ Harder to revoke admin access
- ❌ No central admin management

### After (admin_users table):
- ✅ Only database admins can add users to `admin_users`
- ✅ Clear audit trail (created_at timestamp)
- ✅ Easy to revoke: `DELETE FROM admin_users WHERE user_id = '...'`
- ✅ Central management via SQL or admin UI
- ✅ RLS policies enforce at database level

## Migration from user_metadata

If you have existing users with admin role in metadata:

```sql
-- Migrate users with admin role to admin_users table
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin'
OR raw_app_meta_data->>'role' = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Verify migration
SELECT 
  u.email,
  au.created_at as admin_since
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id;
```

## Testing Checklist

- [ ] Run new migrations
- [ ] Add test user to `admin_users` table
- [ ] Log in as admin user
- [ ] Navigate to `/admin/gallery`
- [ ] Check console shows `[Gallery] Admin check: { isAdmin: true }`
- [ ] Upload image - should succeed
- [ ] Create new gallery entry - should succeed
- [ ] Update entry - should succeed
- [ ] Toggle visible/featured - should succeed
- [ ] Delete entry - should succeed
- [ ] Log in as non-admin user
- [ ] Try upload - should show "Admin access only"

## API Usage in Other Components

To use the admin check in other admin components:

```typescript
"use client";

const checkIsAdmin = async (): Promise<boolean> => {
  try {
    const response = await fetch("/api/admin/is-admin");
    const data = await response.json();
    
    if (!data.isAdmin) {
      alert("Admin access only");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Admin check failed:", error);
    alert("Failed to verify admin access");
    return false;
  }
};

// Use before admin operations
const handleAdminAction = async () => {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) return;
  
  // Proceed with admin operation
  await supabase.from("table").insert({ ... });
};
```

## Future Enhancements

- [ ] Add `admin_level` column (e.g., super_admin, editor, viewer)
- [ ] Add `permissions` jsonb column for granular access control
- [ ] Create admin UI for managing admin_users
- [ ] Add audit logging for admin actions
- [ ] Implement role-based access control (RBAC)
