# Admin Bookings List Date Rendering Fix

## Problem
The Date column in the admin bookings list (`/admin/bookings`) was showing `1/1/1970` (the Unix epoch date) because:
1. `bookings.travel_date` can be NULL (since we made it nullable)
2. `new Date(null)` returns the epoch date `Thu Jan 01 1970`
3. The page only fetched `bookings` table data, not `booking_items` with their date fields

## Solution Implemented

### 1. Created Client-Safe Date Formatters
**New File:** `src/lib/admin/date-formatters.ts`

This file contains pure date formatting utilities that don't import server-side code (safe for client components):
- `formatDate()` - Format single date with null handling
- `formatDateRange()` - Format date range with null handling
- `formatTime()` - Format time with null handling
- `formatBookingItemDate()` - **NEW** Smart date formatter that:
  - Uses `start_date ?? travel_date` as primary date
  - Uses `end_date ?? travel_date` as end date
  - Returns "—" if no valid dates
  - Never renders epoch (1/1/1970)

### 2. Updated Admin Bookings Page (Server Component)
**File:** `src/app/admin/bookings/page.tsx`

Changes:
- Added import for `BookingItemRow` type
- Created `BookingWithDates` interface extending `Booking` with `booking_items` field
- Changed order to sort by `created_at DESC` (not `travel_date` which can be null)
- Added query to fetch `booking_items` for all bookings:
  ```typescript
  const { data: allBookingItems } = await supabase
    .from("booking_items")
    .select("booking_id, travel_date, start_date, end_date")
    .in("booking_id", bookingIds);
  ```
- Grouped `booking_items` by `booking_id` and attached to each booking
- Passed enhanced bookings with `booking_items` to client component

### 3. Updated Bookings Table Client Component
**File:** `src/components/admin/BookingsTableClient.tsx`

Changes:
- Imported `formatBookingItemDate` from `@/lib/admin/date-formatters`
- Updated `Booking` interface to include `booking_items?: BookingItemRow[]`
- Changed `travel_date: string` to `travel_date: string | null`
- Added `getBookingDisplayDate()` helper function:
  - Tries to get date from first `booking_item` using `formatBookingItemDate()`
  - Falls back to `booking.travel_date` if no items
  - Returns "—" if no valid date
  - Never calls `new Date(null)`
- Updated table cell to use `{getBookingDisplayDate(booking)}` instead of `{new Date(booking.travel_date).toLocaleDateString()}`

### 4. Updated Booking Helpers (Server-Side)
**File:** `src/lib/admin/booking-helpers.ts`

Changes:
- Removed duplicate date formatter implementations
- Re-exported date formatters from `date-formatters.ts`:
  ```typescript
  import { 
    formatDate as formatDateUtil, 
    formatTime as formatTimeUtil, 
    formatDateRange as formatDateRangeUtil,
    formatBookingItemDate as formatBookingItemDateUtil
  } from "./date-formatters";
  
  export const formatDate = formatDateUtil;
  export const formatTime = formatTimeUtil;
  export const formatDateRange = formatDateRangeUtil;
  export const formatBookingItemDate = formatBookingItemDateUtil;
  ```
- Kept server-side functions like `computeTripSummary()`, `fetchItemNames()`, etc.

## How It Works

### Date Resolution Logic (Priority Order):
1. **From booking_items (preferred):**
   - `start_date` (for packages)
   - Falls back to `travel_date` (for tours/transfers)
   - `end_date` (for multi-day packages)

2. **From bookings table (fallback):**
   - `travel_date` (if no booking_items exist)

3. **Final fallback:**
   - Returns "—" if no valid dates anywhere

### Example Scenarios:

**Scenario 1: Package booking**
- `booking_items[0].start_date = "2026-03-15"`
- `booking_items[0].end_date = "2026-03-20"`
- **Display:** "Mar 15, 2026 – Mar 20, 2026"

**Scenario 2: Transfer booking**
- `booking_items[0].travel_date = "2026-03-15"`
- `booking_items[0].start_date = null`
- `booking_items[0].end_date = null`
- **Display:** "Mar 15, 2026"

**Scenario 3: Old booking (no booking_items)**
- `bookings.travel_date = "2026-03-15"`
- **Display:** "Mar 15, 2026"

**Scenario 4: No dates (edge case)**
- All date fields are null
- **Display:** "—" (never "1/1/1970")

## Files Modified

1. `src/lib/admin/date-formatters.ts` - **NEW** Client-safe date utilities
2. `src/app/admin/bookings/page.tsx` - Fetch `booking_items` with dates
3. `src/components/admin/BookingsTableClient.tsx` - Use smart date rendering
4. `src/lib/admin/booking-helpers.ts` - Re-export date formatters

## Verification

✅ Build passes (`npm run build` - exit code 0)
✅ No TypeScript errors
✅ No linter errors
✅ Client component can safely import date formatters (no server-side code)

## Expected Behavior After Fix

1. Admin bookings list will show correct dates from `booking_items`
2. No more `1/1/1970` dates
3. Date ranges display for multi-day packages
4. Single dates display for tours/transfers
5. "—" placeholder for bookings with no dates (edge case)
6. Graceful fallback to `bookings.travel_date` for old data without `booking_items`
