# Customer Gallery - Setup Instructions

## Prerequisites

✅ Supabase project configured
✅ Admin user with role='admin' in user metadata
✅ Project running locally or deployed

## Step 1: Run Database Migrations

### Option A: Via Supabase CLI

```bash
cd /path/to/tour-webapp
supabase migration up
```

### Option B: Via Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/20260210_create_customer_gallery.sql`
3. Run `supabase/migrations/20260210_create_customer_photos_bucket.sql`

### What these migrations do:

- Create `public.customer_gallery` table
- Add indexes for performance
- Enable RLS with public read + admin write policies
- Create `customer-photos` storage bucket (public, 10MB limit)
- Add storage policies for admin upload/delete

## Step 2: Verify Table & Bucket

### Check Table

```sql
SELECT * FROM public.customer_gallery LIMIT 1;
```

Should return 0 rows (empty table is fine)

### Check Bucket

1. Go to Storage in Supabase Dashboard
2. Verify `customer-photos` bucket exists
3. Bucket should be marked as "Public"

## Step 3: Test Admin Upload

1. Log in as admin user
2. Navigate to `/admin/gallery`
3. Click "+ Add New Photo"
4. Upload a test image (JPG/PNG)
5. Fill optional fields:
   - Customer Name: "Test User"
   - Tour Type: "Mt. Fuji Tour"
   - Testimonial: "Amazing experience!"
   - Rating: 5 stars
   - Featured: checked
   - Visible: checked
6. Click "Add Photo"
7. Verify image appears in table below

## Step 4: Verify Public Display

### Homepage

1. Navigate to `/` (homepage)
2. Scroll to "Guest Moments" section
3. Your test photo should appear in the grid
4. Click on it → should navigate to `/reviews`

### Reviews Page

1. Navigate to `/reviews`
2. Your test photo should appear in "Featured Stories" section (large card)
3. Verify customer name, rating stars, and testimonial display correctly

### Navigation

1. Check header navigation for "Reviews" link (after Packages)
2. Click it → should go to `/reviews`
3. Active link should be highlighted

## Step 5: Test Photo-only Entry

1. Go to `/admin/gallery`
2. Add another photo but leave all optional fields empty:
   - Customer Name: (empty)
   - Tour Type: (empty)
   - Testimonial: (empty)
   - Rating: No rating
   - Featured: unchecked
   - Visible: checked
3. Click "Add Photo"
4. Navigate to `/reviews`
5. Photo should appear in "Guest Gallery" grid (bottom section)
6. Verify no awkward blank areas (should render cleanly)

## Step 6: Test Admin Features

### Toggle Visibility

1. In admin gallery table, click "Yes" button under Visible column
2. Button should turn red "No"
3. Navigate to `/reviews` → photo should disappear
4. Toggle back to visible

### Toggle Featured

1. Click "No" button under Featured column
2. Button should turn yellow "Yes"
3. Navigate to `/reviews` → photo should move to Featured section

### Edit Entry

1. Click "Edit" button on any row
2. Form should populate with existing values
3. Change testimonial text
4. Click "Update Photo"
5. Verify changes appear in public page

### Delete Entry

1. Click "Delete" button on any row
2. Confirm deletion
3. Verify entry removed from table and public page

## Troubleshooting

### Images not displaying

- Check bucket is public: Dashboard → Storage → customer-photos → Settings
- Check image_url in database contains full URL
- Check browser console for CORS errors

### Upload fails

- Verify bucket policies allow admin upload
- Check file size (must be < 10MB)
- Check file type (must be image/jpeg, image/png, etc.)

### Admin can't access /admin/gallery

- Verify user has `role: 'admin'` in `raw_user_meta_data`
- Check `isAdmin()` function in `src/lib/auth/isAdmin.ts`

### Public page shows no photos

- Verify at least one entry has `is_visible = true`
- Check RLS policies: `SELECT * FROM customer_gallery;` should work unauthenticated

### Featured/Gallery sections not showing

- Featured requires `is_featured = true` AND `is_visible = true`
- Gallery shows `is_featured = false` AND `is_visible = true`

## Best Practices

### Image Guidelines

- **Size:** Optimize before upload (max 2MB recommended)
- **Dimensions:** 1200x800px or similar aspect ratio
- **Format:** JPEG for photos, PNG for graphics
- **Quality:** 80-90% JPEG quality

### Content Guidelines

- **Customer Name:** Use first name only for privacy
- **Testimonials:** 50-200 words ideal
- **Featured:** 3-6 featured items recommended
- **Display Order:** Use increments of 10 (10, 20, 30...) for easy reordering

### Performance

- Limit gallery to ~50 visible items
- Archive old photos (set `is_visible = false` instead of deleting)
- Use Supabase CDN (automatic with public bucket)

## Success Checklist

- [ ] Database migrations ran successfully
- [ ] `customer_gallery` table exists
- [ ] `customer-photos` bucket exists and is public
- [ ] Admin can upload photos
- [ ] Photos appear on `/reviews` page
- [ ] Homepage "Guest Moments" section displays
- [ ] Navigation "Reviews" link works
- [ ] Featured/Gallery sections render correctly
- [ ] Photo-only entries display cleanly
- [ ] Admin toggle buttons work (visible/featured)
- [ ] Edit and delete functions work

## Next Steps

1. Upload real customer photos
2. Request testimonials from past guests
3. Feature best reviews with photos
4. Promote `/reviews` page in marketing materials
5. Consider adding Instagram integration (future)

---

## Update: Authentication Fix for Upload (Feb 10, 2026)

### Issue
Gallery upload was failing with `StorageApiError: "new row violates row-level security policy"` because the browser-side upload wasn't including the authenticated admin session.

### Fix Applied
Updated `src/components/admin/GalleryList.tsx` `handleFileUpload()` function to:

1. **Check Authentication:**
   ```typescript
   const { data: { user }, error: authError } = await supabase.auth.getUser();
   if (authError || !user) {
     alert("Please log in to upload images");
     return;
   }
   ```

2. **Verify Admin Role:**
   ```typescript
   const userRole = user.user_metadata?.role;
   if (userRole !== "admin") {
     alert("Admin access required to upload images");
     return;
   }
   ```

3. **Enhanced Error Logging:**
   - Logs authentication status
   - Logs user email and role
   - Logs detailed upload errors (status, message, statusCode)
   - Provides helpful error messages to user

### Testing After Fix
1. Log in as admin user
2. Go to `/admin/gallery`
3. Click file upload
4. Check browser console for `[Gallery Upload]` logs
5. Verify upload succeeds
6. If it fails, console will show detailed error info

### Common Issues After Fix

**Still getting RLS error?**
- Check user is logged in: Look for `[Gallery Upload] Authenticated user: xxx` in console
- Check user has admin role: Look for `[Gallery Upload] Admin verified` in console
- Verify storage policies exist: Run migration `20260210_create_customer_photos_bucket.sql`

**"Please log in" message?**
- User session expired - refresh page and log in again
- Check Supabase auth cookies aren't blocked

**"Admin access required" message?**
- User metadata missing role field
- Update user in Supabase Dashboard → Authentication → Users → Edit → User Metadata:
  ```json
  {
    "role": "admin"
  }
  ```
