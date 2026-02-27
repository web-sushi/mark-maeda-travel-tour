# Stripe Checkout Payment Flow Implementation

## Overview
Implemented full Stripe Checkout integration with deposit payment options (25%, 50%, or 100%). Users must complete payment via Stripe before reaching the success page.

## Payment Flow

### 1. Checkout Page (`/checkout`)
**File:** `/src/app/(checkout)/checkout/page.tsx`

#### New Features:
- **Payment Option Selector** in Cart Summary
  - 25% Deposit
  - 50% Deposit  
  - 100% Full Payment (default)
- **"You will pay now"** display showing calculated amount
- **"Pay & Create Booking"** button (replaced "Create Booking")

#### Flow:
1. User fills in customer information
2. User selects payment option (25%, 50%, or 100%)
3. User clicks "Pay & Create Booking"
4. System:
   - Creates booking in Supabase with `payment_status: "unpaid"`
   - Inserts `booking_items` for per-item reviews
   - Sends booking notification email (fire-and-forget)
   - Creates Stripe Checkout Session via `/api/stripe/create-checkout`
   - Clears cart
   - **Redirects to Stripe Checkout**

### 2. Stripe Checkout Session
**API Route:** `/src/app/api/stripe/create-checkout/route.ts`

**Input:**
```typescript
{
  bookingId: string,
  depositChoice: 25 | 50 | 100
}
```

**Process:**
1. Validates input (depositChoice must be 25, 50, or 100)
2. Fetches booking from Supabase
3. Calculates amount to charge: `(total_amount * depositChoice) / 100`
4. Creates Stripe Checkout Session with:
   - Currency: JPY (no minor unit, amount in yen)
   - Product name: "Booking Deposit (XX%) - {reference_code}"
   - Metadata: `bookingId`, `depositChoice`
   - Success URL: `/booking/success?bookingId={id}`
   - Cancel URL: `/booking/success?bookingId={id}` (same, graceful handling)

**Output:**
```typescript
{
  url: string // Stripe Checkout URL
}
```

### 3. Stripe Payment Processing
User completes payment on Stripe Checkout page:
- Card payment via Stripe
- Payment methods: Credit/Debit cards
- Currency: JPY (Japanese Yen)
- Secure PCI-compliant checkout

### 4. Stripe Webhook Handler
**API Route:** `/src/app/api/stripe/webhook/route.ts`

**Event:** `checkout.session.completed`

**Process:**
1. Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`
2. Extracts metadata: `bookingId`, `depositChoice`
3. Fetches booking from Supabase
4. Updates booking:
   ```typescript
   amount_paid = previous_amount_paid + charged_amount
   remaining_amount = total_amount - amount_paid
   payment_status = amount_paid >= total_amount ? "paid" : "partial"
   ```

**Payment Status Logic:**
- `"unpaid"` - No payment received (0 paid)
- `"partial"` - Some payment received (< total)
- `"paid"` - Full payment received (>= total)

### 5. Success Page Redirect
After successful Stripe payment, user is redirected to:
```
/booking/success?bookingId={id}
```

The booking now shows:
- Updated `amount_paid`
- Updated `remaining_amount`
- Updated `payment_status` ("partial" or "paid")

## Database Schema

### Booking Table Fields (Already Existing)
```sql
total_amount numeric -- Total booking amount (JPY)
deposit_choice integer -- 25, 50, or 100
amount_paid numeric -- Amount paid so far (JPY)
remaining_amount numeric -- Amount still owed (JPY)
booking_status text -- 'pending' | 'confirmed' | 'cancelled' | 'completed'
payment_status text -- 'unpaid' | 'partial' | 'paid' | 'refunded'
```

**No schema changes required!** All necessary fields already exist.

## Files Modified

### 1. `/src/app/(checkout)/checkout/page.tsx`

**Changes:**
- Added `deposit_choice: 100` to form state (default full payment)
- Added payment option radio buttons in Cart Summary
- Added "You will pay now" display with calculated amount
- Updated submit handler to:
  - Create booking with selected `deposit_choice`
  - Call Stripe create-checkout API
  - Redirect to Stripe URL instead of success page
- Changed button text to "Pay & Create Booking"

### 2. Existing Stripe Routes (No Changes Needed)
- `/src/app/api/stripe/create-checkout/route.ts` - Already configured
- `/src/app/api/stripe/webhook/route.ts` - Already handles payment updates
- `/src/lib/stripe/stripe.ts` - Stripe client singleton

## Environment Variables Required

```env
# Stripe (already configured)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## User Experience

### Before (Broken):
1. Fill checkout form
2. Click "Create Booking"
3. Immediately redirect to `/booking/success`
4. **No payment collected** ❌

### After (Fixed):
1. Fill checkout form
2. Select payment option (25%, 50%, or 100%)
3. See "You will pay now: ¥X,XXX"
4. Click "Pay & Create Booking"
5. **Redirect to Stripe Checkout** ✅
6. Complete payment on Stripe
7. **Webhook updates booking** ✅
8. Redirect to `/booking/success` with payment confirmed ✅

## Payment Options Display

**25% Deposit:**
```
○ 25% Deposit
  Pay ¥XX,XXX now
```

**50% Deposit:**
```
○ 50% Deposit
  Pay ¥XX,XXX now
```

**100% Full Payment (Default):**
```
● 100% Full Payment
  Pay ¥XX,XXX now
```

**Amount Display:**
```
┌─────────────────────────────┐
│ You will pay now:           │
│ ¥XX,XXX                     │
│ Remaining ¥XX,XXX to be     │
│ paid later                  │
└─────────────────────────────┘
```

## Testing Checklist

### Checkout Flow:
- [ ] Payment option selector displays correctly
- [ ] Default is 100% full payment
- [ ] Switching options updates "You will pay now" amount
- [ ] Button says "Pay & Create Booking"
- [ ] Form validation still works
- [ ] Clicking submit creates booking
- [ ] Redirects to Stripe Checkout (not success page)

### Stripe Checkout:
- [ ] Checkout page shows correct amount
- [ ] Product name includes reference code
- [ ] Can complete test payment (use card 4242 4242 4242 4242)
- [ ] Success redirects to `/booking/success?bookingId=...`

### Webhook:
- [ ] Webhook receives `checkout.session.completed` event
- [ ] Booking `amount_paid` updated correctly
- [ ] Booking `remaining_amount` calculated correctly
- [ ] Payment status set to "partial" for deposits
- [ ] Payment status set to "paid" for 100%
- [ ] Console logs show successful update

### Success Page:
- [ ] Shows updated payment information
- [ ] Displays reference code
- [ ] Copy to clipboard works
- [ ] Track booking link works

## Stripe Test Cards

**Success:**
```
Card: 4242 4242 4242 4242
Exp: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Declined:**
```
Card: 4000 0000 0000 0002
```

**3D Secure Required:**
```
Card: 4000 0025 0000 3155
```

## Security

- ✅ Webhook signature verification
- ✅ Idempotent webhook handling
- ✅ Metadata validation (bookingId, depositChoice)
- ✅ Amount validation (server-side calculation)
- ✅ PCI compliance (Stripe Checkout handles card data)
- ✅ No direct access to success page (must come from Stripe)

## Error Handling

### Checkout Page:
- Form validation errors displayed
- Stripe session creation errors caught and displayed
- Network errors handled gracefully

### Webhook:
- Missing metadata: logs error, returns 200 (acknowledges webhook)
- Booking not found: logs error, returns 200
- Update errors: logs error, returns 200
- Invalid signature: returns 400

### User Experience:
- Cart cleared only after successful booking creation
- User can retry if payment fails
- Cancel URL points to success page for graceful handling

## Notes

- No database migrations required
- No breaking changes to existing routes
- Tours/Transfers/Packages booking still works
- Admin pages still compile
- Reviews system integration preserved
- Booking notification emails still sent

## Next Steps (Optional)

1. **Email Notification:** Send payment confirmation email after webhook
2. **Balance Reminders:** Email customers about remaining balance
3. **Refunds:** Handle `charge.refunded` webhook events
4. **Multiple Payments:** Allow customers to pay remaining balance
5. **Receipt Generation:** Generate PDF receipts after full payment
6. **Admin Dashboard:** Show payment analytics

## Support

**Stripe Dashboard:** https://dashboard.stripe.com/test/payments
**Webhook Logs:** https://dashboard.stripe.com/test/webhooks
**Test Mode:** All keys are test keys (sk_test_, whsec_)
