# Admin Detection Refactor - Summary

## What Changed

**Before:** Admin detection used `user_metadata.role` or `app_metadata.role`  
**After:** Admin detection uses `public.admin_users` table

## Why?

- **More Secure:** Users can't self-promote to admin
- **Better Control:** Centralized admin management via database
- **Audit Trail:** Track who became admin and when
- **Easy Revoke:** Simple DELETE to remove admin access

## Files Changed

### Created (4 files):
1. `src/app/api/admin/is-admin/route.ts` - API endpoint to check admin status
2. `supabase/migrations/20260210_update_customer_photos_policies.sql` - Storage RLS
3. `supabase/migrations/20260210_update_customer_gallery_policies.sql` - Table RLS
4. `docs/ADMIN_USERS_TABLE.md` - Complete documentation

### Modified (1 file):
1. `src/components/admin/GalleryList.tsx`
   - Added `checkIsAdmin()` helper function
   - All CRUD operations now check admin via API before proceeding
   - Removed user_metadata/app_metadata checks

## How It Works

```
User Action (Upload/Create/Update/Delete)
  ↓
Client calls checkIsAdmin()
  ↓
Fetches /api/admin/is-admin
  ↓
API queries: SELECT * FROM admin_users WHERE user_id = auth.uid()
  ↓
Returns { isAdmin: true/false }
  ↓
If false → Alert "Admin access only"
If true → Proceed with operation
```

## Setup Required

### 1. Run Migrations
```bash
supabase migration up
```

### 2. Add Admin Users
```sql
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'your-admin@example.com';
```

### 3. Test
- Log in as admin
- Go to `/admin/gallery`
- Try upload (should work)
- Check console for `[Gallery] Admin check: { isAdmin: true }`

## Quick Verification

```sql
-- Check who is admin
SELECT u.email, au.created_at 
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id;

-- Add yourself as admin
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';
```

## Console Output

**Success:**
```
[Gallery] Admin check: { isAdmin: true, userId: "...", email: "..." }
[Gallery Upload] Admin verified, uploading file: image.jpg
```

**Failure:**
```
[Gallery] Admin check: { isAdmin: false }
// Alert: "Admin access only"
```

## All Protected Operations

✅ File upload  
✅ Gallery item create  
✅ Gallery item update  
✅ Gallery item delete  
✅ Toggle visibility  
✅ Toggle featured  

All now check admin status before proceeding.

## Next Steps

1. ✅ Run migrations
2. ✅ Add your user to `admin_users` table
3. ✅ Test upload on `/admin/gallery`
4. ✅ Verify console shows admin check passing
5. ✅ Test all CRUD operations work

## Documentation

See `docs/ADMIN_USERS_TABLE.md` for:
- Detailed architecture
- Troubleshooting guide
- Security benefits
- API usage examples
- Migration from user_metadata
