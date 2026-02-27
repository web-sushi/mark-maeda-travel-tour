# Stripe Webhook Payment Updates - Implementation Guide

## Overview
Complete Stripe webhook-based payment flow with deposit options (25%, 50%, 100%) and proper `remaining_amount` updates after payment. Includes idempotency protection and JPY currency handling.

## Critical: JPY Currency Handling

**IMPORTANT:** JPY (Japanese Yen) has **NO minor currency unit**. All amounts are integers representing yen.

- Stripe `amount_total` is in yen (e.g., 10000 = ¥10,000)
- **DO NOT divide by 100** for JPY
- Database stores amounts as numeric (e.g., 10000.00 = ¥10,000)

## Files Changed

### 1. `/src/app/api/stripe/create-checkout/route.ts`
**Changes:**
- Added `client_reference_id: booking.id` for webhook lookup
- Changed metadata from `bookingId` to `booking_id`
- Changed metadata from `depositChoice` to `pay_percent`
- Added `payment_intent_data.metadata` with same values (redundancy)

**Before:**
```typescript
metadata: {
  bookingId: booking.id,
  depositChoice: depositChoice.toString(),
}
```

**After:**
```typescript
client_reference_id: booking.id,
metadata: {
  booking_id: booking.id,
  pay_percent: depositChoice.toString(),
},
payment_intent_data: {
  metadata: {
    booking_id: booking.id,
    pay_percent: depositChoice.toString(),
  },
}
```

### 2. `/src/app/api/stripe/webhook/route.ts` (Complete Rewrite)
**Changes:**
- Uses `await request.text()` for raw body (required for signature verification)
- Verifies webhook signature with `stripe.webhooks.constructEvent()`
- Extracts `bookingId` from `metadata.booking_id` OR `client_reference_id`
- Extracts `paymentIntentId` from `session.payment_intent`
- **Idempotency check:** Queries `booking_events` for existing `stripe_payment_recorded` with same `payment_intent_id`
- **Updates booking:**
  ```typescript
  newPaidAmount = amount_paid + session.amount_total // JPY, no division
  newRemainingAmount = max(total_amount - newPaidAmount, 0)
  paymentStatus = newRemainingAmount === 0 ? "paid" : "partial"
  ```
- Inserts `booking_events` row for idempotency tracking
- Comprehensive console logging
- Returns 200 for all handled events

### 3. `/src/app/booking/success/page.tsx` (Wrapper)
**Changes:**
- Converted to Suspense wrapper for client component

### 4. `/src/app/booking/success/SuccessPageContent.tsx` (New Client Component)
**Changes:**
- Client component that fetches booking data from Supabase
- Shows **actual payment amounts from database:**
  - Total Amount
  - Amount Paid
  - Remaining Balance (if any)
- **Polling logic:** If `payment_status === "unpaid"`, polls up to 3 times (2s intervals)
- Shows "Payment Processing" alert while webhook is pending
- Shows "Refresh" button after 3 failed polls
- Payment status badges:
  - Yellow: "Payment Processing"
  - Blue: "Deposit Received"
  - Green: "Fully Paid"

## Complete Payment Flow

### Step-by-Step:

**1. User checks out:**
```
/checkout
↓
User fills form + selects payment option (25%/50%/100%)
↓
Clicks "Pay & Create Booking"
```

**2. Booking created:**
```typescript
// In checkout/page.tsx
const bookingData = {
  // ... customer info ...
  total_amount: 100000,
  deposit_choice: 50, // User selected 50%
  amount_paid: 0, // Nothing paid yet
  remaining_amount: 100000,
  booking_status: "pending",
  payment_status: "unpaid",
}

await supabase.from("bookings").insert(bookingData)
await supabase.from("booking_items").insert(items) // For reviews
```

**3. Stripe session created:**
```typescript
POST /api/stripe/create-checkout
{
  bookingId: "abc-123",
  depositChoice: 50
}

↓ Creates Stripe Session with:
- amount: 50000 JPY (50% of 100000)
- client_reference_id: "abc-123"
- metadata: { booking_id: "abc-123", pay_percent: "50" }
- success_url: /booking/success?bookingId=abc-123

Returns: { url: "https://checkout.stripe.com/..." }
```

**4. User redirected to Stripe:**
```
window.location.href = stripeCheckoutUrl
↓
User completes payment on Stripe
```

**5. Stripe webhook triggered:**
```
POST /api/stripe/webhook
Event: checkout.session.completed

Webhook extracts:
- bookingId: "abc-123" (from metadata or client_reference_id)
- paymentIntentId: "pi_xyz123"
- amount_total: 50000 (JPY)

Idempotency check:
- Query booking_events for stripe_payment_recorded with this payment_intent_id
- If exists, return early (already processed)

Update booking:
- amount_paid: 0 + 50000 = 50000
- remaining_amount: 100000 - 50000 = 50000
- payment_status: "partial" (because remaining > 0)

Insert booking_event:
- event_type: "stripe_payment_recorded"
- event_payload: { payment_intent_id: "pi_xyz123", amount_paid: 50000, ... }
```

**6. User redirected to success page:**
```
/booking/success?bookingId=abc-123
↓
Success page fetches booking from DB
↓
Shows:
- Amount Paid: ¥50,000 ✅
- Remaining: ¥50,000 ✅
- Status: "Deposit Received" ✅
```

## Idempotency Protection

**Why needed:** Stripe may send the same webhook multiple times.

**Implementation:**
```typescript
// Check if payment_intent already recorded
const { data: existingEvent } = await supabase
  .from("booking_events")
  .select("id")
  .eq("booking_id", bookingId)
  .eq("event_type", "stripe_payment_recorded")
  .contains("event_payload", { payment_intent_id: paymentIntentId })
  .single();

if (existingEvent) {
  console.log("Payment already recorded");
  return NextResponse.json({ received: true, message: "Already processed" });
}
```

**Benefits:**
- Prevents double-charging customer records
- Prevents incorrect amount_paid calculations
- Safe to replay webhooks

## Success Page Polling Logic

**Problem:** Webhook might not process before user lands on success page.

**Solution:**
```typescript
// Poll up to 3 times (2s intervals)
if (payment_status === "unpaid" && pollCount < 3) {
  setTimeout(() => {
    fetchBooking(); // Re-fetch from DB
  }, 2000);
}

// After 3 polls, show refresh button
if (payment_status === "unpaid" && pollCount >= 3) {
  setShowRefresh(true);
}
```

**User Experience:**
1. Lands on success page immediately
2. Sees "Payment Processing..." alert (yellow)
3. Page auto-refreshes 3 times over 6 seconds
4. If still pending, shows manual "Refresh" button
5. Once webhook processes, shows actual paid amounts

## Database Schema

**bookings table** (no changes needed):
```sql
total_amount numeric -- Total booking cost
amount_paid numeric -- Amount paid so far (updated by webhook)
remaining_amount numeric -- Outstanding balance (updated by webhook)
payment_status text -- 'unpaid' | 'partial' | 'paid'
deposit_choice integer -- 25, 50, or 100 (selected by user)
```

**booking_events table** (already exists):
```sql
booking_id uuid
event_type text -- 'stripe_payment_recorded'
event_payload jsonb -- { payment_intent_id, amount_paid, ... }
created_at timestamptz
```

## Environment Variables

**Required in `.env.local`:**
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJh...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**For local webhook testing:**
1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: 
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`) to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Console Logging

**Checkout Session Creation:**
```
Stripe checkout session created: {
  sessionId: "cs_test_...",
  bookingId: "abc-123",
  depositChoice: 50,
  amount: 50000
}
```

**Webhook Processing:**
```
[Stripe Webhook] Received event: checkout.session.completed
[Stripe Webhook] checkout.session.completed: {
  sessionId: "cs_test_...",
  bookingId: "abc-123",
  payPercent: "50",
  paymentIntentId: "pi_xyz123",
  amountTotal: 50000
}
[Stripe Webhook] Updating booking abc-123: {
  previousPaidAmount: 0,
  paidAmount: 50000,
  newPaidAmount: 50000,
  previousRemainingAmount: 100000,
  newRemainingAmount: 50000,
  previousPaymentStatus: "unpaid",
  newPaymentStatus: "partial"
}
[Stripe Webhook] Successfully processed payment for booking abc-123
```

## Testing Guide

### 1. Local Testing with Stripe CLI

**Terminal 1:** Start Next.js
```bash
npm run dev
```

**Terminal 2:** Forward webhooks
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook secret that appears and add to `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Terminal 3:** Test checkout flow
```bash
# Use Stripe test card
Card: 4242 4242 4242 4242
Exp: 12/34
CVC: 123
```

### 2. Verify Webhook Processing

**Check console logs:**
```
✅ [Stripe Webhook] Received event: checkout.session.completed
✅ [Stripe Webhook] Updating booking...
✅ [Stripe Webhook] Successfully processed payment
```

**Check database:**
```sql
SELECT 
  reference_code,
  total_amount,
  amount_paid,
  remaining_amount,
  payment_status
FROM bookings
WHERE id = 'your-booking-id';

-- Should show updated amounts
```

**Check booking_events:**
```sql
SELECT * FROM booking_events
WHERE event_type = 'stripe_payment_recorded'
ORDER BY created_at DESC;

-- Should have payment_intent_id in event_payload
```

### 3. Test Scenarios

**Scenario 1: 25% Deposit**
```
Total: ¥100,000
Selected: 25%
Charged: ¥25,000

After webhook:
- amount_paid: ¥25,000
- remaining_amount: ¥75,000
- payment_status: "partial"
```

**Scenario 2: 50% Deposit**
```
Total: ¥100,000
Selected: 50%
Charged: ¥50,000

After webhook:
- amount_paid: ¥50,000
- remaining_amount: ¥50,000
- payment_status: "partial"
```

**Scenario 3: 100% Full Payment**
```
Total: ¥100,000
Selected: 100%
Charged: ¥100,000

After webhook:
- amount_paid: ¥100,000
- remaining_amount: ¥0
- payment_status: "paid"
```

**Scenario 4: Idempotency (Replay Webhook)**
```
1st webhook: Updates booking ✅
2nd webhook: Detects existing event → returns early ✅
Amounts remain correct (not doubled) ✅
```

## Success Page Behavior

### Before Webhook Processing:
```
┌─────────────────────────────────┐
│ ⚠ Payment Processing            │
│ Your payment is being processed.│
│ This usually takes a few seconds│
│                                 │
│ [Auto-refreshing...]            │
└─────────────────────────────────┘
```

### After Webhook Processing:
```
┌─────────────────────────────────┐
│ ✓ Deposit Received              │
│ Your deposit has been received. │
│ Remaining balance due before    │
│ travel date.                    │
└─────────────────────────────────┘

Payment Summary:
Total Amount:      ¥100,000
Amount Paid:       ¥50,000 ✓
Remaining Balance: ¥50,000
```

## Error Handling

### Webhook Errors (All return 200 to acknowledge):
- Missing webhook secret → 500 (config error)
- Invalid signature → 400 (security)
- Missing bookingId → Logs error, returns 200
- Missing payment_intent → Logs error, returns 200
- Booking not found → Logs error, returns 200
- Update fails → Logs error, returns 200
- Already processed → Logs info, returns 200

### Success Page Errors:
- No bookingId → Shows generic success message
- Booking not found → Shows error + "Back to Home" button
- Fetch fails → Shows error message
- Payment pending → Auto-polls 3 times, then shows refresh button

## Security

✅ **Webhook Signature Verification**
- Every webhook verified with `stripe.webhooks.constructEvent()`
- Invalid signatures rejected immediately
- Protects against forged webhooks

✅ **Idempotency**
- Uses `payment_intent_id` as unique identifier
- Checks `booking_events` before processing
- Prevents double-processing same payment

✅ **Service Role Client**
- Webhook uses Supabase service role key
- Bypasses RLS (admin-level access)
- Required since webhook is external (no user session)

## Troubleshooting

### Webhook not firing locally?
```bash
# 1. Check Stripe CLI is running
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 2. Check webhook secret matches
echo $STRIPE_WEBHOOK_SECRET
# Should match "Ready! Your webhook signing secret is whsec_..."

# 3. Check Next.js is running
npm run dev

# 4. Check webhook logs
stripe logs tail
```

### Payment not updating?
```bash
# 1. Check webhook received
[Stripe Webhook] Received event: checkout.session.completed

# 2. Check bookingId extracted
[Stripe Webhook] bookingId: "abc-123"

# 3. Check database updated
SELECT * FROM bookings WHERE id = 'abc-123';

# 4. Check booking_events created
SELECT * FROM booking_events 
WHERE event_type = 'stripe_payment_recorded' 
ORDER BY created_at DESC LIMIT 1;
```

### Success page showing old amounts?
- Webhook may be delayed (usually < 1 second)
- Page auto-polls 3 times over 6 seconds
- If still pending, use manual refresh button
- Check webhook logs to confirm processing

## Production Deployment

### 1. Update Stripe Webhook Endpoint
In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`
4. Copy webhook signing secret
5. Add to production environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```

### 2. Environment Variables
**Production `.env` must have:**
```env
STRIPE_SECRET_KEY=sk_live_... # Live key, not test
STRIPE_WEBHOOK_SECRET=whsec_live_... # From Stripe dashboard
SUPABASE_SERVICE_ROLE_KEY=eyJh... # Service role key
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SITE_URL=https://yourdomain.com # Production URL
```

### 3. Test in Production
1. Make a real booking (use live card or test mode)
2. Check Stripe Dashboard → Payments
3. Check Stripe Dashboard → Webhooks (verify delivery)
4. Check database for updated amounts
5. Check booking_events for recorded payment

## Files Changed Summary

**Modified (3 files):**
1. `/src/app/api/stripe/create-checkout/route.ts`
   - Added client_reference_id
   - Updated metadata keys
   - Added payment_intent_data.metadata

2. `/src/app/api/stripe/webhook/route.ts`
   - Complete rewrite for proper webhook handling
   - Signature verification
   - Idempotency check
   - Correct JPY amount handling
   - Comprehensive logging

3. `/src/app/booking/success/page.tsx`
   - Converted to Suspense wrapper

**Created (1 file):**
1. `/src/app/booking/success/SuccessPageContent.tsx`
   - Client component with polling
   - Shows real payment amounts from DB
   - Auto-refresh for pending webhooks

**Unchanged:**
- `/src/app/(checkout)/checkout/page.tsx` - Already updated in previous step
- All other routes and components

## Key Improvements

✅ **Correct JPY Handling:** No division by 100
✅ **Idempotency:** Prevents double-processing
✅ **Signature Verification:** Secure webhook handling
✅ **Accurate Amounts:** Success page shows DB values
✅ **Graceful Pending:** Polls for webhook completion
✅ **Comprehensive Logging:** Easy debugging
✅ **Service Role:** Bypasses RLS restrictions
✅ **No Schema Changes:** Uses existing columns

## Next Steps

1. Run SQL migration if needed (schema already exists)
2. Test locally with Stripe CLI
3. Deploy to production
4. Configure production webhook endpoint
5. Test with real/test payments
6. Monitor webhook logs

The payment flow is now production-ready with proper webhook handling! 🎉
