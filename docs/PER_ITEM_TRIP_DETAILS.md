# Per-Item Trip Details - Checkout Implementation

**Date:** Feb 25, 2026  
**Status:** ✅ Complete

---

## Overview

Implemented per-item trip details collection at checkout, allowing each cart item (tour/transfer/package) to have its own pickup/dropoff locations, dates, and optional metadata.

---

## Key Changes

### 1. Database Schema

**Migration:** `supabase/migrations/20260225_add_trip_details_to_booking_items.sql`

Added columns to `booking_items` table:
- `pickup_location` (text, NOT NULL, default '')
- `dropoff_location` (text, NOT NULL, default '')
- `travel_date` (date, nullable) - For tours/transfers
- `start_date` (date, nullable) - For packages
- `end_date` (date, nullable) - For packages
- `pickup_time` (time, nullable) - Optional, mainly for transfers
- `meta` (jsonb, nullable) - For flight_number, special_requests, etc.

### 2. Cart Store Updates

**File:** `src/lib/cart/store.ts`

**New Interfaces:**
```typescript
interface TripDetails {
  pickupLocation?: string;
  dropoffLocation?: string;
  travelDate?: string; // For tours/transfers
  startDate?: string; // For packages
  endDate?: string; // For packages
  pickupTime?: string;
  flightNumber?: string;
  specialRequests?: string;
}

interface CartItem {
  // ... existing fields
  tripDetails?: TripDetails;
}
```

**New Function:**
```typescript
function updateItemTripDetails(
  type, 
  id, 
  tripDetails: TripDetails
): void
```

### 3. New Component: TripDetailsCard

**File:** `src/components/checkout/TripDetailsCard.tsx`

**Purpose:** Per-item form for collecting trip details

**Features:**
- Item header with icon and title
- Required fields:
  - Pickup Location (all items)
  - Dropoff Location (all items)
  - Travel Date (tours/transfers)
  - Start/End Date (packages)
- Optional fields:
  - Pickup Time (transfers)
  - Flight Number (transfers)
  - Special Requests (all items)
- Error display per field
- Visual error state (red border/background)

### 4. Checkout Page Redesign

**File:** `src/app/(checkout)/checkout/page.tsx`

**Major Changes:**
- Removed global trip details form
- Added Trip Details section with cards for each cart item
- Validation for each item's required fields
- Error tracking per item
- Scroll to top on validation failure
- Updated API payload to include tripDetails per item

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Checkout                                    │
├─────────────────────────────────────────────┤
│ [Error Banner if any]                       │
│                                             │
│ Trip Details                                │
│ ┌─────────────────────────────────────────┐ │
│ │ 🗺️ Tokyo Private Tour                   │ │
│ │ Pickup Location [_________]             │ │
│ │ Dropoff Location [_________]            │ │
│ │ Travel Date [_________]                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🚐 Narita Airport Transfer              │ │
│ │ Pickup Location [_________]             │ │
│ │ Dropoff Location [_________]            │ │
│ │ Travel Date [_________]                 │ │
│ │ Pickup Time [_________] (optional)      │ │
│ │ Flight Number [_________] (optional)    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Customer Information                        │
│ Name [_________]                            │
│ Email [_________]                           │
│ Phone [_________]                           │
│                                             │
│ [Continue to Payment]                       │
└─────────────────────────────────────────────┘
```

### 5. API Updates

**File:** `src/app/api/bookings/create/route.ts`

**Changes:**
- Removed `travel_date` and `passengers_count` from required booking fields
- Updated `booking_items` insert to include trip details:
  ```typescript
  {
    booking_id,
    item_type,
    item_id,
    // ... existing fields
    pickup_location,
    dropoff_location,
    travel_date, // for tours/transfers
    start_date, // for packages
    end_date, // for packages
    pickup_time,
    meta: { flight_number, special_requests }
  }
  ```

---

## Validation Rules

### All Item Types
✅ **Required:**
- Pickup Location
- Dropoff Location

### Tours & Transfers
✅ **Required:**
- Travel Date

### Packages
✅ **Required:**
- Start Date
- End Date

### Transfers (Optional)
- Pickup Time
- Flight Number

---

## User Flow

### 1. Add Items to Cart
User adds tours/transfers/packages with vehicle selection (existing flow)

### 2. Navigate to Checkout
Cart has items without trip details

### 3. Fill Trip Details
For each item:
- Enter pickup location
- Enter dropoff location
- Enter date(s) based on item type
- Optionally add pickup time / flight number

### 4. Enter Customer Info
- Name
- Email  
- Phone (optional)

### 5. Select Payment Option
- 25% deposit
- 50% deposit
- 100% full payment

### 6. Submit
- Validation runs
- If any item missing details → Error banner + red card borders
- If valid → Create booking → Redirect to Stripe

---

## Validation Examples

### Example 1: Missing Pickup Location

**State:**
```typescript
{
  pickupLocation: '',
  dropoffLocation: 'Tokyo Station',
  travelDate: '2026-03-15'
}
```

**Error:**
```typescript
itemErrors['tour-abc123'] = {
  pickupLocation: 'Pickup location is required'
}
```

**UI:** Red border on card, error message under input

### Example 2: Missing Date for Transfer

**State:**
```typescript
{
  pickupLocation: 'Narita Airport',
  dropoffLocation: 'Shinjuku',
  travelDate: '' // Missing!
}
```

**Error:**
```typescript
itemErrors['transfer-def456'] = {
  travelDate: 'Travel date is required'
}
```

### Example 3: Package Missing End Date

**State:**
```typescript
{
  pickupLocation: 'Tokyo',
  dropoffLocation: 'Tokyo',
  startDate: '2026-03-15',
  endDate: '' // Missing!
}
```

**Error:**
```typescript
itemErrors['package-ghi789'] = {
  endDate: 'End date is required'
}
```

---

## Database Examples

### Tour Booking Item
```sql
INSERT INTO booking_items (
  booking_id, item_type, item_id,
  title, slug,
  pickup_location, dropoff_location,
  travel_date,
  vehicle_selection, vehicle_rates,
  subtotal_amount
) VALUES (
  'booking-uuid',
  'tour',
  'tour-uuid',
  'Tokyo Private Tour',
  'tokyo-private-tour',
  'Shinjuku Station',
  'Shibuya',
  '2026-03-15',
  '{"v8": 1}',
  '{"v8": 50000}',
  50000
);
```

### Transfer Booking Item
```sql
INSERT INTO booking_items (
  booking_id, item_type, item_id,
  title, slug,
  pickup_location, dropoff_location,
  travel_date, pickup_time,
  meta,
  vehicle_selection, vehicle_rates,
  subtotal_amount
) VALUES (
  'booking-uuid',
  'transfer',
  'transfer-uuid',
  'Narita Airport Transfer',
  'narita-airport-transfer',
  'Narita Airport Terminal 1',
  'Tokyo Station',
  '2026-03-15',
  '10:30',
  '{"flight_number": "NH123"}',
  '{"v10": 1}',
  '{"v10": 35000}',
  35000
);
```

### Package Booking Item
```sql
INSERT INTO booking_items (
  booking_id, item_type, item_id,
  title, slug,
  pickup_location, dropoff_location,
  start_date, end_date,
  vehicle_selection, vehicle_rates,
  subtotal_amount
) VALUES (
  'booking-uuid',
  'package',
  'package-uuid',
  '3-Day Tokyo Package',
  '3-day-tokyo-package',
  'Narita Airport',
  'Narita Airport',
  '2026-03-15',
  '2026-03-17',
  '{"v8": 1}',
  '{"v8": 150000}',
  150000
);
```

---

## Files Created

1. **`supabase/migrations/20260225_add_trip_details_to_booking_items.sql`**
   - Adds trip details columns to booking_items table
   - 29 lines

2. **`src/components/checkout/TripDetailsCard.tsx`**
   - Per-item trip details form component
   - 159 lines

---

## Files Modified

1. **`src/lib/cart/store.ts`**
   - Added TripDetails interface
   - Added tripDetails to CartItem
   - Added updateItemTripDetails function
   - 97 lines (was 72)

2. **`src/app/(checkout)/checkout/page.tsx`**
   - Complete redesign with per-item trip details
   - Added validation per item
   - Removed global trip fields
   - 476 lines (was 569)

3. **`src/app/api/bookings/create/route.ts`**
   - Updated validation (removed travel_date requirement)
   - Added trip details to booking_items insert
   - 177 lines (was 159)

---

## Testing Checklist

### Functional Testing

- [ ] Add tour to cart → Navigate to checkout
- [ ] Fill trip details for tour (pickup, dropoff, date)
- [ ] Submit without filling details → See error
- [ ] Fill all required fields → Submit succeeds
- [ ] Add transfer to cart → See pickup time and flight number fields
- [ ] Fill transfer details → Submit succeeds
- [ ] Add package to cart → See start/end date fields
- [ ] Fill package details → Submit succeeds
- [ ] Add multiple items → See separate card for each
- [ ] Fill details for all items → Submit succeeds
- [ ] Leave one item incomplete → See error for that item only
- [ ] View booking in admin → See trip details saved

### Validation Testing

- [ ] Submit with empty pickup → Error shown
- [ ] Submit with empty dropoff → Error shown
- [ ] Submit tour without date → Error shown
- [ ] Submit package without start date → Error shown
- [ ] Submit package without end date → Error shown
- [ ] Fill all required fields → No errors

### Edge Cases

- [ ] Very long pickup location (100+ chars)
- [ ] Special characters in locations
- [ ] Past dates (should warn user)
- [ ] End date before start date (packages)
- [ ] Multiple items with different date requirements
- [ ] Optional fields left empty (should work)

### Database Testing

- [ ] Check booking_items after successful checkout
- [ ] Verify pickup_location saved correctly
- [ ] Verify dropoff_location saved correctly
- [ ] Verify travel_date for tours/transfers
- [ ] Verify start_date/end_date for packages
- [ ] Verify pickup_time if provided
- [ ] Verify meta.flight_number if provided
- [ ] Verify meta.special_requests if provided

---

## Migration Instructions

### Running the Migration

```bash
# Apply migration to Supabase
psql $DATABASE_URL -f supabase/migrations/20260225_add_trip_details_to_booking_items.sql
```

Or via Supabase dashboard:
1. Go to SQL Editor
2. Paste migration contents
3. Run query

### Verification

```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'booking_items'
  AND column_name IN ('pickup_location', 'dropoff_location', 'travel_date', 'start_date', 'end_date', 'pickup_time', 'meta');

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'booking_items'
  AND indexname LIKE '%date%';
```

---

## Backwards Compatibility

### Existing Carts

Existing carts in localStorage without `tripDetails`:
- ✅ Will load correctly
- ✅ User will be prompted to fill trip details at checkout
- ✅ No data loss

### Existing Bookings

Existing `booking_items` rows without trip details:
- ✅ Migration adds columns with defaults
- ✅ Old bookings remain queryable
- ✅ No breaking changes

---

## Benefits

### For Users

✅ **Clear per-item details** - Each tour/transfer/package has its own trip info  
✅ **Flexible dates** - Different items can have different dates  
✅ **Better context** - Know exactly what details are for which item  
✅ **Optional fields** - Only fill flight number if needed  

### For Business

✅ **Accurate data** - Trip details per item, not per booking  
✅ **Better organization** - Easier to manage multi-item bookings  
✅ **Review system** - Can track which item had which experience  
✅ **Analytics** - Can analyze pickup/dropoff patterns per item type  

---

## Future Enhancements

### 1. Smart Defaults

```typescript
// If same day, auto-fill subsequent items with previous location
if (items[0].tripDetails.travelDate === items[1].tripDetails.travelDate) {
  items[1].tripDetails.pickupLocation = items[0].tripDetails.dropoffLocation;
}
```

### 2. Date Range Validation

```typescript
// Warn if dates are too far apart or in the past
if (travelDate < today) {
  setWarning('Travel date is in the past');
}
```

### 3. Location Autocomplete

```typescript
// Integrate Google Places API
<Autocomplete
  onPlaceSelected={(place) => {
    setPickupLocation(place.formatted_address);
  }}
/>
```

### 4. Bulk Fill for Packages

```typescript
// Checkbox: "Use same details for all items"
<Checkbox
  label="Use same pickup/dropoff for all days"
  onChange={(checked) => applyToAllItems(tripDetails)}
/>
```

---

## Summary

### What Changed

✅ Database schema extended with trip details columns  
✅ Cart store includes trip details per item  
✅ New TripDetailsCard component for per-item forms  
✅ Checkout page redesigned with validation  
✅ API updated to store trip details in booking_items  

### Files Created

- Migration file
- TripDetailsCard component

### Files Modified

- Cart store
- Checkout page
- Booking creation API

### Status

- ✅ Implementation complete
- ✅ No linter errors
- ✅ Ready for testing

---

**Last Updated:** Feb 25, 2026  
**Version:** 1.0
