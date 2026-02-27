# Review Submit API Fix

## Problem
`POST /api/review/submit` was failing due to incorrect column names and insufficient error logging.

## Root Cause
The insert statement was using `approved` and `featured` instead of the correct column names `is_approved` and `is_featured`.

## Changes Made

### 1. Fixed Column Names (Lines 105-113)
**Before:**
```typescript
const reviewsToInsert = itemReviews.map((review) => ({
  booking_item_id: review.bookingItemId,
  booking_id: reviewRequest.booking_id,
  rating: review.rating,
  comment: review.comment || null,
  display_name: displayName || null,
  approved: false,  // ❌ Wrong column name
  featured: false,  // ❌ Wrong column name
}));
```

**After:**
```typescript
const reviewsToInsert = itemReviews.map((review) => ({
  booking_item_id: review.bookingItemId,
  booking_id: reviewRequest.booking_id,
  rating: review.rating,
  comment: review.comment || "",  // ✅ Empty string instead of null
  display_name: displayName || "",
  is_approved: false,  // ✅ Correct column name
  is_featured: false,  // ✅ Correct column name
}));
```

### 2. Enhanced Error Logging

Added detailed console logs for all error scenarios:

#### Token Validation
```typescript
console.error("[review/submit] Token validation failed:", {
  token,
  error: tokenError?.message,
  code: tokenError?.code,
  details: tokenError?.details,
});
```

#### Token Already Used
```typescript
console.error("[review/submit] Token already used:", {
  token,
  used_at: reviewRequest.used_at,
});
```

#### Token Expired
```typescript
console.error("[review/submit] Token expired:", {
  token,
  expires_at: reviewRequest.expires_at,
  now: now.toISOString(),
});
```

#### Booking Items Not Found
```typescript
console.error("[review/submit] Failed to fetch booking items:", {
  booking_id: reviewRequest.booking_id,
  error: itemsError?.message,
  code: itemsError?.code,
  details: itemsError?.details,
});
```

#### Invalid Booking Item ID
```typescript
console.error("[review/submit] Invalid booking item ID:", {
  submitted_id: review.bookingItemId,
  valid_ids: Array.from(validItemIds),
});
```

#### Insert Reviews Failed
```typescript
console.error("[review/submit] Failed to insert reviews:", {
  error: reviewsError.message,
  code: reviewsError.code,
  details: reviewsError.details,
  hint: reviewsError.hint,
  reviewsData: reviewsToInsert,
});
```

### 3. Added Debug Fields to Error Responses

All error responses now include a `debug` field with the actual error message:

```typescript
return NextResponse.json(
  {
    ok: false,
    error: "Failed to submit reviews",
    debug: reviewsError.message,  // ✅ Includes actual error
  },
  { status: 500 }
);
```

### 4. Added Success Logging

```typescript
console.log("[review/submit] Reviews inserted successfully");
console.log("[review/submit] Token marked as used");
console.log("[review/submit] Booking event created");
console.log("[review/submit] Review submission complete for booking:", reviewRequest.booking_id);
```

### 5. Improved Error Handling

- Token update errors and booking event errors no longer fail the request (reviews are already saved)
- All errors include structured data for debugging
- HTTP status codes are properly set (400 for validation, 404 for not found, 500 for server errors)

## Correct Column Mapping

### public.reviews Table
```sql
- id (auto)
- booking_id (uuid, FK)
- booking_item_id (uuid, FK)
- rating (int, 1-5)
- comment (text, empty string if not provided)
- display_name (text, empty string if not provided)
- is_approved (boolean, default false)
- is_featured (boolean, default false)
- created_at (timestamp, auto)
```

### Review Insert Data Structure
```typescript
{
  booking_item_id: uuid,
  booking_id: uuid,
  rating: 1-5,
  comment: "" | "text",
  display_name: "" | "Name",
  is_approved: false,
  is_featured: false
}
```

## Token Validation Flow

1. ✅ Token exists in `review_requests`
2. ✅ `used_at IS NULL` (not already used)
3. ✅ `expires_at > NOW()` (not expired)
4. ✅ All booking item IDs belong to the booking
5. ✅ Insert reviews into `public.reviews`
6. ✅ Update `review_requests.used_at = NOW()`
7. ✅ Insert `booking_events` record (`review_submitted`)

## Testing Checklist

- [ ] Valid token submits reviews successfully
- [ ] Invalid token returns 400 with debug info
- [ ] Expired token returns 400 with debug info
- [ ] Used token returns 400 with debug info
- [ ] Invalid booking item ID returns 400 with debug info
- [ ] Reviews appear in database with correct column values
- [ ] `is_approved = false` by default
- [ ] `is_featured = false` by default
- [ ] Token marked as used after submission
- [ ] Booking event created with correct payload
- [ ] Empty comments stored as "" not null
- [ ] Display name stored as "" if not provided
- [ ] Server logs show detailed error information

## Build Status
✅ Compiles successfully with no TypeScript errors
