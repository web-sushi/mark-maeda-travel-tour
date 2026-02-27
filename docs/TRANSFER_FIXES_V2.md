# Transfer Detail Page Fixes - Version 2

**Date:** Feb 10, 2026  
**Status:** ✅ Complete

## Overview

This document describes the comprehensive fix for 3 critical issues on the Transfer detail pages:

1. **HTML Rendering Issue**: `transfer.description` was showing raw HTML tags instead of formatted text
2. **Image Display Issue**: Transfer images uploaded to Supabase Storage were not displaying
3. **Server Component Error**: "Event handlers cannot be passed to Client Component props" due to `onError` in Server Component

---

## Problems Identified

### Issue 1: Raw HTML in Description
- The description field was rendering plain HTML tags like `<p>`, `<strong>`, etc.
- Content was not formatted properly for readability
- No support for Markdown formatting

### Issue 2: Images Not Displaying
- Transfer images uploaded to Supabase Storage were not showing
- Image paths were not converted to public URLs correctly
- No fallback handling for missing images
- Inconsistent image handling between `cover_image_path`, `gallery_image_paths`, and `images` array

### Issue 3: Server Component onError Handler
- Previous fix added `onError` handlers directly to `<img>` tags in a Server Component
- This caused Next.js runtime error: "Event handlers cannot be passed to Client Component props"
- Client-side event handlers cannot be used in Server Components

---

## Solutions Implemented

### Part 1: Markdown Rendering for Descriptions

#### What Changed
- Updated `TransferContent.tsx` to use `react-markdown` library
- Descriptions are now rendered as formatted Markdown
- Added comprehensive prose styling with Tailwind

#### Implementation Details

**File:** `src/components/transfers/TransferContent.tsx`

```tsx
import ReactMarkdown from "react-markdown";

export default function TransferContent({ description, notes }: TransferContentProps) {
  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Transfer</h2>
        <div className="prose max-w-none prose-p:leading-relaxed prose-headings:mt-6 prose-headings:mb-3 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1 prose-strong:font-semibold prose-strong:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown>
            {description || "No description provided."}
          </ReactMarkdown>
        </div>
      </section>

      {notes && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Important Notes</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="prose max-w-none prose-p:leading-relaxed prose-p:text-gray-700 prose-ul:list-disc prose-ul:pl-6 prose-li:my-1 prose-strong:font-semibold">
              <ReactMarkdown>
                {notes}
              </ReactMarkdown>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
```

#### Supported Markdown Features
- Headings: `## Heading 2`, `### Heading 3`
- Bold: `**bold text**`
- Italic: `*italic text*`
- Lists: `- item` or `1. item`
- Links: `[text](url)`
- Paragraphs and line breaks

#### Admin Content Format
Admins should now paste Markdown instead of HTML:

```markdown
## About This Transfer

Comfortable private transfer from **Narita Airport** to central Tokyo.

### Features:
- Professional driver
- Meet & greet service
- Flight tracking included

### Vehicle Options:
1. Sedan (1-3 passengers)
2. Van (4-7 passengers)
3. Large van (8-12 passengers)
```

---

### Part 2: Supabase Storage Image Handling

#### What Changed
- Created comprehensive image resolution logic with 3-tier priority system
- Converts storage paths to public URLs using `getPublicImageUrl()`
- Handles both old schema (`images` array) and new schema (`cover_image_path`, `gallery_image_paths`)
- Added detailed console logging for debugging

#### Implementation Details

**File:** `src/app/(marketing)/transfers/[slug]/page.tsx`

**Storage Bucket:** `public-images` (shared with tours/packages)

**Image Resolution Priority:**

```typescript
// Priority 1: cover_image_path
if (transfer.cover_image_path) {
  coverUrl = getPublicImageUrl(transfer.cover_image_path);
}

// Priority 2: first gallery image path
if (!coverUrl && Array.isArray(transfer.gallery_image_paths) && transfer.gallery_image_paths.length > 0) {
  coverUrl = getPublicImageUrl(transfer.gallery_image_paths[0]);
}

// Priority 3: first image in images array
if (!coverUrl && Array.isArray(transfer.images) && transfer.images.length > 0) {
  coverUrl = transfer.images[0];
}
```

**Gallery Images Compilation:**
```typescript
const galleryUrls: string[] = [];

// Add gallery_image_paths (converted to public URLs)
if (Array.isArray(transfer.gallery_image_paths)) {
  transfer.gallery_image_paths.forEach((path: string) => {
    const url = getPublicImageUrl(path);
    if (url && url !== coverUrl) {
      galleryUrls.push(url);
    }
  });
}

// Add images array (skip the one used as cover)
if (Array.isArray(transfer.images)) {
  transfer.images.forEach((img: string) => {
    if (img && img !== coverUrl && !galleryUrls.includes(img)) {
      galleryUrls.push(img);
    }
  });
}
```

**Helper Function:**
```typescript
// src/lib/storage/publicUrl.ts
export function getPublicImageUrl(path?: string | null): string | null {
  if (!path) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/public-images/${path}`;
}
```

#### Transfers List Page Updates
**File:** `src/app/(marketing)/transfers/page.tsx`

Applied the same 3-tier priority logic:
```typescript
let imageUrl: string | null = null;

// Priority 1: cover_image_path
if (transfer.cover_image_path) {
  imageUrl = getPublicImageUrl(transfer.cover_image_path);
}

// Priority 2: first gallery image path
if (!imageUrl && Array.isArray(transfer.gallery_image_paths) && transfer.gallery_image_paths.length > 0) {
  imageUrl = getPublicImageUrl(transfer.gallery_image_paths[0]);
}

// Priority 3: first image in images array
if (!imageUrl && Array.isArray(transfer.images) && transfer.images.length > 0) {
  imageUrl = transfer.images[0];
}
```

---

### Part 3: SafeImage Client Component

#### What Changed
- Created a new Client Component `SafeImage.tsx` to handle image error fallbacks
- Moved all `onError` logic from Server Component to this Client Component
- Resolves Next.js error about event handlers in Server Components

#### Why This Fix Was Needed
- Next.js Server Components cannot have client-side event handlers like `onError`
- Event handlers must be in Client Components marked with `"use client"`
- The previous fix attempted to use `onError` directly in a Server Component

#### Implementation Details

**File:** `src/components/shared/SafeImage.tsx`

```tsx
"use client";

import { useState } from "react";

interface SafeImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * Client component for safely rendering images with fallback
 * Handles onError without breaking Server Component rules
 */
export default function SafeImage({
  src,
  alt,
  className = "",
  fallbackSrc = "/images/transfers-hero.jpg",
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}
```

**Features:**
- Accepts `src`, `alt`, `className`, and optional `fallbackSrc`
- Uses React state to track image errors
- Automatically switches to fallback on error
- Prevents infinite error loops with `hasError` flag
- Default fallback: `/images/transfers-hero.jpg`

#### Usage in Server Component

**Before (caused error):**
```tsx
<img
  src={coverUrl}
  alt={transfer.title}
  className="w-full h-full object-cover"
  onError={(e) => {
    e.currentTarget.src = "/images/placeholder.jpg";
  }}
/>
```

**After (works correctly):**
```tsx
<SafeImage
  src={coverUrl}
  alt={transfer.title}
  className="w-full h-full object-cover"
  fallbackSrc="/images/transfers-hero.jpg"
/>
```

#### Where SafeImage is Used
1. Transfer detail page hero image
2. Transfer detail page gallery images
3. All transfer images throughout the app

---

## Files Modified

### New Files Created
1. **`src/components/shared/SafeImage.tsx`**
   - Client component for safe image rendering with fallback
   - 40 lines

### Files Updated
1. **`src/components/transfers/TransferContent.tsx`**
   - Updated to use `react-markdown` for description rendering
   - Wrapped ReactMarkdown in styled divs
   - Added prose classes for typography

2. **`src/app/(marketing)/transfers/[slug]/page.tsx`**
   - Imported `SafeImage` component
   - Implemented 3-tier image resolution priority
   - Added debug logging for image fields
   - Replaced `<img>` tags with `<SafeImage>` components
   - Updated gallery compilation logic

3. **`src/app/(marketing)/transfers/page.tsx`**
   - Updated transfer list card image handling
   - Implemented same 3-tier priority system
   - Enhanced TransferData interface with image fields

---

## Technical Details

### Storage Configuration
- **Bucket Name:** `public-images`
- **Storage Path Format:** `transfers/[unique-id].[ext]`
- **Public URL Format:** `https://[project].supabase.co/storage/v1/object/public/public-images/transfers/[filename]`

### Image Fields in Database
- `cover_image_path` (text): Primary image path (preferred)
- `gallery_image_paths` (jsonb): Array of gallery image paths
- `images` (jsonb): Legacy array of full URLs (backwards compatibility)

### Next.js Image Optimization
Configured in `next.config.ts`:
```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "*.supabase.co",
      pathname: "/storage/v1/object/public/**",
    },
  ],
},
```

---

## Testing Checklist

### Pre-Launch Verification

#### 1. Description Rendering
- [ ] View a transfer detail page
- [ ] Confirm description shows formatted text (not raw HTML)
- [ ] Check that headings are styled correctly
- [ ] Verify bullet lists render properly
- [ ] Check bold/italic text displays correctly
- [ ] Test links are clickable and styled

#### 2. Cover Image Display
- [ ] View transfer with `cover_image_path` set
- [ ] Verify image displays correctly
- [ ] Check image is full width and proper height
- [ ] Test on mobile (responsive)
- [ ] View transfer with only `gallery_image_paths` (no cover)
- [ ] Verify first gallery image shows as cover
- [ ] View transfer with only legacy `images` array
- [ ] Verify first image shows as cover
- [ ] View transfer with no images
- [ ] Verify placeholder gradient with van icon shows

#### 3. Gallery Section
- [ ] View transfer with multiple gallery images
- [ ] Verify all gallery images display
- [ ] Check that cover image is NOT duplicated in gallery
- [ ] Test hover effect on gallery items
- [ ] Click gallery images (if lightbox enabled)

#### 4. Fallback Behavior
- [ ] Break an image URL in Supabase (change path to invalid)
- [ ] Refresh transfer page
- [ ] Verify broken image is replaced with `/images/transfers-hero.jpg`
- [ ] Check console for no infinite error loops

#### 5. Transfer List Page
- [ ] View `/transfers` page
- [ ] Verify all transfer cards show correct images
- [ ] Check cards with no images show placeholder
- [ ] Test category sections display properly

#### 6. Server Component Compliance
- [ ] Run `npm run build`
- [ ] Verify no "Event handlers cannot be passed" errors
- [ ] Check build completes successfully
- [ ] Test production build works correctly

#### 7. Console Logging (Development)
- [ ] Open browser console
- [ ] View a transfer detail page
- [ ] Check for debug logs:
   - "Transfer image fields: { cover_image_path, gallery_image_paths, images }"
   - "Using cover_image_path: [url]" (if present)
   - "Final coverUrl: [url]"
   - "Gallery URLs: [array]"

### Production Verification
- [ ] Deploy to staging
- [ ] Test all scenarios above
- [ ] Remove console.log statements (optional)
- [ ] Deploy to production
- [ ] Smoke test 3-5 transfer pages

---

## Debugging Guide

### Images Not Showing

**Check 1: Database Fields**
```sql
SELECT id, title, cover_image_path, gallery_image_paths, images
FROM transfers
WHERE slug = 'your-transfer-slug';
```

**Check 2: Console Logs**
Open browser console and look for:
```
Transfer image fields: {
  cover_image_path: "transfers/1234.jpg",
  gallery_image_paths: ["transfers/5678.jpg"],
  images: []
}
Using cover_image_path: https://[project].supabase.co/storage/v1/object/public/public-images/transfers/1234.jpg
Final coverUrl: https://[project].supabase.co/storage/v1/object/public/public-images/transfers/1234.jpg
Gallery URLs: ["https://[project].supabase.co/storage/v1/object/public/public-images/transfers/5678.jpg"]
```

**Check 3: Supabase Storage**
1. Go to Supabase Dashboard → Storage → `public-images`
2. Navigate to `transfers/` folder
3. Verify files exist
4. Test one URL directly in browser

**Check 4: Network Tab**
1. Open DevTools → Network tab
2. Filter by Images
3. Look for failed image requests (red)
4. Check status codes:
   - 404: File doesn't exist
   - 403: Bucket not public or wrong path
   - 200: Should work (check browser rendering)

**Check 5: Bucket Permissions**
```sql
-- Verify bucket is public
SELECT * FROM storage.buckets WHERE name = 'public-images';
-- public column should be true
```

### Description Not Formatting

**Check 1: Content Format**
- Description should be Markdown, not HTML
- Example: `## Heading` not `<h2>Heading</h2>`

**Check 2: ReactMarkdown Import**
```bash
npm list react-markdown
# Should show react-markdown@9.x.x or similar
```

**Check 3: Prose Classes**
- Verify Tailwind prose classes are in `tailwind.config.ts`
- Check `@tailwindcss/typography` is installed

### Server Component Error Still Occurring

**Check 1: File Directive**
- `SafeImage.tsx` must have `"use client"` at the top
- Verify no space before quotes: `"use client"` not `" use client"`

**Check 2: Import in Server Component**
```tsx
import SafeImage from "@/components/shared/SafeImage";
// Do NOT import with { SafeImage }
```

**Check 3: No Event Handlers in Server Component**
- Search for `onError` in Server Components
- Search for `onClick`, `onChange` in `.tsx` files without `"use client"`

---

## Rollback Plan

If issues occur in production:

### Quick Rollback (Revert to Previous Version)
```bash
git revert HEAD~3  # Revert last 3 commits
git push origin main
```

### Partial Rollback Options

**Option 1: Disable Markdown, Keep Images**
```tsx
// In TransferContent.tsx, replace with:
<div className="whitespace-pre-wrap">
  {description}
</div>
```

**Option 2: Disable SafeImage, Use Simple img**
```tsx
// In transfers/[slug]/page.tsx, replace SafeImage with:
{coverUrl && (
  <img src={coverUrl} alt={transfer.title} className="..." />
)}
```

**Option 3: Revert to Original Structure**
- Restore original `DetailContent.tsx`
- Remove SafeImage component
- Use plain `<img>` without onError

---

## Performance Considerations

### Image Loading
- Images are lazy-loaded by default in modern browsers
- Consider adding Next.js `<Image>` component for optimization
- Current implementation uses standard `<img>` for simplicity

### Markdown Parsing
- `react-markdown` parses on render (client-side)
- For large descriptions, consider pre-parsing on server
- Current implementation is fast enough for typical descriptions

### Build Size
- `react-markdown` adds ~50KB gzipped to bundle
- This is acceptable for the functionality gained
- Bundle is code-split per page automatically by Next.js

---

## Future Enhancements

### Potential Improvements
1. **Image Optimization**
   - Migrate from `<img>` to Next.js `<Image>` component
   - Implement image gallery lightbox
   - Add image lazy loading indicators

2. **Markdown Extensions**
   - Support for tables
   - Support for code blocks
   - Support for custom Markdown syntax (e.g., callouts)

3. **Admin Experience**
   - Live Markdown preview in admin form
   - Markdown syntax helper/cheatsheet
   - Auto-convert existing HTML to Markdown

4. **Image Management**
   - Bulk image upload for transfers
   - Image cropping/editing in admin
   - Automatic thumbnail generation

---

## Related Documentation
- `TRANSFER_DETAIL_FIXES.md` (Previous version)
- `SUPABASE_CONFIGURATION.md` (Storage setup)
- `CART_IMAGE_FIX.md` (Image handling patterns)

---

## Questions or Issues?

If you encounter any problems:
1. Check the debugging guide above
2. Review console logs (both browser and server)
3. Verify Supabase Storage configuration
4. Test with a known-good transfer record

**Last Updated:** Feb 10, 2026  
**Version:** 2.0  
**Author:** AI Assistant
