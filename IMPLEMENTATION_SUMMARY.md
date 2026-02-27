# Supabase Storage Image Upload Implementation

## ✅ Completed

### A) Storage Helper (`src/lib/storage/media.ts`)
- `MEDIA_BUCKET` constant
- `buildMediaPath()` - Creates organized paths like `tours/<id>/cover/<timestamp>-<file>`
- `getPublicMediaUrl()` - Converts path to public URL
- `extractPathFromUrl()` - Extracts path from URL (bonus)

### B) Admin UI Components
- `src/components/admin/ImageUploader.tsx` - Single image upload (cover)
- `src/components/admin/GalleryUploader.tsx` - Multiple image upload (gallery)

### C) Admin Form - TourForm (✅ COMPLETE)
- Updated to use `description`, `cover_image_path`, `gallery_image_paths`
- Implements 2-step save: Create record → Get ID → Enable uploads
- Integrated ImageUploader and GalleryUploader
- Admin page updated to load new schema fields

## 🔄 Remaining Tasks

### C) Admin Forms - TransferForm & PackageForm
Apply same updates as TourForm:

1. **Update FormData interface** - Replace `images` with `cover_image_path` and `gallery_image_paths`
2. **Add imports** - ImageUploader, GalleryUploader
3. **Update state** - Add `currentId` tracking
4. **Update payload** - Use new schema fields
5. **Update save logic** - Implement 2-step save
6. **Update JSX** - Replace old image inputs with new uploaders
7. **Update admin pages** - Load new schema fields in `/admin/transfers/[id]` and `/admin/packages/[id]`

### D) Customer Display Pages
Update to show uploaded images:

**List Cards** (`tours/page.tsx`, `transfers/page.tsx`, `packages/page.tsx`):
```typescript
import { getPublicMediaUrl } from "@/lib/storage/media";

// In card component:
{tour.cover_image_path ? (
  <img src={getPublicMediaUrl(tour.cover_image_path)} alt={tour.title} />
) : (
  <div className="bg-gray-200">No image</div>
)}
```

**Detail Pages** (`tours/[slug]/page.tsx`, etc.):
```typescript
// Cover image
{tour.cover_image_path && (
  <img src={getPublicMediaUrl(tour.cover_image_path)} className="w-full h-96 object-cover" />
)}

// Description
{tour.description && (
  <div className="prose max-w-none mt-6">
    <p className="whitespace-pre-wrap">{tour.description}</p>
  </div>
)}

// Gallery
{tour.gallery_image_paths && tour.gallery_image_paths.length > 0 && (
  <div className="grid grid-cols-3 gap-4 mt-8">
    {tour.gallery_image_paths.map((path, idx) => (
      <img key={idx} src={getPublicMediaUrl(path)} className="w-full h-48 object-cover rounded" />
    ))}
  </div>
)}
```

## Quick Reference - Schema Changes

### Database Columns
```sql
description text
cover_image_path text
gallery_image_paths jsonb default '[]'
```

### Old vs New
- ❌ `short_description`, `description`, `images` (string)
- ✅ `description`, `cover_image_path`, `gallery_image_paths` (array)

## Testing Checklist
1. ✅ Build compiles
2. ✅ TourForm create/edit works
3. ⏳ TransferForm create/edit works
4. ⏳ PackageForm create/edit works
5. ⏳ Customer pages show images
6. ⏳ Image upload/remove works
7. ⏳ Gallery upload/remove works

## Storage Bucket Setup
Run in Supabase SQL Editor if not done:
```sql
-- Ensure media bucket exists
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Public read policy
create policy "Public read access"
on storage.objects for select
using (bucket_id = 'media');

-- Authenticated upload/update/delete (admin)
create policy "Authenticated users can upload"
on storage.objects for insert
with check (bucket_id = 'media' AND auth.role() = 'authenticated');

create policy "Authenticated users can update"
on storage.objects for update
using (bucket_id = 'media' AND auth.role() = 'authenticated');

create policy "Authenticated users can delete"
on storage.objects for delete
using (bucket_id = 'media' AND auth.role() = 'authenticated');
```
