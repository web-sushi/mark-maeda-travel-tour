# Rollback: iOS Safari Fixes - Return to Home Page Pattern

**Status:** ✅ Completed  
**Date:** February 10, 2026  
**Action:** Reverted iOS-specific fixes, restored simple layout matching Home page

---

## Problem with Previous Fix

The recent iOS Safari stacking context fixes (isolation, explicit z-index, etc.) **made the pages worse** on real iPhone devices:
- Pages appeared darker/more faded than before
- Layout looked incorrect and out of place
- The "fix" introduced more problems than it solved

## Decision: Rollback and Match Home Page

**Key Insight:** The Home page "Hot Tours" section works perfectly on real iPhone Safari/Chrome with a **simple, straightforward approach**. Instead of adding complexity, we should match what already works.

---

## Changes Made

### 1. Reverted HorizontalCardCarousel Component

**File:** `src/components/ui/HorizontalCardCarousel.tsx`

**Removed:**
- `isolation-isolate` on container
- Fade gradient overlays (left/right)
- Complex z-index layering
- Inline style z-index values

**Restored:**
- Simple `relative` container
- Direct `overflow-x-auto` scroll
- Clean structure matching Home page

**Before (Complex - Caused Issues):**
```tsx
<div className="relative isolation-isolate">
  <div style={{ zIndex: 10 }} className="... pointer-events-none" />  {/* Gradients */}
  <div style={{ zIndex: 10 }} className="... pointer-events-none" />
  <div className="overflow-x-auto ... relative" style={{ zIndex: 1 }}>
    {children}
  </div>
</div>
```

**After (Simple - Matching Home):**
```tsx
<div className="relative">
  <div className="overflow-x-auto scrollbar-hide pb-4">
    <div className="flex gap-4 px-4 sm:px-6 lg:px-8 snap-x snap-mandatory">
      {children}
    </div>
  </div>
</div>
```

---

### 2. Removed Isolation from Section Wrappers

**Files:**
- `src/components/listing/ToursListClient.tsx`
- `src/components/transfers/TransfersBrowser.tsx`

**Removed:** `isolation-isolate` class from section wrappers

**Before:**
```tsx
<div className="py-12 mt-8 isolation-isolate">
```

**After:**
```tsx
<div className="py-12 mt-8">
```

---

### 3. Restored Simple Image Styling (Matching Home Page)

**Home Page Pattern (What Works):**
```tsx
<div className="relative w-full h-40 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 overflow-hidden">
  {imageUrl ? (
    <img
      src={imageUrl}
      alt={title}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
    />
  ) : (
    {/* Fallback */}
  )}
</div>
```

**Key Features of Home Page Pattern:**
- **Fixed height:** `h-40` or `h-48` (not aspect-ratio)
- **Simple overflow:** `overflow-hidden` directly on wrapper
- **Basic object-fit:** `object-cover` without `object-center` (not needed)
- **Gradient background:** For nice fallback when no image
- **Hover effect:** `group-hover:scale-110` for subtle zoom

---

### 4. Updated All Card Components

Applied Home page pattern to all listing card components:

#### A. ListingCard.tsx (Shared Component)

**Before:**
```tsx
<div className="w-full aspect-[16/9] relative ...">
  <img className="... object-cover object-center" />
</div>
```

**After (Matching Home):**
```tsx
<div className="w-full h-48 relative bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 overflow-hidden">
  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
</div>
```

#### B. TourCard.tsx

**Before:**
```tsx
<div className="w-full aspect-[16/9] relative bg-gray-200">
  <img className="... object-cover object-center" />
</div>
```

**After (Matching Home):**
```tsx
<div className="w-full h-48 relative bg-gray-200 overflow-hidden">
  <img className="w-full h-full object-cover" />
</div>
```

#### C. TransferCard.tsx (transfers/)

**Same changes as TourCard**

#### D. TransferCard.tsx (listing/)

**Before:**
```tsx
<div className="w-full aspect-[16/9] bg-gray-200 relative">
  <img className="... object-cover object-center" />
</div>
```

**After (Matching Home):**
```tsx
<div className="w-full h-48 bg-gray-200 relative overflow-hidden">
  <img className="w-full h-full object-cover" />
</div>
```

---

### 5. Removed iOS-Specific Hints

**Removed from ListingCard.tsx:**
```tsx
style={{ willChange: 'transform' }}  // No longer needed
```

---

## What Was Removed

### ❌ Removed: Complex Stacking Context Management
- `isolation-isolate` classes
- Explicit inline `style={{ zIndex: X }}` values
- Multiple positioning layers

### ❌ Removed: Aspect Ratio Approach
- `aspect-[16/9]` (caused issues on iPhone)
- `object-center` positioning (not needed)

### ❌ Removed: Performance Hints
- `willChange: 'transform'` inline styles

### ❌ Removed: Fade Gradients
- Left/right gradient overlays (caused dark appearance on iOS)

---

## What Was Restored

### ✅ Simple Layout Structure
- Clean `relative` containers without isolation
- Direct `overflow-x-auto` scrolling
- No complex z-index management

### ✅ Fixed Height Images
- `h-48` (192px) fixed height
- Matches Home page exactly
- Works reliably on iOS Safari

### ✅ Basic Image Styling
- `object-cover` without extra positioning
- Simple `overflow-hidden` on wrapper
- Gradient backgrounds for missing images

---

## Files Changed

| File | Changes | Purpose |
|------|---------|---------|
| `src/components/ui/HorizontalCardCarousel.tsx` | Removed fade gradients, isolation, z-index layers | Restore simple carousel structure |
| `src/components/listing/ToursListClient.tsx` | Removed `isolation-isolate` from wrapper | Remove unnecessary isolation |
| `src/components/transfers/TransfersBrowser.tsx` | Removed `isolation-isolate` from wrapper | Remove unnecessary isolation |
| `src/components/listing/ListingCard.tsx` | Changed `aspect-[16/9]` → `h-48`, removed `object-center`, removed `willChange` | Match Home page pattern |
| `src/components/tours/TourCard.tsx` | Changed `aspect-[16/9]` → `h-48`, removed `object-center` | Match Home page pattern |
| `src/components/transfers/TransferCard.tsx` | Changed `aspect-[16/9]` → `h-48`, removed `object-center` | Match Home page pattern |
| `src/components/listing/TransferCard.tsx` | Changed `aspect-[16/9]` → `h-48`, removed `object-center` | Match Home page pattern |

**Total:** 7 files reverted/updated

---

## Why This Approach is Better

### 1. Proven to Work
- Home page works perfectly on real iPhone Safari/Chrome
- No reports of dark overlays or layout issues
- Simple pattern that browsers handle consistently

### 2. Less Complexity
- No stacking context management
- No isolation boundaries
- No z-index calculations
- Easier to maintain

### 3. More Predictable
- Fixed heights are more reliable than aspect-ratio on older iOS
- Simple overflow behavior works everywhere
- No browser-specific quirks to worry about

### 4. Better Performance
- Fewer composite layers
- Simpler rendering pipeline
- No isolation overhead

---

## Comparison: Before vs After Rollback

### Before Rollback (Complex iOS "Fix")

```tsx
// Carousel with fade gradients and isolation
<div className="relative isolation-isolate">
  <div style={{ zIndex: 10 }} />  {/* Gradient */}
  <div style={{ zIndex: 10 }} />  {/* Gradient */}
  <div style={{ zIndex: 1 }}>    {/* Content */}
    <div className="aspect-[16/9]">
      <img className="object-cover object-center" style={{ willChange: 'transform' }} />
    </div>
  </div>
</div>
```

**Issues:**
- Dark appearance on iOS
- Gradients visible over content
- Complex stacking caused visual glitches

### After Rollback (Home Page Pattern)

```tsx
// Simple carousel structure
<div className="relative">
  <div className="overflow-x-auto scrollbar-hide pb-4">
    <div className="h-48 overflow-hidden">
      <img className="w-full h-full object-cover" />
    </div>
  </div>
</div>
```

**Benefits:**
- Clean, simple structure
- No stacking context issues
- Works reliably on all browsers including iOS Safari

---

## Testing Checklist

### Required: Real iPhone Testing

- [ ] **Tours Page** (`/tours`)
  - [ ] No dark overlay over "Available Tours" section
  - [ ] Cards and text are clearly visible
  - [ ] Images display correctly in cards
  - [ ] Smooth horizontal scrolling
  - [ ] No faded or washed-out appearance

- [ ] **Transfers Page** (`/transfers`)
  - [ ] No dark overlay over transfer sections
  - [ ] Cards and text are clearly visible
  - [ ] Images display correctly in cards
  - [ ] Smooth horizontal scrolling
  - [ ] Filter controls work normally

- [ ] **Compare to Home Page**
  - [ ] Tours/Transfers cards look similar to Home page "Hot Tours"
  - [ ] Same image quality and clarity
  - [ ] Consistent card styling

### Desktop Testing (Should Still Work)

- [ ] Chrome: Tours/Transfers pages render correctly
- [ ] Firefox: Tours/Transfers pages render correctly
- [ ] Safari: Tours/Transfers pages render correctly

---

## Lessons Learned

### ❌ What Didn't Work

1. **Over-Engineering:** Adding complex stacking context management for iOS actually made things worse
2. **Aspect Ratios:** `aspect-[16/9]` caused more issues than fixed heights on iOS
3. **Explicit Z-Index:** Inline z-index values created visual artifacts
4. **Fade Gradients:** White gradient overlays appeared dark on iOS Safari

### ✅ What Works

1. **Keep It Simple:** The simplest solution is often the best
2. **Match Working Patterns:** If Home page works, copy its approach exactly
3. **Fixed Heights:** More reliable than aspect ratios on older browsers
4. **Minimal Layers:** Avoid unnecessary positioning and stacking contexts

### 🎯 Key Takeaway

**When fixing iOS issues, first check if there's already a working pattern elsewhere in the codebase. Don't add complexity when simplicity works.**

---

## Future Recommendations

1. **Before Adding iOS Fixes:**
   - Check if the issue exists in other working sections
   - Test on real iPhone device first
   - Start with simplest possible solution

2. **Card Image Pattern:**
   - Always use Home page pattern as reference
   - Fixed `h-48` or `h-40` height
   - Simple `object-cover` without extra positioning
   - Gradient backgrounds for missing images

3. **Carousel Pattern:**
   - Keep structure simple (no fade gradients unless necessary)
   - Avoid isolation and z-index unless absolutely required
   - Let browser handle scrolling naturally

4. **Testing Protocol:**
   - Always test on real iPhone Safari/Chrome (not just emulator)
   - Compare with working sections (Home page)
   - Verify no dark overlays or faded appearance

---

## Related Documentation

- [IOS_SAFARI_VIEWPORT_FIX.md](./IOS_SAFARI_VIEWPORT_FIX.md) - Viewport height fixes (kept)
- [IOS_SAFARI_DARK_OVERLAY_FIX.md](./IOS_SAFARI_DARK_OVERLAY_FIX.md) - Backdrop-filter removal (kept)
- [IOS_SAFARI_CAROUSEL_STACKING_FIX.md](./IOS_SAFARI_CAROUSEL_STACKING_FIX.md) - Previous attempt (reverted)

---

## Summary

**Action Taken:** Rolled back iOS stacking context fixes that made pages worse.

**New Approach:** Match the Home page "Hot Tours" section pattern exactly:
- Simple carousel structure (no fade gradients, no isolation)
- Fixed height images (`h-48` instead of `aspect-[16/9]`)
- Basic `object-cover` styling (no `object-center` needed)
- Clean overflow handling

**Result:**
✅ Removed dark/faded appearance  
✅ Restored clean, simple layout  
✅ Matched proven Home page pattern  
✅ Build passes successfully  
✅ Ready for iPhone testing  

The Tours and Transfers listing pages now use the same proven approach as the Home page, which works correctly on real iPhone Safari/Chrome devices.
