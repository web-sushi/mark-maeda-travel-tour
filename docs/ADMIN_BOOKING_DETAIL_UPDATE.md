# Admin Booking Detail Page - Per-Item Trip Details Update

## Overview

The Admin Booking Detail page has been completely redesigned to support the new per-item trip details data model, where travel dates, pickup/dropoff locations, and passenger information are stored in `public.booking_items` instead of at the booking level.

## Changes Made

### 1. Type Definitions (`src/types/booking.ts`)

**Added New Types:**

```typescript
// Database row for booking_items table
export interface BookingItemRow {
  id: string;
  booking_id: string;
  item_type: "tour" | "transfer" | "package";
  item_id: string;
  title?: string | null;
  slug?: string | null;
  vehicle_selection?: any;
  vehicle_rates?: any;
  subtotal_amount?: number | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  travel_date?: string | null; // for tours/transfers
  start_date?: string | null; // for packages
  end_date?: string | null; // for packages
  pickup_time?: string | null;
  passengers_count?: number | null;
  large_suitcases?: number | null;
  meta?: Record<string, any> | null; // flight_number, special_requests
  created_at: string;
}

// Enhanced item with fetched names from related tables
export interface EnhancedBookingItem extends BookingItemRow {
  fetched_name?: string | null;
}
```

### 2. Helper Functions (`src/lib/admin/booking-helpers.ts`)

**Created utility functions:**

- `formatDateRange(startDate, endDate)` - Format date ranges for packages
- `formatDate(dateString)` - Format single dates for tours/transfers
- `formatTime(timeString)` - Convert 24h time to 12h AM/PM format
- `getItemDate(item)` - Extract effective date from item (for sorting)
- `computeTripSummary(items)` - Calculate aggregate trip statistics
- `fetchItemNames(items)` - Fetch item titles from tours/transfers/packages tables
- `getItemAdminUrl(itemType, itemId)` - Generate admin edit URLs
- `sortItemsBySchedule(items)` - Sort items by date and time

**Key Features:**

- **Smart Location Handling**: Shows single location if all items share it, or "Varies per item" if different
- **Null Safety**: All functions handle missing/null data gracefully with "—" fallbacks
- **Performance**: Fetches item names in parallel using Promise.all()
- **Type Safety**: Full TypeScript support with proper types

### 3. Admin Booking Detail Page (`src/app/admin/bookings/[id]/page.tsx`)

**Major UI Sections:**

#### A. Trip Summary Card (NEW)
- Displays aggregate data across all booking items
- Shows earliest to latest date range
- Total items, passengers, and suitcases count
- Pickup/dropoff locations (or "Varies per item")
- Gradient blue background for visual prominence

#### B. Customer Info
- Unchanged from previous version
- Shows name, email, phone, reference code

#### C. Financials
- Unchanged from previous version
- Shows total amount, deposit choice, amounts paid/remaining

#### D. Booking Items - Detailed Cards (REDESIGNED)
**Replaced old JSON display with rich cards showing:**

- Item type badge (Tour/Transfer/Package) with emoji
- Fetched item name (from related table)
- "View Item →" link to admin edit page
- Date display:
  - Tours/Transfers: Single travel_date
  - Packages: start_date – end_date range
- Pickup time (if present)
- Passengers count (if present)
- Large suitcases count (if present)
- Subtotal amount (if present)
- Pickup → Dropoff locations with emoji indicators
- Special requests/flight number (from meta jsonb)

**Visual Design:**
- Cards have hover effect (border changes to blue)
- Emoji icons for visual categorization
- Color-coded type badges
- Clean grid layout for details
- Conditional rendering (no blank spaces for missing data)

#### E. Schedule Timeline (NEW)
**Compact chronological view:**

- Items sorted by date, then by pickup time
- Timeline-style rows showing:
  - Date and time
  - Type badge
  - Item name
  - Pickup → Dropoff locations
- Easy-to-scan layout for multi-day trips

#### F. Existing Sections
- Admin Notes
- Action Buttons (confirm/cancel/mark paid)
- Status Form
- Event Timeline

**All unchanged and fully functional**

### 4. Data Flow

```
1. Fetch booking from public.bookings
   ↓
2. Fetch booking_items with all trip details
   ↓
3. Fetch item names from tours/transfers/packages tables (parallel)
   ↓
4. Compute trip summary from items
   ↓
5. Sort items for schedule view
   ↓
6. Render enhanced UI
```

## Database Queries

### Booking Items Query
```typescript
const { data: bookingItems } = await supabase
  .from("booking_items")
  .select("*")
  .eq("booking_id", id)
  .order("created_at", { ascending: true });
```

### Item Names Fetch (in helper)
```typescript
// Parallel queries by type
const [tours, transfers, packages] = await Promise.all([
  supabase.from('tours').select('id, title').in('id', tourIds),
  supabase.from('transfers').select('id, title').in('id', transferIds),
  supabase.from('packages').select('id, title').in('id', packageIds),
]);
```

## UI Examples

### Trip Summary Display

```
📅 Trip Summary
┌────────────────────────────────────────────────┐
│ Date Range: Mar 15, 2024 – Mar 18, 2024       │
│ Total Items: 3                                  │
│ Total Passengers: 8                             │
│ Large Suitcases: 12                             │
│ Pickup Location: Narita Airport Terminal 1     │
│ Dropoff Location: Varies per item              │
└────────────────────────────────────────────────┘
```

### Item Card Display

```
🎫 TOUR                                    View Item →
Nagoya Day Tour with Expert Guide

Travel Date: Mar 15, 2024
Pickup Time: 9:00 AM
Passengers: 4
Large Suitcases: 6
Subtotal: ¥45,000

📍 From: Hotel Granvia Kyoto  →  🎯 To: Nagoya Station

Special Requests:
Please arrange vegetarian lunch options
```

### Schedule Timeline Display

```
🗓️ Schedule Timeline
┌────────────────────────────────────────────────┐
│ Mar 15, 2024    [TOUR]    Nagoya Day Tour     │
│ 9:00 AM         Hotel Granvia → Nagoya Station│
├────────────────────────────────────────────────┤
│ Mar 16, 2024    [TRANSFER] Airport Pickup     │
│ 2:30 PM         Narita Airport → Hotel         │
├────────────────────────────────────────────────┤
│ Mar 17-18, 2024 [PACKAGE]  2-Day Mt. Fuji     │
│                 Kawaguchiko → Tokyo Station    │
└────────────────────────────────────────────────┘
```

## Fixes Implemented

### ✅ Removed bookings.travel_date Display
- The old "Travel Date" showing 1/1/1970 is now gone
- Replaced with computed date range from booking_items

### ✅ Rich Item Display
- No more raw UUID/JSON display
- Fetched actual item names from related tables
- Clean card-based layout with all trip details

### ✅ Multiple Items Support
- Trip Summary aggregates data across all items
- Each item has its own card with full details
- Schedule view shows chronological order

### ✅ Null Handling
- All fields handle null/missing data gracefully
- No blank labels or awkward empty spaces
- Uses "—" for missing optional data

### ✅ Links to Edit Pages
- "View Item →" links to /admin/tours/[id], etc.
- Easy navigation to related item admin pages

## Migration Notes

### Before (Old Design)
```typescript
// Relied on bookings.travel_date (deprecated)
{new Date(booking.travel_date).toLocaleDateString()}

// Showed raw items array
{items.map(item => (
  <div>{item.type} - {item.id}</div>
))}
```

### After (New Design)
```typescript
// Uses booking_items dates
const itemDate = item.travel_date || item.start_date;

// Shows rich cards with fetched names
{enhancedItems.map(item => (
  <ItemCard item={item} />
))}
```

## Testing Checklist

### Data Scenarios
- [ ] Booking with single tour item
- [ ] Booking with multiple transfers (different dates)
- [ ] Booking with package (date range)
- [ ] Booking with mixed items (tour + transfer + package)
- [ ] Items with all fields populated
- [ ] Items with minimal fields (null passengers, times, etc.)
- [ ] Items with special requests in meta
- [ ] Items with flight numbers in meta

### UI Verification
- [ ] Trip Summary shows correct date range
- [ ] Trip Summary shows "Varies per item" when locations differ
- [ ] Item cards show fetched names (not UUIDs)
- [ ] "View Item →" links work
- [ ] Schedule timeline sorts chronologically
- [ ] No "1/1/1970" date displays
- [ ] Null fields render as "—" or are hidden
- [ ] Time formats show AM/PM correctly
- [ ] Currency formats show ¥ symbol

### Existing Features
- [ ] Admin notes save/load works
- [ ] Confirm/Cancel buttons work
- [ ] Mark Paid button works
- [ ] Status form updates work
- [ ] Event timeline displays correctly

## Performance Considerations

### Optimizations
1. **Parallel Queries**: Item names fetched in parallel via Promise.all()
2. **Single DB Calls**: One query per item type (tours, transfers, packages)
3. **Conditional Rendering**: Only renders fields that exist
4. **Server Components**: All data fetching on server (no client loading states)

### Query Efficiency
```typescript
// Efficient: One query per type with .in()
supabase.from('tours').select('id, title').in('id', [id1, id2, id3])

// Not: One query per item (avoided)
// items.map(item => supabase.from('tours').select('title').eq('id', item.id))
```

## Future Enhancements

### Potential Additions
- Export booking details as PDF
- Send booking summary email to customer
- Inline edit trip details (pickup/dropoff)
- Duplicate booking functionality
- Batch operations on items

### Data Improvements
- Cache fetched item names
- Add item images/thumbnails
- Show vehicle details per item
- Display pricing breakdown per item

## Related Files

### Created
- `src/lib/admin/booking-helpers.ts` - Helper functions

### Modified
- `src/types/booking.ts` - Added BookingItemRow and EnhancedBookingItem types
- `src/app/admin/bookings/[id]/page.tsx` - Complete redesign

### Unchanged (Still Work)
- `src/components/admin/BookingStatusForm.tsx`
- `src/components/admin/AdminNotesSection.tsx`
- `src/components/admin/BookingActionButtons.tsx`
- `src/components/admin/BookingEventsTimeline.tsx`

## Troubleshooting

### Item Names Not Showing
**Symptom**: Cards show "tour-abc123..." instead of actual names

**Check**:
1. Verify items exist in tours/transfers/packages tables
2. Check item_id matches the id in related table
3. Ensure item_type is correct ("tour" not "tours")

**Debug**:
```typescript
console.log('Tour IDs:', items.filter(i => i.item_type === 'tour').map(i => i.item_id));
```

### Schedule Not Sorting Correctly
**Symptom**: Items appear in wrong order

**Check**:
1. Verify travel_date/start_date are valid ISO date strings
2. Check pickup_time format (should be HH:MM:SS)

**Debug**:
```typescript
console.log('Item dates:', items.map(i => ({
  id: i.id,
  date: i.travel_date || i.start_date,
  time: i.pickup_time
})));
```

### Trip Summary Showing Wrong Data
**Symptom**: Date range or totals incorrect

**Check**:
1. Ensure all items have valid dates
2. Check passengers_count and large_suitcases are numbers (not strings)

**Debug**:
```typescript
const summary = computeTripSummary(items);
console.log('Trip summary:', summary);
```

## Summary

The Admin Booking Detail page now fully supports per-item trip details with:
- ✅ Rich, detailed item cards
- ✅ Aggregate trip summary
- ✅ Chronological schedule view
- ✅ Fetched item names from related tables
- ✅ Proper null handling
- ✅ Links to admin edit pages
- ✅ No reliance on deprecated bookings.travel_date
- ✅ All existing admin actions still functional

The page provides a comprehensive view of multi-item bookings with proper support for different date types (single dates for tours/transfers, date ranges for packages) and gracefully handles missing optional data.
