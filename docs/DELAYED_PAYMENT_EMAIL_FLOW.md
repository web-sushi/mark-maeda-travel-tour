# Delayed Payment Email Flow Implementation

## Summary

Updated the email flow to properly support delayed payment methods (konbini/bank transfer) in Stripe Checkout. The system now sends appropriate notifications based on payment status instead of immediately confirming payment on checkout completion.

---

## Changes

### 1. New Email Templates (`src/lib/email/templates.ts`)

Added **4 new email template functions**:

#### **8. Payment Pending - Customer**
```typescript
paymentPendingCustomer(booking, paymentAmount, paymentType)
```
- **Subject:** "Payment Pending - Booking Reserved {reference_code}"
- **Sent when:** `checkout.session.completed` with `payment_status === "unpaid"`
- **Content:**
  - Confirms booking is reserved
  - Explains payment is pending
  - Shows payment method (Konbini/Bank Transfer)
  - Lists next steps (complete payment, await confirmation)
  - Link to track booking

#### **9. Payment Pending - Admin**
```typescript
paymentPendingAdmin(booking, paymentAmount, paymentType)
```
- **Subject:** "Payment Pending - {reference_code} ({paymentType})"
- **Sent when:** `checkout.session.completed` with `payment_status === "unpaid"`
- **Content:**
  - Notifies admin of pending payment
  - Shows customer details
  - Shows travel details
  - Payment method and amount
  - Link to admin dashboard

#### **10. Payment Failed - Customer**
```typescript
paymentFailedCustomer(booking, paymentAmount, paymentType)
```
- **Subject:** "Payment Failed - Action Required {reference_code}"
- **Sent when:** `checkout.session.async_payment_failed`
- **Content:**
  - Explains payment failed or expired
  - Lists what to do next (retry payment, choose different method)
  - Prominent "Retry Payment" CTA button (links to tracking page)
  - Explains booking is still reserved

#### **11. Payment Failed - Admin**
```typescript
paymentFailedAdmin(booking, paymentAmount, paymentType)
```
- **Subject:** "Payment Failed - {reference_code} ({paymentType})"
- **Sent when:** `checkout.session.async_payment_failed`
- **Content:**
  - Notifies admin of failed payment
  - Customer details
  - Travel details
  - Action required note (customer notified, consider follow-up)
  - Link to admin dashboard

---

### 2. Webhook Handler Updates (`src/app/api/stripe/webhook/route.ts`)

#### **Updated: `handleCheckoutCompleted()`**

**Before:**
```typescript
if (session.payment_status === "unpaid") {
  console.log("Waiting for async_payment_succeeded");
  // Just logged, no emails sent
  return;
}
```

**After:**
```typescript
if (session.payment_status === "unpaid") {
  console.log("Payment status is 'unpaid' (delayed payment), sending pending notification");
  
  // Fetch booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (booking) {
    const paymentAmount = session.amount_total || 0;
    const paymentMethodType = session.payment_method_types?.[0] || "delayed";
    
    // Send pending payment emails (customer + admin)
    const { paymentPendingCustomer, paymentPendingAdmin } = await import("@/lib/email/templates");
    
    // Customer email
    const customerEmail = paymentPendingCustomer(booking, paymentAmount, paymentMethodType);
    await sendBrevoEmail({
      to: booking.customer_email,
      subject: customerEmail.subject,
      html: customerEmail.html,
      text: customerEmail.text,
    });

    // Admin email
    const adminEmail = paymentPendingAdmin(booking, paymentAmount, paymentMethodType);
    await sendBrevoEmail({
      to: process.env.ADMIN_EMAIL || booking.customer_email,
      subject: adminEmail.subject,
      html: adminEmail.html,
      text: adminEmail.text,
    });

    // Record email events in booking_events table
    await supabase.from("booking_events").insert([
      {
        booking_id: bookingId,
        event_type: "email_sent_payment_pending_customer",
        event_payload: { session_id, payment_type, payment_method, amount },
      },
      {
        booking_id: bookingId,
        event_type: "email_sent_payment_pending_admin",
        event_payload: { session_id, payment_type, payment_method, amount },
      },
    ]);
  }

  return; // Do NOT process payment yet
}

// Process immediate payment (card)
await processPayment(supabase, eventId, bookingId, session, paymentType);
```

**Key Changes:**
- Detects delayed payment methods (konbini, bank transfer)
- Sends "Payment Pending" emails to customer and admin
- Records email events in `booking_events` table
- Does NOT mark booking as paid (waits for `async_payment_succeeded`)

---

#### **Updated: `handleAsyncPaymentFailed()`**

**Before:**
```typescript
// Updated booking to payment_failed
// Recorded webhook event
// Recorded booking event
// No emails sent
```

**After:**
```typescript
// Updated booking to payment_failed
// Recorded webhook event
// Recorded booking event

// Send payment failed emails
const paymentAmount = session.amount_total || 0;
const paymentMethodType = session.payment_method_types?.[0] || "delayed";

const { paymentFailedCustomer, paymentFailedAdmin } = await import("@/lib/email/templates");

// Customer email
const customerEmail = paymentFailedCustomer(booking, paymentAmount, paymentMethodType);
await sendBrevoEmail({
  to: booking.customer_email,
  subject: customerEmail.subject,
  html: customerEmail.html,
  text: customerEmail.text,
});

// Admin email
const adminEmail = paymentFailedAdmin(booking, paymentAmount, paymentMethodType);
await sendBrevoEmail({
  to: process.env.ADMIN_EMAIL || booking.customer_email,
  subject: adminEmail.subject,
  html: adminEmail.html,
  text: adminEmail.text,
});

// Record email events
await supabase.from("booking_events").insert([
  {
    booking_id: bookingId,
    event_type: "email_sent_payment_failed_customer",
    event_payload: { session_id, payment_type, amount },
  },
  {
    booking_id: bookingId,
    event_type: "email_sent_payment_failed_admin",
    event_payload: { session_id, payment_type, amount },
  },
]);
```

**Key Changes:**
- Sends "Payment Failed" emails to customer and admin
- Records email events in `booking_events` table
- Provides customer with instructions to retry payment
- Notifies admin to follow up if needed

---

## Email Flow for Delayed Payments

### Scenario 1: Customer Uses Konbini (Success)

1. **Customer completes checkout** → `checkout.session.completed`
   - `payment_status: "unpaid"` (payment not yet received)
   - ✉️ **Email Sent:** "Payment Pending - Booking Reserved"
   - **Booking Status:** `unpaid` or `partial` (depending on deposit choice)
   - Customer instructed to complete payment at konbini

2. **Customer pays at convenience store** → `checkout.session.async_payment_succeeded`
   - Stripe receives payment notification
   - ✉️ **Email Sent:** "Payment Received" (existing template)
   - **Booking Status:** `partial` or `paid` (updated via `processPayment`)
   - Customer sees confirmation

---

### Scenario 2: Customer Uses Konbini (Failure)

1. **Customer completes checkout** → `checkout.session.completed`
   - `payment_status: "unpaid"`
   - ✉️ **Email Sent:** "Payment Pending - Booking Reserved"
   - **Booking Status:** `unpaid` or `partial`

2. **Payment expires or fails** → `checkout.session.async_payment_failed`
   - Konbini payment window expires (typically 7 days)
   - ✉️ **Email Sent:** "Payment Failed - Action Required"
   - **Booking Status:** `payment_failed`
   - Customer instructed to retry via tracking page link

---

### Scenario 3: Customer Uses Card (Immediate)

1. **Customer completes checkout** → `checkout.session.completed`
   - `payment_status: "paid"` (card charged immediately)
   - ✉️ **Email Sent:** "Payment Received" (existing template)
   - **Booking Status:** `partial` or `paid` (updated via `processPayment`)
   - No pending state

---

## Payment Status Consistency

### Updated Status Flow

| Event | Payment Method | Previous Status | New Status | Email Sent |
|-------|---------------|-----------------|------------|------------|
| `checkout.session.completed` | **Card** | `unpaid` | `partial` or `paid` | ✉️ Payment Received |
| `checkout.session.completed` | **Konbini/Bank** | `unpaid` | `unpaid` or `partial` | ✉️ Payment Pending |
| `async_payment_succeeded` | **Konbini/Bank** | `unpaid`/`partial` | `partial` or `paid` | ✉️ Payment Received |
| `async_payment_failed` | **Konbini/Bank** | `unpaid`/`partial` | `payment_failed` | ✉️ Payment Failed |
| `charge.refunded` | Any | Any | `refunded` | (Existing) |

### Valid Payment Statuses
- `unpaid` – No payment received yet
- `partial` – Deposit paid, remaining balance due
- `paid` – Fully paid
- `payment_failed` – Payment attempt failed (booking still active)
- `refunded` – Payment refunded

---

## Booking Events Timeline

New event types added to `booking_events` table:

### Pending Payment Events
- `email_sent_payment_pending_customer`
- `email_sent_payment_pending_admin`

### Failed Payment Events
- `email_sent_payment_failed_customer`
- `email_sent_payment_failed_admin`

### Event Payload Structure
```json
{
  "session_id": "cs_test_xxx",
  "payment_type": "deposit",
  "payment_method": "konbini",
  "amount": 50000
}
```

---

## Retry Payment Flow

When customer receives "Payment Failed" email:

1. Click **"Retry Payment"** button in email
2. Redirected to booking tracking page (`/booking/track?ref={reference_code}`)
3. Tracking page shows current booking status and "Pay Remaining Balance" button
4. Clicking button creates a new Stripe Checkout Session (via `/api/stripe/create-checkout-remaining`)
5. Customer completes payment with a new payment method (card, konbini, etc.)
6. Process repeats based on new payment method

---

## Testing Scenarios

### Test 1: Konbini Payment Success
1. Create booking, choose 50% deposit
2. Select "Konbini" payment method in Stripe test mode
3. Complete checkout
4. ✅ Verify "Payment Pending" email received
5. ✅ Verify booking status is `partial`
6. Use Stripe Dashboard to manually trigger `async_payment_succeeded`
7. ✅ Verify "Payment Received" email received
8. ✅ Verify booking status is `partial`

### Test 2: Konbini Payment Failure
1. Create booking, choose 50% deposit
2. Select "Konbini" payment method
3. Complete checkout
4. ✅ Verify "Payment Pending" email received
5. Use Stripe Dashboard to manually trigger `async_payment_failed`
6. ✅ Verify "Payment Failed" email received
7. ✅ Verify booking status is `payment_failed`
8. Click "Retry Payment" link in email
9. ✅ Verify redirected to tracking page with payment option

### Test 3: Card Payment (Immediate)
1. Create booking, choose 50% deposit
2. Select "Card" payment method (test card: 4242 4242 4242 4242)
3. Complete checkout
4. ✅ Verify "Payment Received" email received (NOT "Payment Pending")
5. ✅ Verify booking status is `partial` (deposit paid)
6. ✅ Verify NO `async_payment_*` events triggered

---

## Environment Variables

Ensure these are set in Vercel/`.env.local`:

```bash
# Email
ADMIN_EMAIL=admin@markmaeda.com  # For admin notifications

# Brevo (already configured)
BREVO_API_KEY=your_brevo_key

# Stripe (already configured)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Files Changed

### Modified Files
1. **`src/lib/email/templates.ts`** ✅
   - Added 4 new email template functions
   - `paymentPendingCustomer()`
   - `paymentPendingAdmin()`
   - `paymentFailedCustomer()`
   - `paymentFailedAdmin()`

2. **`src/app/api/stripe/webhook/route.ts`** ✅
   - Updated `handleCheckoutCompleted()` to send pending emails for delayed payments
   - Updated `handleAsyncPaymentFailed()` to send failure emails

### No Schema Changes Required
- ✅ `payment_status` already supports `"payment_failed"` (added in previous webhook implementation)
- ✅ `booking_events` table already exists for timeline tracking
- ✅ `stripe_webhook_events` table already exists for idempotency

---

## Logging & Debugging

### Check webhook processing:
```bash
# Vercel logs
vercel logs --prod

# Look for these log messages:
[Stripe Webhook] ⏳ Payment status is 'unpaid' (delayed payment), sending pending notification
[Stripe Webhook] 📧 Payment pending emails sent for booking {bookingId}
[Stripe Webhook] ❌ checkout.session.async_payment_failed
[Stripe Webhook] 📧 Payment failed emails sent to customer and admin
```

### Check booking events timeline:
```sql
SELECT * FROM booking_events 
WHERE booking_id = 'xxx' 
ORDER BY created_at DESC;

-- Look for:
-- email_sent_payment_pending_customer
-- email_sent_payment_pending_admin
-- email_sent_payment_failed_customer
-- email_sent_payment_failed_admin
```

---

## Build Status

✅ **Build successful:** `npm run build` passed with no errors
✅ **TypeScript:** No type errors
✅ **All routes compiled:** 35/35 pages generated

---

## Next Steps

1. Deploy to staging/production
2. Configure Stripe webhook endpoint in Stripe Dashboard
3. Test with real konbini payment in Stripe test mode
4. Monitor Vercel logs for webhook events
5. Test customer email notifications
6. Test admin email notifications
7. Verify booking_events timeline is recorded
8. Test retry payment flow from failed payment email

---

## Support for Future Enhancements

This implementation is extensible for:
- Additional delayed payment methods (bank transfer, PayPay, etc.)
- Custom reminder emails for pending payments (e.g., "Payment expires in 24 hours")
- Automatic booking cancellation after X days of failed payment
- SMS notifications for payment status
- Multi-language email templates
