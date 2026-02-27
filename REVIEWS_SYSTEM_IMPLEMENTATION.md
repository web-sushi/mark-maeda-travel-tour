# Per-Item Reviews System Implementation

## Overview
Complete token-based guest reviews system allowing customers to rate and review each item in their booking after completion.

## Database Tables

### 1. `booking_items`
Stores individual items from each booking for per-item reviews.

**Columns:**
- `id` - UUID primary key
- `booking_id` - References bookings table
- `item_type` - 'tour' | 'transfer' | 'package'
- `item_id` - UUID of the specific item
- `title` - Item title
- `slug` - Item slug
- `vehicle_selection` - JSONB of selected vehicles
- `vehicle_rates` - JSONB of vehicle rates
- `subtotal_amount` - Numeric price for this item
- `created_at` - Timestamp

**RLS:** Admin-only access (service role bypasses)

### 2. `review_requests`
Token-based review invitations (one per booking).

**Columns:**
- `id` - UUID primary key
- `booking_id` - References bookings table
- `token` - Unique 32-character token
- `expires_at` - Expiry date (30 days from creation)
- `used_at` - Timestamp when review submitted (null = unused)
- `created_at` - Timestamp

**RLS:** Admin-only access

### 3. `reviews`
Customer reviews for booking items.

**Columns:**
- `id` - UUID primary key
- `booking_item_id` - References booking_items table
- `booking_id` - References bookings table
- `rating` - Integer 1-5
- `comment` - Text (optional)
- `display_name` - String (optional, defaults to "Anonymous")
- `approved` - Boolean (default false, requires admin approval)
- `featured` - Boolean (default false, can only be true if approved)
- `created_at` - Timestamp

**RLS:** Admin-only access

## Flow

### A) Checkout - Write booking_items

**File:** `/src/app/(checkout)/checkout/page.tsx`

After successful booking insert:
```typescript
const bookingItems = cartItems.map((item) => ({
  booking_id: insertedBooking.id,
  item_type: item.type,
  item_id: item.id,
  title: item.title,
  slug: item.slug,
  vehicle_selection: item.vehicleSelection,
  vehicle_rates: item.vehicleRates,
  subtotal_amount: getItemSubtotal(item),
}));

await supabase.from("booking_items").insert(bookingItems);
```

### B) Review Request on "Mark as Completed"

**File:** `/src/components/admin/BookingActionButtons.tsx`

When admin marks booking as completed, triggers:
```typescript
POST /api/review/request
Body: { bookingId }
```

**API Route:** `/src/app/api/review/request/route.ts`

**Logic:**
1. Check idempotency (has `email_sent_review_request` event)
2. Fetch booking and booking_items
3. Create or reuse review_requests token (30-day expiry)
4. Send email via Brevo with review link
5. Insert booking_event for idempotency

**Email Template:** `reviewRequestCustomer()` in `/src/lib/email/templates.ts`

**Review Link:** `${NEXT_PUBLIC_SITE_URL}/review?token=${token}`

### C) Public Review Page

**File:** `/src/app/review/page.tsx` (wrapped in Suspense)
**Content:** `/src/app/review/ReviewPageContent.tsx`

**Flow:**
1. Extract token from URL params
2. Call `POST /api/review/validate` to load booking data
3. Display form with:
   - Each item shows title, type, star rating (1-5), optional comment
   - Overall feedback section (display name + comment)
4. Submit to `POST /api/review/submit`

### D) API Routes

#### `/api/review/validate` (POST)
**Input:** `{ token }`

**Output:**
```typescript
{
  ok: boolean,
  booking?: {
    id, reference_code, customer_name, travel_date
  },
  items?: Array<{
    id, title, item_type, item_id, slug
  }>,
  error?: string
}
```

**Validation:**
- Token exists
- Not used (`used_at === null`)
- Not expired (`expires_at > now()`)

#### `/api/review/submit` (POST)
**Input:**
```typescript
{
  token: string,
  displayName?: string,
  overallComment?: string,
  itemReviews: Array<{
    bookingItemId: string,
    rating: number (1-5),
    comment?: string
  }>
}
```

**Logic:**
1. Validate token (unused, not expired)
2. Verify all bookingItemIds belong to the booking
3. Insert one review per item with `approved: false`
4. Mark token as used (`used_at = now()`)
5. Create `review_submitted` booking_event

### E) Admin Moderation

**Page:** `/src/app/admin/reviews/page.tsx`
**Component:** `/src/components/admin/ReviewsTableClient.tsx`

**Features:**
- Filter tabs: All / Pending / Approved / Featured
- Table columns: Item, Type, Rating (stars), Comment, By, Booking, Status, Actions
- Actions:
  - **Approve/Unapprove:** Toggle `approved` flag (unapproving also unfeatures)
  - **Feature/Unfeature:** Toggle `featured` flag (only if approved)

**Joins:**
```sql
reviews
  JOIN booking_items (title, item_type)
  JOIN bookings (reference_code)
```

### F) Homepage Testimonials

**File:** `/src/app/(marketing)/page.tsx`

**Query:**
```typescript
const { data: featuredReviews } = await supabase
  .from("reviews")
  .select(`*, booking_items!inner (title, item_type)`)
  .eq("approved", true)
  .eq("featured", true)
  .order("created_at", { ascending: false })
  .limit(6);
```

**Display:**
- Show up to 3 featured reviews
- Stars, comment excerpt, display name, item title
- Fallback to placeholder if no featured reviews

## Files Created/Modified

### Created:
1. `/src/types/review.ts` - TypeScript types
2. `/src/app/api/review/request/route.ts` - Request review email
3. `/src/app/api/review/validate/route.ts` - Validate token
4. `/src/app/api/review/submit/route.ts` - Submit reviews
5. `/src/app/review/page.tsx` - Wrapper with Suspense
6. `/src/app/review/ReviewPageContent.tsx` - Main review form
7. `/src/app/admin/reviews/page.tsx` - Admin reviews page
8. `/src/components/admin/ReviewsTableClient.tsx` - Reviews table
9. `/docs/sql/008_reviews_system.sql` - Database migration

### Modified:
1. `/src/app/(checkout)/checkout/page.tsx` - Insert booking_items
2. `/src/components/admin/BookingActionButtons.tsx` - Trigger review request
3. `/src/lib/email/templates.ts` - Add reviewRequestCustomer()
4. `/src/app/(marketing)/page.tsx` - Fetch and display featured reviews

## Security

- All tables use admin-only RLS policies
- Public cannot read/write directly
- All operations use service role key
- Token validation prevents unauthorized access
- Token is single-use (marked used after submission)
- Token has 30-day expiry
- Reviews require admin approval before display
- Featured reviews must be approved first

## Usage

### For Admins:

**1. After completing a booking:**
- Click "Mark as Completed" in admin booking details
- System automatically sends review request email

**2. Moderate reviews:**
- Go to `/admin/reviews`
- Review pending submissions
- Click "Approve" to make visible
- Click "Feature" to show on homepage

### For Customers:

1. Receive email after booking completion
2. Click "Leave Your Review" button
3. Rate each item (1-5 stars)
4. Add optional comments
5. Submit (link becomes single-use)

## Email Template

**Subject:** "Share Your Experience - {reference_code}"

**Content:**
- Purple header with "How Was Your Experience?"
- Booking reference and travel date
- List of items in booking
- Large "Leave Your Review" button
- Note about 30-day expiry

## Testing Checklist

### Build:
- ✅ TypeScript compiles
- ✅ All routes generated
- ✅ No import errors

### Checkout:
- [ ] booking_items inserted for each cart item
- [ ] Subtotals calculated correctly

### Review Request:
- [ ] Email sent after "Mark as Completed"
- [ ] Idempotency works (no duplicate emails)
- [ ] Token created or reused
- [ ] booking_event recorded

### Public Review:
- [ ] Valid token loads booking data
- [ ] Invalid token shows error
- [ ] Expired token shows error
- [ ] Used token shows error
- [ ] All items display correctly
- [ ] Star ratings work
- [ ] Form validation works
- [ ] Submit succeeds

### Admin:
- [ ] Reviews table loads
- [ ] Filter tabs work
- [ ] Approve toggle works
- [ ] Feature toggle disabled for unapproved
- [ ] Unapproving removes featured flag

### Homepage:
- [ ] Featured reviews display
- [ ] Shows up to 3 reviews
- [ ] Falls back if no reviews
- [ ] Stars render correctly

## Notes

- No new dependencies added
- Uses existing Brevo email system
- Uses existing Supabase SSR setup
- Public pages are token-protected
- Admin actions require authentication
- Review submission is guest-friendly (no login required)

## SQL Migration

Run `/docs/sql/008_reviews_system.sql` to create tables and RLS policies.

Includes:
- Table creation with constraints
- Indexes for performance
- RLS policies (admin-only)
- Comments for documentation
