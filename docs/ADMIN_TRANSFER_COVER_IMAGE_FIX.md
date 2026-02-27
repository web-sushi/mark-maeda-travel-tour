# Admin Transfer Cover Image Upload Fix

## Problem
Transfer items in cart were not displaying images because `public.transfers.cover_image_path` was NULL.

## Root Cause
The Admin Transfer form was uploading images but storing full URLs in the `images` array field. It was not uploading and storing the cover image path in the `cover_image_path` column.

## Solution Implemented

### 1. New Storage Helper Function
**File:** `src/lib/supabase/storage.ts`

Added new function `uploadPublicImagePath()` that:
- Uploads image to Supabase Storage bucket "public-images" under `transfers/` folder
- Returns the **storage path** (e.g., `"transfers/1234567890-abc123.jpg"`) instead of the full URL
- This path is what gets stored in the database `cover_image_path` column

The existing `uploadPublicImage()` function continues to return full URLs for the gallery images array.

### 2. Updated Transfer Form
**File:** `src/components/admin/TransferForm.tsx`

Changes:
- Added `cover_image_path: string | null` to `TransferFormData` interface
- Added `handleCoverImageUpload()` function that uses `uploadPublicImagePath()` to upload and store the path
- Updated form state initialization to include `cover_image_path` from `initialData`
- Added new UI section "Cover Image *" with:
  - Preview of current cover image (using `getPublicImageUrl()` to convert path to URL)
  - File upload input for cover image
  - Remove button to clear cover image
- Updated save payload to include `cover_image_path` field
- Separated "Cover Image" (required, single) from "Gallery Images" (optional, multiple) in UI

### 3. Updated Admin Transfer Edit Page
**File:** `src/app/admin/transfers/[id]/page.tsx`

Changes:
- Added `cover_image_path: data.cover_image_path || null` to `initialData` object
- Added `hasCoverImage` to debug logging

### 4. Fixed TypeScript Errors
**Files:**
- `src/lib/admin/booking-helpers.ts`: Updated `formatDateRange()` and `sortItemsBySchedule()` to handle `undefined` types
- `src/components/transfers/TransferFilterBar.tsx`: Fixed `useRef` initialization for timer refs

## How It Works

### Admin Workflow:
1. Admin goes to `/admin/transfers/[id]` (edit existing) or `/admin/transfers/new` (create new)
2. In "Cover Image" section, admin uploads an image file
3. Upload process:
   - File is uploaded to `public-images` bucket under `transfers/` folder
   - Storage path (e.g., `transfers/1234567890-abc123.jpg`) is stored in `cover_image_path` field
4. On save, the storage path is written to `public.transfers.cover_image_path` column
5. On page reload, the form loads existing `cover_image_path` and displays preview

### Public Display:
1. Transfer detail page already fetches `cover_image_path` from database
2. Cart/drawer already calls `getPublicImageUrl(cover_image_path)` to display images
3. **No changes needed** to public-facing pages - they already handle `cover_image_path` correctly

## Files Modified

### Core Changes:
1. `src/lib/supabase/storage.ts` - Added `uploadPublicImagePath()` function
2. `src/components/admin/TransferForm.tsx` - Added cover image upload UI and logic
3. `src/app/admin/transfers/[id]/page.tsx` - Added `cover_image_path` to initial data

### Bug Fixes (unrelated but required for build):
4. `src/lib/admin/booking-helpers.ts` - TypeScript type fixes
5. `src/components/transfers/TransferFilterBar.tsx` - TypeScript type fix

## Verification Steps

1. ✅ Build succeeds (`npm run build` - exit code 0)
2. ⏳ To test in browser:
   - Navigate to `/admin/transfers/new` or edit existing transfer
   - Upload a cover image in the "Cover Image" section
   - Save the transfer
   - Verify `cover_image_path` is populated in database (e.g., `transfers/1234567890-abc123.jpg`)
   - Add transfer to cart
   - Verify image displays in cart page and cart drawer

## Expected Outcome

After uploading a cover image in the Admin Transfer form:
- Database column `public.transfers.cover_image_path` will contain a path like `"transfers/1234567890-abc123.jpg"`
- Transfer images will display correctly in:
  - Cart page (`/cart`)
  - Cart drawer (slide-in)
  - Transfer detail page (`/transfers/[slug]`)
  - Transfers list page (`/transfers`)

## Notes

- Cover image is now **separate** from gallery images
- Cover image path is stored as storage path, not full URL
- Gallery images (optional) continue to work as before with full URLs
- All existing transfers without `cover_image_path` will show fallback emoji (🚐) until an admin uploads a cover image
