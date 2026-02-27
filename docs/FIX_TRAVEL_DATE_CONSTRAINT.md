# Checkout Error Fix: bookings.travel_date NOT NULL Constraint

## Problem

When submitting checkout, the following error occurs:
```
null value in column 'travel_date' of relation 'bookings' violates not-null constraint
```

## Root Cause

1. **Database Schema Issue**: The `public.bookings` table still has a `NOT NULL` constraint on the `travel_date` column.

2. **Code Migration**: We previously migrated travel dates from the bookings table (single date for entire booking) to the `booking_items` table (per-item dates):
   - `booking_items.travel_date` for tours and transfers
   - `booking_items.start_date` and `booking_items.end_date` for packages

3. **Missing Field**: The checkout page (`src/app/(checkout)/checkout/page.tsx`) correctly does NOT include `travel_date` in the `bookingData` object (lines 204-225), because dates are now stored per-item.

4. **Schema Not Updated**: The `bookings` table schema was never updated to reflect this change, causing the insert to fail.

## Solution

### Part 1: Database Migration

**File Created**: `supabase/migrations/20260227_make_bookings_travel_date_nullable.sql`

This migration:
- Makes `bookings.travel_date` nullable (removes `NOT NULL` constraint)
- Adds a deprecation comment explaining the field is legacy
- Adds a `meta` jsonb column for future booking-level metadata

### Part 2: Enhanced Logging

**File Modified**: `src/app/api/bookings/create/route.ts`

Added comprehensive logging:
- Full booking payload before insert (lines 92-93)
- Enhanced error logging with `hint` field (lines 98-107)
- Rejected payload logging on error

This helps debug future schema mismatches.

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended for Quick Fix)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy/paste the contents of:
   ```
   supabase/migrations/20260227_make_bookings_travel_date_nullable.sql
   ```
5. Click **Run**

### Option 2: Supabase CLI (If Installed)

```bash
cd /path/to/tour-webapp
supabase db push
```

### Option 3: Direct psql (If You Have Database URL)

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260227_make_bookings_travel_date_nullable.sql
```

## Files Changed

### 1. Created Migration
- **File**: `supabase/migrations/20260227_make_bookings_travel_date_nullable.sql`
- **Purpose**: Make `bookings.travel_date` nullable and add metadata column

### 2. Enhanced API Logging
- **File**: `src/app/api/bookings/create/route.ts`
- **Changes**:
  - Line 92-93: Log full booking payload before insert
  - Line 98-107: Enhanced error logging with hint and rejected payload

### 3. Checkout Page (No Changes Needed)
- **File**: `src/app/(checkout)/checkout/page.tsx`
- **Status**: Already correct - does NOT send `travel_date` in `bookingData`

## Data Architecture

### Before (Old Design)
```
bookings
  ├── travel_date (NOT NULL) ❌ Single date for entire booking
  └── items (jsonb)          ❌ Unstructured
```

### After (Current Design)
```
bookings
  ├── travel_date (nullable) ✅ Deprecated, kept for compatibility
  └── meta (jsonb)           ✅ Booking-level metadata

booking_items (separate table)
  ├── travel_date            ✅ For tours/transfers
  ├── start_date             ✅ For packages
  ├── end_date               ✅ For packages
  ├── pickup_location        ✅ Per-item
  ├── dropoff_location       ✅ Per-item
  ├── pickup_time            ✅ Per-item
  ├── passengers_count       ✅ Per-item
  ├── large_suitcases        ✅ Per-item
  └── meta (jsonb)           ✅ Per-item metadata
```

## Verification Steps

After applying the migration:

1. **Test Checkout Flow**:
   - Add a tour/transfer to cart
   - Fill in trip details (pickup, dropoff, date, passengers)
   - Complete checkout
   - Verify booking is created successfully

2. **Check Logs** (in browser console and server logs):
   - `[bookings/create] Full booking payload:` should show the data being inserted
   - No `travel_date` field should be in the booking payload (this is correct!)
   - Booking should insert successfully

3. **Verify Database**:
   ```sql
   -- Check bookings table
   SELECT id, reference_code, customer_name, travel_date, created_at 
   FROM public.bookings 
   ORDER BY created_at DESC 
   LIMIT 5;
   
   -- travel_date should be NULL for new bookings
   
   -- Check booking_items table
   SELECT id, booking_id, item_type, travel_date, start_date, end_date, 
          pickup_location, dropoff_location, passengers_count
   FROM public.booking_items 
   ORDER BY created_at DESC 
   LIMIT 10;
   
   -- Each item should have its own dates
   ```

## Why This Approach?

### Why Make travel_date Nullable Instead of Dropping It?

1. **Backward Compatibility**: Existing bookings may have data in this field
2. **Historical Data**: Preserves old booking records
3. **Safer**: Non-destructive migration
4. **Reversible**: Can be dropped later if confirmed unused

### Why Keep booking_items.travel_date NOT NULL?

- Each tour/transfer MUST have a travel date
- This is a business requirement (can't have a tour without knowing when)
- Checkout validation enforces this on the frontend
- Database constraint provides data integrity

## Future Considerations

### Optional: Remove travel_date Entirely (Future Migration)

Once you've confirmed all bookings are working correctly and old data is migrated:

```sql
-- Future migration (after confirming safety)
ALTER TABLE public.bookings 
  DROP COLUMN travel_date;
```

But this is NOT urgent and should only be done after:
- At least 30 days of production use
- Confirming no admin tools rely on this field
- Updating any reports/analytics that query it

## Related Files

- Checkout page: `src/app/(checkout)/checkout/page.tsx`
- Booking API: `src/app/api/bookings/create/route.ts`
- Cart store: `src/lib/cart/store.ts`
- Trip details component: `src/components/checkout/TripDetailsCard.tsx`
- Original migration: `supabase/migrations/20260225_add_trip_details_to_booking_items.sql`
