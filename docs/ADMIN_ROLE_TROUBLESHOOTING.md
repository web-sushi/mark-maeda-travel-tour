# Admin Role Detection - Troubleshooting Guide

## Problem
Gallery upload fails with "Admin access only" because admin role is not detected.

## Solution Applied
Updated `src/components/admin/GalleryList.tsx` to check BOTH metadata locations:
- `user.user_metadata.role`
- `user.app_metadata.role`

## How Admin Detection Works

```typescript
const userMetadataRole = user.user_metadata?.role;
const appMetadataRole = user.app_metadata?.role;
const isAdmin = userMetadataRole === "admin" || appMetadataRole === "admin";
```

User is considered admin if EITHER location has `role: "admin"`.

## Debug Console Output

When you attempt an upload, check browser console for these logs:

### Successful Admin Detection:
```
[Gallery Upload] User: { email: "admin@example.com", id: "..." }
[Gallery Upload] user_metadata: { role: "admin" }
[Gallery Upload] app_metadata: { role: "admin", ... }
[Gallery Upload] Role check: { 
  userMetadataRole: "admin", 
  appMetadataRole: "admin", 
  isAdmin: true 
}
[Gallery Upload] Admin verified, uploading file: image.jpg
```

### Failed Admin Detection:
```
[Gallery Upload] User: { email: "user@example.com", id: "..." }
[Gallery Upload] user_metadata: {}
[Gallery Upload] app_metadata: {}
[Gallery Upload] Role check: { 
  userMetadataRole: undefined, 
  appMetadataRole: undefined, 
  isAdmin: false 
}
[Gallery Upload] Access denied. Not an admin user.
```

## How to Fix Missing Admin Role

### Option 1: Set in user_metadata (Supabase Dashboard)
1. Go to Supabase Dashboard → Authentication → Users
2. Find your admin user
3. Click "..." → Edit User
4. Scroll to "User Metadata" section
5. Add:
   ```json
   {
     "role": "admin"
   }
   ```
6. Click "Save"
7. Log out and log back in
8. Try upload again

### Option 2: Set in app_metadata (SQL)
```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-admin-email@example.com';
```

### Option 3: Set During User Creation (Recommended)
When creating admin users via code:

```typescript
const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@example.com',
  password: 'secure-password',
  email_confirm: true,
  user_metadata: {
    role: 'admin'
  }
});
```

## Verification Steps

1. **Check Console Logs:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Attempt file upload
   - Look for `[Gallery Upload]` logs
   - Verify `isAdmin: true` appears

2. **Check User Metadata:**
   ```sql
   SELECT 
     email, 
     raw_user_meta_data, 
     raw_app_meta_data 
   FROM auth.users 
   WHERE email = 'your-email@example.com';
   ```
   
   Should show:
   ```
   raw_user_meta_data: {"role": "admin"}
   -- OR --
   raw_app_meta_data: {"role": "admin"}
   ```

3. **Test Upload:**
   - Log out completely
   - Clear browser cache/cookies
   - Log back in as admin
   - Navigate to `/admin/gallery`
   - Try uploading an image
   - Should succeed with no "Admin access only" error

## Common Issues

### Issue: "Please log in"
**Cause:** User session expired or not authenticated
**Fix:** Log out and log back in

### Issue: "Admin access only" 
**Cause:** User doesn't have admin role in either metadata location
**Fix:** Set `role: "admin"` in user_metadata or app_metadata (see above)

### Issue: Console shows `userMetadataRole: undefined, appMetadataRole: undefined`
**Cause:** Role not set in database
**Fix:** Run SQL update or edit user in Supabase Dashboard

### Issue: Upload still fails after setting role
**Cause:** Stale session, role not loaded
**Fix:** 
1. Log out completely
2. Close all browser tabs for the app
3. Clear cookies for localhost
4. Log back in
5. Try again

### Issue: Role shows in database but not in console logs
**Cause:** Session was created before role was added
**Fix:** Force session refresh by logging out and back in

## Storage Policy Check

If admin detection works but upload still fails with RLS error:

```sql
-- Check storage policies
SELECT * FROM storage.policies 
WHERE bucket_id = 'customer-photos';

-- Should include policy allowing admin upload
```

If policies missing, run migration:
```bash
supabase migration up
# Or manually run: supabase/migrations/20260210_create_customer_photos_bucket.sql
```

## Testing Checklist
- [ ] Console shows user email and ID
- [ ] Console shows user_metadata object
- [ ] Console shows app_metadata object
- [ ] Console shows `isAdmin: true`
- [ ] Console shows "Admin verified, uploading file"
- [ ] Upload completes without errors
- [ ] Image preview appears after upload
- [ ] No "Admin access only" alert

## Need More Help?

If issue persists after following this guide:
1. Copy full console output (all `[Gallery Upload]` logs)
2. Copy output of SQL query checking user metadata
3. Check Supabase Dashboard → Storage → Policies for `customer-photos` bucket
4. Verify you're logged in as the correct user (check email in admin nav)
