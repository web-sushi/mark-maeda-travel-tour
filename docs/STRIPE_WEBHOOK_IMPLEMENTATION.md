# Stripe Webhook Implementation - Complete Guide

## Overview

This implementation provides a robust Stripe webhook handler with:
- ✅ Signature verification using raw request body
- ✅ Idempotency via `stripe_webhook_events` table
- ✅ Support for 2-payment flow (deposit + balance)
- ✅ Delayed payment support (konbini, bank transfer)
- ✅ Refund handling
- ✅ Comprehensive logging and error handling

## Files Modified

### 1. **Database Migration** 
`supabase/migrations/20260210_stripe_webhook_tracking.sql`
- Creates `stripe_webhook_events` table for idempotency
- Adds Stripe session tracking columns to `bookings` table
- Adds new payment statuses

### 2. **Webhook Handler**
`src/app/api/stripe/webhook/route.ts`
- Complete rewrite with all event handlers
- Secure signature verification
- Idempotency checks
- Payment processing logic

### 3. **Type Definitions**
`src/types/booking.ts`
- Updated `PaymentStatus` type to include `payment_failed`

### 4. **UI Components**
`src/components/booking/BookingDetails.tsx`
- Added styling for `payment_failed` status

### 5. **Checkout Session Creation**
- `src/app/api/stripe/create-checkout/route.ts` - Deposit payment
- `src/app/api/stripe/create-checkout-remaining/route.ts` - Balance payment
- Both now include required metadata

## Database Schema

### New Table: `stripe_webhook_events`

```sql
CREATE TABLE public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,              -- Stripe event ID (e.g., evt_xxx)
  event_type TEXT NOT NULL,               -- Event type (e.g., checkout.session.completed)
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  booking_id UUID,                        -- Reference to bookings table
  metadata JSONB,                         -- Additional event data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Ensures each Stripe event is processed exactly once (idempotency).

### Updated Table: `bookings`

**New Columns:**
```sql
ALTER TABLE public.bookings
  ADD COLUMN stripe_deposit_session_id TEXT,
  ADD COLUMN stripe_balance_session_id TEXT,
  ADD COLUMN stripe_deposit_payment_intent_id TEXT,
  ADD COLUMN stripe_balance_payment_intent_id TEXT,
  ADD COLUMN refund_amount INTEGER DEFAULT 0,
  ADD COLUMN refund_reason TEXT,
  ADD COLUMN refunded_at TIMESTAMPTZ;
```

**Updated Payment Statuses:**
```sql
CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded', 'payment_failed'))
```

## Events Handled

### 1. `checkout.session.completed`
**When:** Customer completes checkout
**Action:**
- For immediate payments (card): Process payment immediately
- For delayed payments (konbini, bank transfer): Wait for `async_payment_succeeded`
- Records session ID and payment intent ID
- Updates `amount_paid`, `remaining_amount`, `payment_status`
- Sends payment confirmation email

### 2. `checkout.session.async_payment_succeeded`
**When:** Delayed payment succeeds (konbini payment received, bank transfer cleared)
**Action:**
- Process payment (same as immediate card payment)
- Updates booking to `paid` or `partial` status
- Sends payment confirmation email

### 3. `checkout.session.async_payment_failed`
**When:** Delayed payment fails (konbini expired, bank transfer rejected)
**Action:**
- Sets `payment_status = "payment_failed"`
- Does NOT cancel booking automatically
- Records failure event
- Admin can follow up with customer

### 4. `charge.refunded`
**When:** A charge is refunded (full or partial)
**Action:**
- Sets `payment_status = "refunded"`
- Records refund amount and reason
- Sets `refunded_at` timestamp
- Creates refund event

### 5. `payment_intent.succeeded` (Fallback)
**When:** Payment intent succeeds
**Action:**
- Checks if already processed via checkout.session event
- Logs but doesn't double-process
- Safety net for edge cases

## Payment Flow

### Deposit Payment (Initial)

```
Customer → Checkout (25%, 50%, or 100%)
         ↓
Stripe creates Checkout Session
  metadata: {
    booking_id: "uuid",
    bookingId: "uuid",
    pay_type: "deposit",
    paymentType: "deposit",
    pay_percent: "25"
  }
         ↓
[Card Payment] → checkout.session.completed → Process immediately
[Konbini]      → checkout.session.completed (unpaid) → Wait
              → checkout.session.async_payment_succeeded → Process
         ↓
Update booking:
  - amount_paid += deposit_amount
  - remaining_amount -= deposit_amount
  - payment_status = "partial" (or "paid" if 100%)
  - stripe_deposit_session_id = session.id
  - stripe_deposit_payment_intent_id = pi_xxx
```

### Balance Payment (Remaining)

```
Customer → Pay Remaining Balance
         ↓
Stripe creates Checkout Session
  metadata: {
    booking_id: "uuid",
    bookingId: "uuid",
    pay_type: "remaining",
    paymentType: "remaining"
  }
         ↓
[Same flow as deposit]
         ↓
Update booking:
  - amount_paid += balance_amount
  - remaining_amount = 0
  - payment_status = "paid"
  - stripe_balance_session_id = session.id
  - stripe_balance_payment_intent_id = pi_xxx
```

## Metadata Requirements

### When Creating Checkout Sessions

**Required metadata** (must be set on BOTH session.metadata AND payment_intent_data.metadata):

```typescript
{
  booking_id: string,      // Primary booking UUID
  bookingId: string,       // Duplicate for compatibility
  pay_type: "deposit" | "remaining",     // Payment type
  paymentType: "deposit" | "remaining",  // Duplicate for compatibility
  pay_percent?: string     // Only for deposit (e.g., "25", "50", "100")
}
```

**Example:**
```typescript
const session = await stripe.checkout.sessions.create({
  // ... line items, etc.
  metadata: {
    booking_id: bookingId,
    bookingId: bookingId,
    pay_type: "deposit",
    paymentType: "deposit",
    pay_percent: "50",
  },
  payment_intent_data: {
    metadata: {
      booking_id: bookingId,
      bookingId: bookingId,
      pay_type: "deposit",
      paymentType: "deposit",
    },
  },
});
```

## Environment Variables

### Required in Vercel

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # 🔴 CRITICAL - Get from Stripe Dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # For bypassing RLS
```

### Getting STRIPE_WEBHOOK_SECRET

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your Vercel URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `charge.refunded`
   - `payment_intent.succeeded`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Add to Vercel environment variables

## Idempotency

### How It Works

1. Every Stripe event has a unique `event.id` (e.g., `evt_1ABC2XYZ`)
2. Before processing, webhook checks `stripe_webhook_events` table
3. If `event_id` exists → Return `200 OK` immediately (already processed)
4. If new → Process event and insert into `stripe_webhook_events`

### Why It Matters

- Stripe may retry webhooks multiple times
- Network issues can cause duplicate delivery
- Without idempotency, you'd charge customers twice or send duplicate emails

### Implementation

```typescript
// Check if event already processed
const { data: existingEvent } = await supabase
  .from("stripe_webhook_events")
  .select("event_id")
  .eq("event_id", event.id)
  .single();

if (existingEvent) {
  return NextResponse.json({ received: true, message: "Already processed" });
}

// Process event...

// Record event
await supabase.from("stripe_webhook_events").insert({
  event_id: event.id,
  event_type: event.type,
  booking_id: bookingId,
  metadata: { /* event details */ },
});
```

## Payment Status State Machine

```
unpaid → partial → paid
  ↓         ↓        ↓
payment_failed  refunded
```

### Status Definitions

| Status | Meaning |
|--------|---------|
| `unpaid` | No payments received |
| `partial` | Deposit paid, balance remaining |
| `paid` | Fully paid |
| `payment_failed` | Delayed payment (konbini/bank) failed |
| `refunded` | Payment refunded |

### Transitions

- **unpaid → partial:** First deposit payment succeeds
- **unpaid → paid:** 100% deposit payment succeeds
- **partial → paid:** Balance payment succeeds
- **any → payment_failed:** Async payment fails
- **any → refunded:** Refund processed

## Logging

### Console Output Format

```
[Stripe Webhook] ✅ Verified event: checkout.session.completed (evt_xxx)
[Stripe Webhook] 💳 checkout.session.completed: cs_xxx
[Stripe Webhook] 💰 Payment for booking abc-123:
  payment_type: deposit
  paid_amount: 50000
  new_paid: 50000
  new_remaining: 50000
  previous_status: unpaid
  new_status: partial
[Stripe Webhook] 📧 Payment email sent to customer@example.com
[Stripe Webhook] ✅ Successfully processed payment for booking abc-123
```

### Log Levels

- ✅ Success/completion
- 💳 Payment event received
- 💰 Payment processing
- 📧 Email sent
- ⏳ Waiting for async payment
- ⏭️  Skipped (already processed)
- ℹ️  Info/unhandled event
- ⚠️  Warning (non-fatal)
- ❌ Error

## Testing

### Test Webhook Locally

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login:
   ```bash
   stripe login
   ```

3. Forward webhooks to local dev:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Get webhook secret from output (starts with `whsec_`)

5. Set in `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

6. Trigger test event:
   ```bash
   stripe trigger checkout.session.completed
   ```

### Test Payment Types

#### Test Card Payment
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

#### Test Konbini Payment
```
Payment Method: Konbini
→ checkout.session.completed (payment_status: unpaid)
→ Use Stripe CLI to trigger: stripe trigger checkout.session.async_payment_succeeded
```

#### Test Refund
```
1. Complete a payment
2. Go to Stripe Dashboard → Payments
3. Click on payment → Refund
→ Webhook fires: charge.refunded
```

## Error Handling

### Invalid Signature
```
Status: 400
Response: { error: "Invalid signature" }
```
**Fix:** Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard

### Missing bookingId
```
Status: 200 (acknowledged)
Response: { received: true, error: "Missing bookingId" }
```
**Fix:** Ensure Checkout Session includes `booking_id` in metadata

### Booking Not Found
```
Status: 200 (acknowledged)
Response: { received: true, error: "Booking not found" }
```
**Fix:** Verify `booking_id` matches existing booking UUID

### Email Send Failure
```
⚠️ Warning logged, webhook still succeeds
```
**Behavior:** Payment is recorded even if email fails (email is non-critical)

## Security

### Signature Verification
- ✅ All events verified using `stripe.webhooks.constructEvent()`
- ✅ Uses raw request body (`request.text()`)
- ✅ Rejects events with invalid signatures

### Access Control
- Uses Supabase service role key (bypasses RLS)
- Only webhook endpoint has this access
- Webhook URL should be kept secure

### Best Practices
1. Never expose `STRIPE_WEBHOOK_SECRET` in client code
2. Always verify webhook signatures
3. Use idempotency to prevent duplicate processing
4. Log all events for audit trail
5. Don't trust redirect URLs (only webhooks are authoritative)

## Monitoring

### What to Monitor

1. **Webhook Delivery Rate**
   - Check Stripe Dashboard → Webhooks → Endpoint
   - Should be 100% success rate

2. **Failed Events**
   - Check `stripe_webhook_events` for errors in metadata
   - Review Vercel logs for error traces

3. **Payment Status Stuck**
   - Query bookings with `payment_status = 'unpaid'` and `created_at > 1 hour ago`
   - May indicate webhook delivery issues

4. **Async Payment Timeouts**
   - Konbini payments can take days
   - Check for bookings with `payment_status = 'unpaid'` and recent checkout session

### Database Queries

**Check recent webhook events:**
```sql
SELECT event_id, event_type, booking_id, processed_at, metadata
FROM stripe_webhook_events
ORDER BY processed_at DESC
LIMIT 20;
```

**Find payment failures:**
```sql
SELECT id, reference_code, customer_email, payment_status, created_at
FROM bookings
WHERE payment_status = 'payment_failed'
ORDER BY created_at DESC;
```

**Find pending async payments:**
```sql
SELECT id, reference_code, customer_email, created_at,
       NOW() - created_at as age
FROM bookings
WHERE payment_status = 'unpaid'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## Troubleshooting

### Webhook Not Firing

**Symptoms:** Payment completes but booking not updated

**Checks:**
1. Verify webhook endpoint in Stripe Dashboard
2. Check Vercel logs for incoming requests
3. Verify `STRIPE_WEBHOOK_SECRET` is set
4. Check webhook endpoint URL (must be HTTPS in production)

**Solution:**
```bash
# Check Stripe Dashboard → Webhooks → Recent events
# Look for failed deliveries or signature mismatches
```

### Double Processing

**Symptoms:** Payment amount doubled, duplicate emails

**Checks:**
1. Verify idempotency is working
2. Check `stripe_webhook_events` table for duplicates
3. Review Vercel logs for multiple webhook calls with same `event_id`

**Solution:**
```sql
-- Should show only one row per event_id
SELECT event_id, COUNT(*) 
FROM stripe_webhook_events 
GROUP BY event_id 
HAVING COUNT(*) > 1;
```

### Async Payment Not Updating

**Symptoms:** Konbini payment made but booking still shows "unpaid"

**Checks:**
1. Verify `checkout.session.async_payment_succeeded` is in webhook events list
2. Check Stripe Dashboard → Events for the event
3. Verify event was delivered to webhook

**Solution:**
```bash
# Manually trigger the event (testing only)
stripe events resend evt_xxx
```

## Deployment Checklist

- [ ] Run database migration (`20260210_stripe_webhook_tracking.sql`)
- [ ] Set `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Select all required events in Stripe Dashboard
- [ ] Test webhook with Stripe CLI locally
- [ ] Deploy to Vercel
- [ ] Test live webhook with test payment
- [ ] Verify idempotency (retry same event)
- [ ] Test konbini/delayed payment flow
- [ ] Test refund flow
- [ ] Set up monitoring alerts

## Support

If webhooks fail or payments aren't processing:

1. Check Vercel logs: `vercel logs --follow`
2. Check Stripe Dashboard → Webhooks → Events
3. Review `stripe_webhook_events` table
4. Check `booking_events` table for payment records
5. Verify all environment variables are set

## Summary

This implementation provides:
- ✅ Secure signature verification
- ✅ Idempotency (no duplicate processing)
- ✅ 2-payment flow support (deposit + balance)
- ✅ Delayed payment support (konbini, bank transfer)
- ✅ Refund handling
- ✅ Comprehensive logging
- ✅ Email notifications
- ✅ TypeScript type safety
- ✅ Build verified (exit code 0)

The webhook is production-ready and follows Stripe best practices.
