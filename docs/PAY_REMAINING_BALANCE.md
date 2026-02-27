# Pay Remaining Balance Implementation

This document describes the implementation of the "Pay Remaining Balance" flow and email fixes for customer notifications.

## Overview

Customers can now pay their remaining balance directly from the Track Booking page. The system sends accurate payment emails showing the correct deposit choice and remaining amounts.

---

## A) Track Booking Page Updates

**File:** `src/components/booking/BookingDetails.tsx`

### Changes
1. Added state for payment loading and errors
2. Added `handlePayRemaining()` function that:
   - Calls `POST /api/stripe/create-checkout-remaining` with bookingId
   - Redirects to Stripe Checkout URL
   - Shows loading state and error messages

3. Updated Payment Summary section to show:
   - "Pay Remaining Balance" button when `remaining_amount > 0`
   - "Fully Paid" status with checkmark when `remaining_amount === 0`
   - Button disabled for cancelled bookings

### UI Behavior
- Button text: "Pay Remaining Balance (¥X,XXX)"
- Loading state: "Processing..."
- Disabled if booking is cancelled
- Error messages displayed inline

---

## B) New API Route

**File:** `src/app/api/stripe/create-checkout-remaining/route.ts`

### Endpoint
```
POST /api/stripe/create-checkout-remaining
```

### Input
```json
{
  "bookingId": "uuid"
}
```

### Output
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### Validation
- Booking must exist
- `remaining_amount > 0`
- Booking status not cancelled

### Stripe Session Details
- Amount: Exact `remaining_amount` from DB (JPY, no division)
- Metadata:
  - `booking_id`: For webhook lookup
  - `pay_type`: "remaining"
- Payment Intent Metadata: Same keys (for redundancy)
- `client_reference_id`: bookingId
- Success URL: `/booking/success?bookingId=...`
- Cancel URL: `/booking/track?bookingId=...`

---

## C) Email Updates

### 1. Booking Received Email (Updated)

**Template:** `bookingReceivedCustomer()`
**File:** `src/lib/email/templates.ts`

**Sent:** Immediately on booking creation

**Shows:**
- Total Amount
- Selected payment option (25%/50%/100%)
- Amount Due Now (calculated: `total * percent / 100`)
- Remaining After Payment (calculated: `total - dueNow`)
- Track booking link

**Logic:**
```typescript
const depositPercent = booking.deposit_choice || 100;
const amountDueNow = Math.round((booking.total_amount * depositPercent) / 100);
const remainingAfterDeposit = booking.total_amount - amountDueNow;
```

### 2. Payment Received Email (New)

**Template:** `paymentReceivedCustomer(booking, paidAmount, remainingAmount)`
**File:** `src/lib/email/templates.ts`

**Sent:** From webhook after successful Stripe payment

**Shows:**
- Thank you message
- This payment amount
- Total paid to date
- Remaining balance (if any)
- "Pay Remaining Balance" button (if remaining > 0)
- "Fully Paid" confirmation (if remaining === 0)
- Track booking link

**Parameters:**
- `booking`: Full booking object from DB
- `paidAmount`: Amount just paid (from `session.amount_total`)
- `remainingAmount`: `newRemainingAmount` after update

---

## D) Webhook Updates

**File:** `src/app/api/stripe/webhook/route.ts`

### New Logic After Payment Processing

1. **Check email idempotency:**
   ```typescript
   event_type = "email_sent_payment_received"
   event_payload contains { payment_intent_id }
   ```

2. **Send payment received email** (if not already sent)
   - Uses `paymentReceivedCustomer()` template
   - Passes DB values: `total_amount`, `paid_amount`, `remaining_amount`
   - Includes track link with pay button if remaining > 0

3. **Record email sent event:**
   ```typescript
   {
     booking_id: bookingId,
     event_type: "email_sent_payment_received",
     event_payload: {
       payment_intent_id: paymentIntentId,
       email: booking.customer_email,
       amount_paid: paidAmount
     }
   }
   ```

### Idempotency
- Webhook payment recording: Uses `stripe_payment_recorded` + `payment_intent_id`
- Email sending: Uses `email_sent_payment_received` + `payment_intent_id`
- Both checks prevent duplicate processing

---

## E) Security & Validation

### Client-Side
- Payment button shows DB values only
- No amount manipulation possible on frontend

### Server-Side
- All amounts fetched from DB using service role
- `create-checkout-remaining` validates:
  - Booking exists
  - Remaining amount > 0
  - Booking not cancelled
- Webhook verifies signature before processing

### Idempotency
- Payment processing: `stripe_payment_recorded` event
- Payment email: `email_sent_payment_received` event
- Both use `payment_intent_id` for uniqueness

---

## F) User Flow

### Initial Booking
1. Customer selects deposit option (25%/50%/100%)
2. Creates booking → Stripe Checkout for deposit
3. Webhook updates: `paid_amount`, `remaining_amount`
4. Customer receives:
   - "Booking Received" email (showing deposit choice and remaining)
   - "Payment Received" email (showing payment details)

### Paying Remaining Balance
1. Customer visits Track Booking page
2. Enters reference code + email
3. Sees "Pay Remaining Balance (¥X)" button
4. Clicks → Redirected to Stripe Checkout
5. Completes payment
6. Webhook updates: `paid_amount = total_amount`, `remaining_amount = 0`
7. Customer receives "Payment Received" email (fully paid confirmation)

---

## G) Email Content Examples

### Booking Received (50% Deposit)
```
Total Amount: ¥50,000
Selected Payment: 50% (Deposit)
Amount Due Now: ¥25,000
Remaining After Payment: ¥25,000

Note: The remaining balance of ¥25,000 will be due before your travel date.
```

### Payment Received (Deposit)
```
Payment Summary:
Total Amount: ¥50,000
This Payment: ¥25,000
Total Paid: ¥25,000
Remaining Balance: ¥25,000

[Pay Remaining Balance] button
```

### Payment Received (Final Payment)
```
Payment Summary:
Total Amount: ¥50,000
This Payment: ¥25,000
Total Paid: ¥50,000
Status: Fully Paid ✓

All Set! Your booking is fully paid. We look forward to serving you!
```

---

## H) Files Modified

### New Files
- `src/app/api/stripe/create-checkout-remaining/route.ts`

### Modified Files
- `src/components/booking/BookingDetails.tsx` (Payment button + UI)
- `src/lib/email/templates.ts` (Updated bookingReceivedCustomer, added paymentReceivedCustomer)
- `src/app/api/stripe/webhook/route.ts` (Email sending logic)

---

## I) Environment Variables

No new environment variables required. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `STRIPE_SECRET_KEY`
- `BREVO_API_KEY`

---

## J) Testing Checklist

### Initial Booking
- [ ] 25% deposit: Email shows correct amounts
- [ ] 50% deposit: Email shows correct amounts
- [ ] 100% payment: Email shows "Fully Paid"

### Track Page
- [ ] "Pay Remaining" button visible when remaining > 0
- [ ] "Fully Paid" shown when remaining === 0
- [ ] Button disabled for cancelled bookings
- [ ] Clicking button redirects to Stripe

### Remaining Payment
- [ ] Stripe checkout shows correct remaining amount
- [ ] Webhook updates booking correctly
- [ ] Payment email sent with correct details
- [ ] No duplicate emails on webhook retry

### Email Content
- [ ] Booking received shows deposit choice
- [ ] Payment received shows amounts from DB
- [ ] "Pay Remaining" link/button works
- [ ] Final payment shows "Fully Paid"

---

## K) Currency Handling

**Important:** JPY has no minor unit. All amounts are integers representing yen.

```typescript
// ✅ Correct
const amountInYen = 50000;
stripe.checkout.sessions.create({
  unit_amount: amountInYen // 50,000 yen
});

// ❌ Wrong (do NOT divide by 100 for JPY)
const amountInYen = 50000;
stripe.checkout.sessions.create({
  unit_amount: amountInYen / 100 // This would be 500 yen!
});
```

---

## L) Notes

1. **No new dependencies** - Uses existing Stripe, Supabase, Brevo setup
2. **Server-side validation** - All amounts fetched from DB, no client tampering
3. **Idempotency** - Safe webhook retries, no duplicate emails
4. **Responsive UI** - Payment button works on mobile and desktop
5. **Error handling** - Clear error messages, non-blocking email failures
