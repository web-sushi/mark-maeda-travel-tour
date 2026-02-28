# Email Templates Update - Per-Item Booking Details

## Summary

Updated all email templates to render booking details per `booking_item` instead of relying on a single `booking.travel_date`. This prevents rendering issues like "1/1/1970" and provides accurate, item-specific details in all booking and payment notification emails.

---

## Changes Made

### 1. Updated Email Template Helper Functions (`src/lib/email/templates.ts`)

#### New Helper Functions

**`formatDate(dateString?: string | null): string`**
- Now safely handles `null`, `undefined`, and invalid dates
- Returns `"TBD"` for any invalid date instead of throwing errors
- Prevents the Jan 1, 1970 epoch date issue

**`formatDateRange(items: BookingItemRow[]): string`**
- Computes date range from multiple booking items
- Uses `MIN(travel_date/start_date)` and `MAX(travel_date/start_date)`
- Returns single date if all items have same date
- Returns `"TBD"` if no valid dates found

**`getItemTypeBadge(type: string): string`**
- Returns formatted badge text: `"TOUR"`, `"TRANSFER"`, `"PACKAGE"`

**`getItemLocationLine(item: BookingItemRow): string`**
- For transfers: `"Pickup → Dropoff"`
- For tours: `"From → To"` (if available in meta)
- Fallback: `"Locations: See details"`

---

### 2. Updated Email Template Function Signatures

All email templates now accept `items: BookingItemRow[]` parameter:

#### Before:
```typescript
bookingReceivedCustomer(booking: Booking)
bookingReceivedAdmin(booking: Booking)
paymentReceivedCustomer(booking: Booking, paidAmount: number, remainingAmount: number)
paymentPendingCustomer(booking: Booking, paymentAmount: number, paymentType: string)
paymentPendingAdmin(booking: Booking, paymentAmount: number, paymentType: string)
paymentFailedCustomer(booking: Booking, paymentAmount: number, paymentType: string)
paymentFailedAdmin(booking: Booking, paymentAmount: number, paymentType: string)
```

#### After:
```typescript
bookingReceivedCustomer(booking: Booking, items: BookingItemRow[])
bookingReceivedAdmin(booking: Booking, items: BookingItemRow[])
paymentReceivedCustomer(booking: Booking, items: BookingItemRow[], paidAmount: number, remainingAmount: number)
paymentPendingCustomer(booking: Booking, items: BookingItemRow[], paymentAmount: number, paymentType: string)
paymentPendingAdmin(booking: Booking, items: BookingItemRow[], paymentAmount: number, paymentType: string)
paymentFailedCustomer(booking: Booking, items: BookingItemRow[], paymentAmount: number, paymentType: string)
paymentFailedAdmin(booking: Booking, items: BookingItemRow[], paymentAmount: number, paymentType: string)
```

---

### 3. Email Template Content Changes

#### Customer Booking Received Email

**Changed:**
- ❌ `Travel Date: {single booking.travel_date}`
- ✅ `Travel Date(s): {MIN - MAX from all items or single date}`

**Added:**
- **Booking Items Section** with per-item cards showing:
  - Item type badge (TOUR/TRANSFER/PACKAGE)
  - Item title
  - Date (travel_date or start_date - end_date)
  - Location line (pickup → dropoff or from → to)
  - Passengers count
  - Large suitcases count
  - Subtotal amount

**Example HTML Card:**
```html
<div style="margin: 15px 0; padding: 15px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #2563eb;">
  <div style="display: flex; align-items: center; margin-bottom: 8px;">
    <span style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 8px;">
      TRANSFER
    </span>
    <strong style="color: #111827;">Narita Airport → Tokyo Shinjuku</strong>
  </div>
  <p style="margin: 5px 0; font-size: 14px; color: #4b5563;">
    <strong>Date:</strong> March 15, 2026
  </p>
  <p style="margin: 5px 0; font-size: 14px; color: #4b5563;">
    <strong>Location:</strong> Narita Terminal 1 → Shinjuku Station
  </p>
  <p style="margin: 5px 0; font-size: 14px; color: #4b5563;"><strong>Passengers:</strong> 2</p>
  <p style="margin: 5px 0; font-size: 14px; color: #4b5563;"><strong>Large Suitcases:</strong> 4</p>
  <p style="margin: 5px 0; font-size: 14px; color: #2563eb;"><strong>Subtotal:</strong> ¥25,000</p>
</div>
```

#### Admin Booking Received Email

**Changed:**
- ❌ `Date: {single booking.travel_date}`
- ❌ `Pickup: {booking.pickup_location}`
- ❌ `Dropoff: {booking.dropoff_location}`
- ❌ `Passengers: {booking.passengers_count}`
- ❌ `Large Suitcases: {booking.large_suitcases}`

**Replaced with:**
- ✅ `Date(s): {date range from all items}`
- ✅ **Booking Items Section** (compact cards)

#### Payment Received Customer Email

**Changed:**
- ❌ `Travel Date: {single booking.travel_date}`
- ✅ `Travel Date(s): {date range}`

**Added:**
- **Booking Items Section** (compact cards with green accent)

#### Payment Pending Customer Email

**Changed:**
- ❌ `Travel Date: {single booking.travel_date}`
- ✅ `Travel Date(s): {date range}`

**Added:**
- **Booking Items Section** (compact cards with amber accent)

#### Payment Pending Admin Email

**Changed:**
- ❌ `Date: {booking.travel_date}`
- ❌ `Pickup/Dropoff from booking level`
- ✅ `Date(s): {date range}`

**Added:**
- **Booking Items Section** (compact cards)

#### Payment Failed Customer Email

**Changed:**
- ❌ `Travel Date: {single booking.travel_date}`
- ✅ `Travel Date(s): {date range}`

#### Payment Failed Admin Email

**Changed:**
- ❌ `Date: {booking.travel_date}`
- ❌ `Pickup/Dropoff from booking level`
- ✅ `Date(s): {date range}`

**Added:**
- **Booking Items Section** (compact cards)

---

## 4. Updated Email Sender Logic

### `/api/notify/booking-created` Route

**Added booking_items fetch:**

```typescript
// Fetch booking_items for the booking
console.log("[booking-created] Fetching booking_items...");

const { data: bookingItems, error: itemsError } = await supabaseAdmin
  .from("booking_items")
  .select("*")
  .eq("booking_id", bookingId)
  .order("created_at", { ascending: true });

if (itemsError) {
  console.error("[booking-created] Error fetching booking_items:", itemsError);
  // Continue without items rather than failing completely
}

const items = bookingItems || [];
console.log("[booking-created] Booking items found:", items.length);
```

**Updated template calls:**

```typescript
// Customer email
const customerTemplate = bookingReceivedCustomer(booking as Booking, items);

// Admin email
const adminTemplate = bookingReceivedAdmin(booking as Booking, items);
```

### Stripe Webhook Handler (`/api/stripe/webhook`)

#### `processPayment()` Function

**Added booking_items fetch before sending payment received email:**

```typescript
if (!emailSentEvent) {
  // Fetch booking_items
  const { data: bookingItems } = await supabase
    .from("booking_items")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  const items = bookingItems || [];

  const { sendBrevoEmail } = await import("@/lib/email/brevo");
  const { paymentReceivedCustomer } = await import("@/lib/email/templates");

  const { subject, html, text } = paymentReceivedCustomer(
    booking,
    items,        // NEW
    paidAmount,
    newRemainingAmount
  );
  
  // ... send email
}
```

#### `handleCheckoutCompleted()` Function

**Added booking_items fetch for pending payment emails:**

```typescript
if (booking) {
  const paymentAmount = session.amount_total || 0;
  const paymentMethodType = session.payment_method_types?.[0] || "delayed";
  
  // Fetch booking_items
  const { data: bookingItems } = await supabase
    .from("booking_items")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  const items = bookingItems || [];

  // Send pending payment emails
  const customerEmail = paymentPendingCustomer(booking, items, paymentAmount, paymentMethodType);
  const adminEmail = paymentPendingAdmin(booking, items, paymentAmount, paymentMethodType);
  // ...
}
```

#### `handleAsyncPaymentFailed()` Function

**Added booking_items fetch for failed payment emails:**

```typescript
// Fetch booking_items
const { data: bookingItems } = await supabase
  .from("booking_items")
  .select("*")
  .eq("booking_id", bookingId)
  .order("created_at", { ascending: true });

const items = bookingItems || [];

// Send payment failed emails
const customerEmail = paymentFailedCustomer(booking, items, paymentAmount, paymentMethodType);
const adminEmail = paymentFailedAdmin(booking, items, paymentAmount, paymentMethodType);
// ...
```

---

## 5. Example Email Output

### Sample Customer Booking Received Email

```
┌─────────────────────────────────────────────┐
│          Booking Received                   │ (Gray header)
├─────────────────────────────────────────────┤
│                                             │
│ Dear John Doe,                              │
│                                             │
│ Thank you for your booking! We've received  │
│ your request and are processing payment.    │
│                                             │
│ Reference Code: MB-2026-001                 │
│ Travel Date(s): March 15 - March 18, 2026  │ <- Date range
│                                             │
│ ┌─ Booking Items ────────────────────────┐ │
│ │                                         │ │
│ │ ┌─[TRANSFER] Narita → Tokyo ─────────┐ │ │
│ │ │ Date: March 15, 2026                │ │ │
│ │ │ Location: Terminal 1 → Shinjuku     │ │ │
│ │ │ Passengers: 2                       │ │ │
│ │ │ Large Suitcases: 4                  │ │ │
│ │ │ Subtotal: ¥25,000                   │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ │                                         │ │
│ │ ┌─[TOUR] Kyoto Day Tour ─────────────┐ │ │
│ │ │ Date: March 16, 2026                │ │ │
│ │ │ Location: Kyoto → Nara              │ │ │
│ │ │ Passengers: 2                       │ │ │
│ │ │ Subtotal: ¥45,000                   │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ │                                         │ │
│ │ ┌─[TRANSFER] Tokyo → Osaka ──────────┐ │ │
│ │ │ Date: March 18, 2026                │ │ │
│ │ │ Location: Shinjuku → Osaka Station  │ │ │
│ │ │ Passengers: 2                       │ │ │
│ │ │ Large Suitcases: 4                  │ │ │
│ │ │ Subtotal: ¥30,000                   │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Payment Details:                            │
│ Total Amount: ¥100,000                      │
│ Selected Payment: 50% (Deposit)             │
│ Amount Due Now: ¥50,000                     │
│ Remaining After Payment: ¥50,000            │
│                                             │
│ [Track your booking →]                      │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 6. Date Handling Improvements

### Before (Problem):
```typescript
formatDate(booking.travel_date)
// If booking.travel_date is null → new Date(null) → Jan 1, 1970
```

### After (Solution):
```typescript
formatDate(item.travel_date || item.start_date)
// Returns "TBD" if date is null/undefined/invalid
```

### Date Range Logic:
```typescript
function formatDateRange(items: BookingItemRow[]): string {
  const dates = items
    .map((item) => item.travel_date || item.start_date)
    .filter((date): date is string => !!date)  // Filter out nulls
    .map((date) => new Date(date))
    .filter((date) => !isNaN(date.getTime())); // Filter invalid dates

  if (dates.length === 0) return "TBD";

  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  const minFormatted = formatDate(minDate.toISOString());
  const maxFormatted = formatDate(maxDate.toISOString());

  if (minFormatted === maxFormatted) {
    return minFormatted;  // Single date
  }
  return `${minFormatted} - ${maxFormatted}`;  // Date range
}
```

---

## 7. Mobile-Friendly Layout

All email templates are optimized for mobile:

- **Max width:** 600px
- **Responsive padding:** 20px on desktop, adaptive on mobile
- **Stacked item cards:** Each item in its own card for easy reading
- **Color-coded badges:** Visual distinction between TOUR/TRANSFER/PACKAGE
- **Readable font sizes:** 13-14px for details, larger for headings
- **Touch-friendly buttons:** Large CTA buttons with proper padding

---

## 8. Database Schema (No Changes Required)

All required fields already exist:

### `booking_items` Table
```sql
- id (uuid)
- booking_id (uuid, FK to bookings)
- item_type (text: 'tour' | 'transfer' | 'package')
- item_id (uuid)
- title (text, nullable)
- travel_date (date, nullable)
- start_date (date, nullable)
- end_date (date, nullable)
- pickup_location (text, nullable)
- dropoff_location (text, nullable)
- passengers_count (int4, nullable)
- large_suitcases (int4, nullable)
- subtotal_amount (int4, nullable)
- meta (jsonb, nullable)
- created_at (timestamptz)
```

---

## 9. Files Changed

### Modified Files

1. **`src/lib/email/templates.ts`** ✅
   - Updated all helper functions
   - Updated all 7 email template functions
   - Added safe date handling

2. **`src/app/api/notify/booking-created/route.ts`** ✅
   - Added `booking_items` fetch
   - Pass `items` to email templates

3. **`src/app/api/stripe/webhook/route.ts`** ✅
   - Updated `processPayment()` to fetch and pass `items`
   - Updated `handleCheckoutCompleted()` to fetch and pass `items`
   - Updated `handleAsyncPaymentFailed()` to fetch and pass `items`

---

## 10. Testing Checklist

### Test Booking Received Emails
- [ ] Create booking with 1 item
- [ ] Create booking with multiple items (tour + transfer)
- [ ] Create booking with items on same date (should show single date)
- [ ] Create booking with items on different dates (should show date range)
- [ ] Create booking with missing dates (should show "TBD")
- [ ] Verify customer email shows all item details
- [ ] Verify admin email shows all item details

### Test Payment Received Emails
- [ ] Complete payment for single-item booking
- [ ] Complete payment for multi-item booking
- [ ] Verify date range computed correctly
- [ ] Verify all items display in email
- [ ] Verify subtotals match

### Test Payment Pending Emails (Konbini/Bank Transfer)
- [ ] Initiate konbini payment
- [ ] Verify "Payment Pending" email sent
- [ ] Verify booking items display correctly
- [ ] Verify date range shown

### Test Payment Failed Emails
- [ ] Trigger payment failure (expired konbini)
- [ ] Verify "Payment Failed" email sent
- [ ] Verify booking items display correctly
- [ ] Verify "Retry Payment" button links correctly

---

## 11. Build Status

✅ **Build successful:** `npm run build` passed with no errors
✅ **TypeScript:** No type errors
✅ **All routes compiled:** 35/35 pages generated

---

## 12. Benefits

### Before:
- ❌ Single `booking.travel_date` caused "1/1/1970" errors
- ❌ No per-item details in emails
- ❌ No location info for individual items
- ❌ No passenger/luggage counts per item
- ❌ Generic "Travel Date" for multi-day bookings

### After:
- ✅ Date range computed from all items
- ✅ Per-item cards with type badges
- ✅ Pickup/dropoff shown per transfer
- ✅ Passenger/luggage counts per item
- ✅ Subtotals per item
- ✅ Safe "TBD" fallback for missing dates
- ✅ Mobile-friendly item cards
- ✅ Clean, professional layout

---

## 13. Next Steps

1. Deploy to production
2. Test with real booking data
3. Monitor email deliverability (Brevo dashboard)
4. Verify date ranges display correctly in various scenarios
5. Test mobile email rendering (Gmail, Apple Mail, Outlook apps)
6. Collect customer feedback on new email format

---

## 14. Support for Future Enhancements

This implementation is extensible for:
- Multi-language email templates (item details already structured)
- Email personalization (item-specific recommendations)
- Attachment support (per-item itineraries/vouchers)
- Item-level tracking links
- Calendar event generation per item
