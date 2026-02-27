# Customer Gallery Feature Documentation

## Overview
Complete implementation of customer gallery/reviews feature with admin management, public display pages, and homepage integration.

## Database Schema
**Table:** `public.customer_gallery`
**Storage Bucket:** `customer-photos` (public)

### Columns:
- `id` (uuid, primary key)
- `image_url` (text, required) - URL to image in customer-photos bucket
- `customer_name` (text, optional) - Guest name
- `tour_type` (text, optional) - Tour/transfer name
- `testimonial` (text, optional) - Review/comment
- `rating` (integer, optional) - 1-5 stars (null allowed for photo-only entries)
- `is_featured` (boolean, default false) - Display in featured section
- `is_visible` (boolean, default true) - Public visibility toggle
- `display_order` (integer, default 0) - Manual ordering
- `created_at` (timestamp)

## Features Implemented

### A) Public Reviews Page (`/reviews`)
**File:** `src/app/(marketing)/reviews/page.tsx`

**Functionality:**
- Fetches all visible gallery items from Supabase
- Orders by: `is_featured DESC`, `display_order ASC`, `created_at DESC`
- Renders two sections:
  1. **Featured Stories** - Larger cards with full details (name, rating, testimonial)
  2. **Guest Gallery** - Compact grid with photo focus, overlay on hover

**Components:**
- Uses `GalleryCard` component (`src/components/reviews/GalleryCard.tsx`)
- Supports photo-only entries (no awkward blank areas)
- Truncates long testimonials with "Read more" toggle
- CTA section linking to `/tours`

### B) Homepage Mini Preview
**File:** `src/app/(marketing)/page.tsx`

**"Guest Moments" Section:**
- Displays 9 images in responsive grid (2 cols mobile, 3 cols tablet/desktop)
- Prioritizes featured items first
- Each image is clickable → navigates to `/reviews`
- Hover overlay shows customer name (if available)
- "View All Guest Photos" button at bottom

### C) Navigation Bar
**File:** `src/components/layout/Header.tsx`

**Changes:**
- Added "Reviews" link between "Packages" and divider
- Consistent hover/active styling with other nav links
- Responsive (works on mobile menu)

### D) Admin Gallery Management (`/admin/gallery`)
**Files:**
- `src/app/admin/gallery/page.tsx` (server component)
- `src/components/admin/GalleryList.tsx` (client component)

**Functionality:**
- **Create:** Upload image to `customer-photos` bucket, fill optional fields
- **Read:** Table view with thumbnails, customer name, tour type, rating, order
- **Update:** Edit any field, replace image
- **Delete:** Remove entry (confirms before deleting)
- **Quick Toggles:** One-click toggle for `is_visible` and `is_featured`
- **Image Upload:** Direct upload to Supabase Storage with auto-generated filenames

**Form Fields:**
- Image Upload (required)
- Customer Name (optional)
- Tour Type (optional)
- Testimonial (optional textarea)
- Rating (optional dropdown, 0-5 stars)
- Display Order (number)
- Featured checkbox
- Visible checkbox

**Admin Nav Integration:**
- Added "Gallery" link in `src/components/admin/AdminNav.tsx`
- Appears between "Reviews" and "Settings"

## UI/UX Design

### Public Pages
- **Consistent with Tours pages:** rounded-xl, soft shadows, hover effects
- **Featured cards:** Larger (md:grid-cols-2, lg:grid-cols-3), show full content
- **Gallery grid:** Compact square aspect ratio, overlay on hover
- **Empty state:** Friendly placeholder when no photos exist
- **CTA section:** Prominent "Browse All Tours" button

### Admin Page
- **Table layout:** Easy scanning with thumbnails, quick actions
- **Inline form:** Appears above table when adding/editing
- **File upload:** Custom styled, shows preview after upload
- **Status badges:** Color-coded for featured/visible toggles
- **Responsive:** Works on tablet/desktop

## Technical Implementation

### Image Handling
```typescript
// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('customer-photos')
  .upload(filePath, file);

// Get public URL
const { data: urlData } = supabase.storage
  .from('customer-photos')
  .getPublicUrl(filePath);
```

### Data Fetching (Server Component)
```typescript
const { data: galleryItems } = await supabase
  .from("customer_gallery")
  .select("*")
  .eq("is_visible", true)
  .order("is_featured", { ascending: false })
  .order("display_order", { ascending: true })
  .order("created_at", { ascending: false });
```

### Client-side State Management
```typescript
// Admin uses useState for items list
const [items, setItems] = useState<GalleryItem[]>(initialItems);

// CRUD operations update local state + Supabase
const toggleVisible = async (id: string, currentValue: boolean) => {
  await supabase.from("customer_gallery").update({ is_visible: !currentValue }).eq("id", id);
  setItems(items.map(item => item.id === id ? { ...item, is_visible: !currentValue } : item));
};
```

## Files Changed/Created

### New Files:
1. `src/app/(marketing)/reviews/page.tsx` - Public reviews page
2. `src/components/reviews/GalleryCard.tsx` - Reusable gallery card component
3. `src/app/admin/gallery/page.tsx` - Admin gallery page
4. `src/components/admin/GalleryList.tsx` - Admin CRUD component

### Modified Files:
1. `src/components/layout/Header.tsx` - Added "Reviews" link
2. `src/app/(marketing)/page.tsx` - Added "Guest Moments" section
3. `src/components/admin/AdminNav.tsx` - Added "Gallery" link

## Usage Instructions

### For Admin Users:
1. Navigate to `/admin/gallery`
2. Click "+ Add New Photo"
3. Upload image (JPG/PNG)
4. Fill optional fields (name, tour type, testimonial, rating)
5. Set display order (lower numbers appear first)
6. Toggle "Featured" to show in Featured Stories section
7. Toggle "Visible" to publish/unpublish
8. Click "Add Photo" to save

### Photo-only Entries:
- Upload image
- Leave name/testimonial/rating empty
- These render cleanly without blank areas
- Useful for showcasing locations/vehicles without customer info

### Featured vs Gallery:
- **Featured:** Large cards with full details, top of `/reviews` page
- **Gallery:** Compact grid, bottom of `/reviews` page
- Use featured for strong testimonials with photos
- Use gallery for additional photos without reviews

## Brand Consistency
- **Primary Color:** #E4005A (buttons, accents, hover states)
- **Navy:** #1B0C3F to #2D1A5F (hero gradients)
- **Background:** #F8F9FC (sections)
- **Typography:** Consistent with Tours pages
- **Spacing:** py-16 sm:py-20 for sections
- **Hover Effects:** Scale-105, shadow-xl, border color change

## Performance Notes
- Server components for initial data fetch (fast, SEO-friendly)
- Client components only for interactivity (form, toggles)
- Images lazy-load via browser defaults
- Supabase Storage CDN for fast image delivery
- No N+1 queries (single query for all items)

## Future Enhancements (Optional)
- [ ] Lightbox modal for full-size image viewing
- [ ] Filter by tour type on `/reviews` page
- [ ] Auto-fetch photos from booking confirmations
- [ ] Instagram integration (import from hashtag)
- [ ] Admin bulk upload
- [ ] Image compression/optimization on upload
