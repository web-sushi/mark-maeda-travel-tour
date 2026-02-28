# Stripe Checkout API Error Handling Enhancement

## Summary

Enhanced error handling and logging for Stripe Checkout API routes with detailed error messages displayed to users and comprehensive server-side logging for debugging payment issues.

---

## Changes Made

### 1. API Routes Updated

#### `/api/stripe/create-checkout` (Initial Deposit Payment)

**Enhanced Error Handling:**
- ✅ Stripe-specific error handling with `Stripe.errors.StripeError`
- ✅ Detailed error response structure with `message`, `type`, `code`, `raw` fields
- ✅ User-friendly error messages (no technical jargon)
- ✅ Safe logging (no secret keys exposed)

**Enhanced Logging:**
```typescript
console.log("[Stripe create-checkout] Creating Stripe session:", {
  mode: stripeMode,              // "test" or "live"
  amount: amountToCharge,        // Amount in JPY
  currency: "jpy",
  depositChoice: "50%",
  referenceCode: booking.reference_code,
  payment_method_types: ["card"],
  success_url: successUrl,       // Full URL logged
  cancel_url: cancelUrl,         // Full URL logged
  metadata: {
    booking_id: booking.id,
    pay_type: "deposit",
    pay_percent: depositChoice,
  },
});
```

**Error Response Structure:**
```typescript
{
  ok: false,
  error: "stripe_error",                    // Error type
  message: "Card declined",                 // User-friendly message
  type: "card_error",                       // Stripe error type
  code: "card_declined",                    // Stripe error code
  raw: {
    statusCode: 402,
    requestId: "req_abc123"                 // Stripe request ID
  }
}
```

#### `/api/stripe/create-checkout-remaining` (Remaining Balance Payment)

**Same enhancements as above, plus:**
- ✅ Validates booking status (not cancelled)
- ✅ Validates remaining amount > 0
- ✅ Logs access token presence (`hasToken: true/false`)

---

### 2. Client-Side Error Display

#### Updated Components:

**`/checkout/page.tsx` (Main Checkout)**

**Before:**
```typescript
if (!stripeResponse.ok || !stripeData.ok) {
  throw new Error(stripeData.error || "Failed to create payment session");
}
```

**After:**
```typescript
if (!stripeResponse.ok || !stripeData.ok) {
  // Display the detailed error message from the API
  const errorMessage = stripeData.message || stripeData.error || "Failed to create payment session";
  console.error("[checkout] Stripe checkout error:", {
    status: stripeResponse.status,
    error: stripeData.error,
    message: stripeData.message,
    type: stripeData.type,
    code: stripeData.code,
  });
  throw new Error(errorMessage);
}
```

**Error Display:**
```tsx
{error && (
  <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
    {error}  {/* Now shows user-friendly message from API */}
  </div>
)}
```

**`BookingDetails.tsx` (Remaining Balance Payment)**

**Updated `handlePayRemaining()`:**
```typescript
const data = await response.json();

if (!response.ok || !data.ok) {
  const errorMessage = data.message || data.error || "Failed to create payment session";
  console.error("[BookingDetails] Payment error:", {
    status: response.status,
    error: data.error,
    message: data.message,
    type: data.type,
    code: data.code,
  });
  throw new Error(errorMessage);
}
```

**`BookingCard.tsx` (Account Page)**

**Same pattern as BookingDetails:**
```typescript
const data = await response.json();

if (!response.ok || !data.ok) {
  const errorMessage = data.message || data.error || "Failed to create payment session";
  console.error("[BookingCard] Payment error:", {
    status: response.status,
    error: data.error,
    message: data.message,
    type: data.type,
    code: data.code,
  });
  throw new Error(errorMessage);
}
```

---

## 3. Error Message Examples

### User-Facing Error Messages (API)

| Error Type | User Message |
|-----------|--------------|
| **Missing booking ID** | `"Booking ID is required"` |
| **Missing token** | `"Public view token is required"` |
| **Invalid deposit** | `"Deposit choice must be 25%, 50%, or 100%"` |
| **Booking not found** | `"Booking not found. Please verify your booking reference."` |
| **No balance** | `"No remaining balance to pay. Your booking is already paid in full."` |
| **Booking cancelled** | `"Cannot process payment for a cancelled booking."` |
| **Stripe card error** | `"Your card was declined. Please try a different payment method."` (from Stripe) |
| **Stripe API error** | `"Payment processing error. Please try again."` (from Stripe) |
| **Generic error** | `"Failed to create payment session. Please try again or contact support."` |

### Console Logs (Server-Side)

**Successful Session Creation:**
```
[Stripe create-checkout] Request received: { bookingId: 'xxx', hasToken: true, depositChoice: 50 }
[Stripe create-checkout] Fetching booking: xxx
[Stripe create-checkout] Booking found: { bookingId: 'xxx', referenceCode: 'MB-2026-001', totalAmount: 100000, customerEmail: 'customer@example.com' }
[Stripe create-checkout] Creating Stripe session: {
  mode: 'test',
  amount: 50000,
  currency: 'jpy',
  depositChoice: '50%',
  referenceCode: 'MB-2026-001',
  payment_method_types: ['card'],
  success_url: 'https://example.com/booking/success?bookingId=xxx&t=token123',
  cancel_url: 'https://example.com/booking/success?bookingId=xxx&t=token123',
  metadata: { booking_id: 'xxx', pay_type: 'deposit', pay_percent: 50 }
}
[Stripe create-checkout] ✅ Session created successfully: {
  sessionId: 'cs_test_abc123',
  bookingId: 'xxx',
  depositChoice: 50,
  amount: 50000,
  url: 'https://checkout.stripe.com/...',
  mode: 'test'
}
```

**Failed Session Creation (Stripe Error):**
```
[Stripe create-checkout] Request received: { bookingId: 'xxx', hasToken: true, depositChoice: 50 }
[Stripe create-checkout] Fetching booking: xxx
[Stripe create-checkout] Booking found: { bookingId: 'xxx', referenceCode: 'MB-2026-001', totalAmount: 100000, customerEmail: 'customer@example.com' }
[Stripe create-checkout] Creating Stripe session: { ... }
[Stripe create-checkout] ❌ Error: StripeInvalidRequestError: Invalid currency: usd
[Stripe create-checkout] Stripe error details: {
  type: 'StripeInvalidRequestError',
  code: 'invalid_currency',
  message: 'Invalid currency: usd',
  statusCode: 400,
  requestId: 'req_abc123'
}
```

**Failed Session Creation (Generic Error):**
```
[Stripe create-checkout] Request received: { bookingId: 'xxx', hasToken: true, depositChoice: 50 }
[Stripe create-checkout] Fetching booking: xxx
[Stripe create-checkout] ❌ Error: TypeError: Cannot read property 'total_amount' of undefined
[Stripe create-checkout] Generic error: {
  message: "Cannot read property 'total_amount' of undefined",
  stack: '...'
}
```

---

## 4. Stripe Environment Detection

Both API routes now detect and log the Stripe environment mode:

```typescript
const stripeMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "live" : "test";
```

**Logged in every session creation:**
```typescript
console.log("[Stripe create-checkout] Creating Stripe session:", {
  mode: stripeMode,  // "test" or "live"
  // ...
});

console.log("[Stripe create-checkout] ✅ Session created successfully:", {
  mode: stripeMode,  // "test" or "live"
  // ...
});
```

**Benefits:**
- ✅ Instantly see if test or live mode in logs
- ✅ Helps debug environment-specific issues
- ✅ Prevents confusion between test/live transactions

---

## 5. Metadata Logging

**Logged for every session:**
```typescript
{
  metadata: {
    booking_id: booking.id,
    pay_type: "deposit" | "remaining",
    pay_percent: 50  // Only for deposit
  }
}
```

**Why this matters:**
- Webhook handlers use this metadata to identify bookings
- Essential for debugging payment webhook issues
- Confirms metadata is set correctly before session creation

---

## 6. URL Logging

**Logged for every session:**
```typescript
{
  success_url: "https://example.com/booking/success?bookingId=xxx&t=token123",
  cancel_url: "https://example.com/booking/success?bookingId=xxx&t=token123"
}
```

**Why this matters:**
- Verifies access token (`t` param) is included
- Confirms correct redirect URLs
- Helps debug "Booking Not Found" issues after payment

---

## 7. Safe Logging Practices

### ✅ What IS Logged:
- Booking IDs (UUIDs)
- Reference codes (e.g., `MB-2026-001`)
- Amounts (JPY)
- URLs (success/cancel)
- Metadata
- Error messages
- Stripe request IDs
- Environment mode (test/live)

### ❌ What IS NOT Logged:
- Stripe API keys
- Customer credit card numbers
- Customer passwords
- Sensitive customer data (only name/email in booking context)

### Example of Safe Logging:
```typescript
// ✅ SAFE
console.log("[Stripe create-checkout] Creating Stripe session:", {
  mode: stripeMode,
  amount: amountToCharge,
  referenceCode: booking.reference_code,
});

// ❌ UNSAFE (Never do this)
console.log("Stripe key:", process.env.STRIPE_SECRET_KEY);
console.log("Card number:", cardNumber);
```

---

## 8. Client-Side Error Logging

All client components now log errors before displaying them:

```typescript
console.error("[checkout] Stripe checkout error:", {
  status: stripeResponse.status,
  error: stripeData.error,
  message: stripeData.message,
  type: stripeData.type,
  code: stripeData.code,
});
```

**Benefits:**
- ✅ Easier to debug payment failures in browser console
- ✅ See exact error from API without guessing
- ✅ Correlate with server logs using timing

---

## 9. Error Response Format

### Standard Error Response Structure:

```typescript
{
  ok: false,
  error: string,        // Machine-readable error code
  message: string,      // User-friendly error message
  type?: string,        // Stripe error type (optional)
  code?: string,        // Stripe error code (optional)
  raw?: {               // Additional debug info (optional)
    statusCode?: number,
    requestId?: string,
    details?: string
  }
}
```

### Example Responses:

**Stripe Card Declined:**
```json
{
  "ok": false,
  "error": "stripe_error",
  "message": "Your card was declined",
  "type": "card_error",
  "code": "card_declined",
  "raw": {
    "statusCode": 402,
    "requestId": "req_abc123"
  }
}
```

**Invalid Amount:**
```json
{
  "ok": false,
  "error": "invalid_amount",
  "message": "Invalid deposit amount calculated. Please contact support."
}
```

**Booking Not Found:**
```json
{
  "ok": false,
  "error": "booking_not_found",
  "message": "Booking not found. Please verify your booking reference."
}
```

**Generic Error:**
```json
{
  "ok": false,
  "error": "checkout_creation_failed",
  "message": "Failed to create payment session. Please try again or contact support.",
  "raw": {
    "details": "Cannot read property 'total_amount' of undefined"
  }
}
```

---

## 10. Testing Checklist

### Test Successful Payment Flow
- [ ] Create booking with 50% deposit
- [ ] Verify logs show correct amount, URLs, metadata
- [ ] Verify Stripe session created successfully
- [ ] Complete payment in Stripe
- [ ] Verify redirect to success page

### Test Error Scenarios

#### Missing Parameters
- [ ] Call API without `bookingId` → Should return `"Booking ID is required"`
- [ ] Call API without `publicViewToken` → Should return `"Public view token is required"`
- [ ] Call API with invalid `depositChoice` → Should return `"Deposit choice must be 25%, 50%, or 100%"`

#### Invalid Booking
- [ ] Call API with non-existent booking ID → Should return `"Booking not found..."`
- [ ] Call remaining balance API for cancelled booking → Should return `"Cannot process payment for a cancelled booking"`
- [ ] Call remaining balance API when already fully paid → Should return `"No remaining balance to pay..."`

#### Stripe Errors (Use Stripe Test Cards)
- [ ] Use test card `4000000000000002` (declined) → Should return Stripe error message
- [ ] Use invalid currency in code → Should return Stripe error message
- [ ] Verify all errors display in UI (not just console)

### Test Logging
- [ ] Check server logs show all required fields (mode, amount, URLs, metadata)
- [ ] Verify no secret keys logged
- [ ] Verify client console shows error details
- [ ] Verify server console shows Stripe error details

---

## 11. Files Changed

1. **`src/app/api/stripe/create-checkout/route.ts`** ✅
   - Added `Stripe` import for error types
   - Enhanced error handling with Stripe-specific errors
   - Added comprehensive logging
   - User-friendly error messages

2. **`src/app/api/stripe/create-checkout-remaining/route.ts`** ✅
   - Added `Stripe` import for error types
   - Enhanced error handling with Stripe-specific errors
   - Added comprehensive logging
   - User-friendly error messages

3. **`src/app/(checkout)/checkout/page.tsx`** ✅
   - Updated error handling to use `data.message`
   - Added console logging for errors
   - Better error display to users

4. **`src/components/booking/BookingDetails.tsx`** ✅
   - Updated `handlePayRemaining()` error handling
   - Added console logging for errors
   - Better error display to users

5. **`src/components/account/BookingCard.tsx`** ✅
   - Updated `handlePayRemaining()` error handling
   - Added console logging for errors
   - Better error display to users

---

## 12. Build Status

✅ **Build successful:** `npm run build` passed with no errors
✅ **TypeScript:** No type errors
✅ **All routes compiled:** 35/35 pages generated

---

## 13. Benefits

### Before:
- ❌ Generic "Failed to create checkout session" errors
- ❌ Minimal server logging
- ❌ Stripe errors not properly handled
- ❌ No environment mode logging
- ❌ No URL/metadata verification in logs
- ❌ Users see technical error messages

### After:
- ✅ User-friendly error messages
- ✅ Detailed server logs for debugging
- ✅ Stripe-specific error handling
- ✅ Environment mode logged (test/live)
- ✅ URLs and metadata verified in logs
- ✅ Safe logging (no secrets exposed)
- ✅ Client-side error logging
- ✅ Structured error responses

---

## 14. Production Monitoring

### Recommended Log Monitoring

**Monitor for these log patterns in production:**

```bash
# Successful sessions
grep "✅ Session created successfully" logs.txt

# Failed sessions (Stripe errors)
grep "Stripe error details" logs.txt

# Failed sessions (Generic errors)
grep "Generic error" logs.txt

# Environment mode (ensure correct mode in prod)
grep "mode: 'live'" logs.txt  # Should be 'live' in production
grep "mode: 'test'" logs.txt  # Should NOT appear in production
```

### Alert Conditions

**Set up alerts for:**
- High rate of `stripe_error` responses
- Any `mode: 'test'` in production logs
- `checkout_creation_failed` errors
- Missing `booking_id` in metadata logs

---

## 15. Debugging Guide

### If Payment Fails:

1. **Check User Error Message:**
   - User sees user-friendly message from `data.message`

2. **Check Browser Console:**
   - Look for `[checkout]`, `[BookingDetails]`, or `[BookingCard]` logs
   - See `error`, `message`, `type`, `code` from API

3. **Check Server Logs:**
   - Look for `[Stripe create-checkout]` or `[Stripe create-checkout-remaining]` logs
   - See full request details, Stripe session params, error details

4. **Check Stripe Dashboard:**
   - Use `requestId` from error logs to find request in Stripe
   - See Stripe's error message and details

5. **Verify Configuration:**
   - Check `mode` in logs (should be `live` in production)
   - Verify `success_url` and `cancel_url` are correct
   - Verify `metadata.booking_id` is present

---

## 16. Next Steps

1. Deploy to production
2. Monitor logs for first few transactions
3. Test with real payment methods (not test cards)
4. Verify error messages are user-friendly
5. Set up log monitoring/alerts
6. Document any production-specific issues
