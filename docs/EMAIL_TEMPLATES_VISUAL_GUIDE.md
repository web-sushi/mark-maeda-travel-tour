# New Email Templates - Quick Reference

## 1. Payment Pending - Customer

**Subject:** `Payment Pending - Booking Reserved {reference_code}`

**Trigger:** `checkout.session.completed` with `payment_status === "unpaid"`

**Visual Design:**
```
┌─────────────────────────────────────────┐
│  ⚠️  Payment Pending - Booking Reserved │  (Orange header)
├─────────────────────────────────────────┤
│                                         │
│  Dear {customer_name},                  │
│                                         │
│  Your reservation has been created and  │
│  is waiting for payment confirmation.   │
│                                         │
│  Reference Code: {reference_code}       │
│  Travel Date: {date}                    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ⏳ Payment Pending                │ │ (Amber warning box)
│  │ Payment Method: Konbini           │ │
│  │ Amount: ¥50,000                   │ │
│  │ Please complete your payment.     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  What Happens Next?                     │
│  • Your booking is reserved             │
│  • Complete payment at convenience store│
│  • We'll confirm once payment received  │
│  • You'll get confirmation email        │
│                                         │
│  [Track your booking status →]          │
│                                         │
└─────────────────────────────────────────┘
```

**Key Elements:**
- Orange/amber color scheme (pending/warning)
- Clear payment method display
- Step-by-step next actions
- Link to tracking page

---

## 2. Payment Pending - Admin

**Subject:** `Payment Pending - {reference_code} (konbini)`

**Trigger:** `checkout.session.completed` with `payment_status === "unpaid"`

**Visual Design:**
```
┌─────────────────────────────────────────┐
│  ⚠️  Payment Pending                    │  (Orange header)
├─────────────────────────────────────────┤
│                                         │
│  Booking awaiting payment confirmation  │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Reference Code: {reference}       │ │ (Amber box)
│  │ Payment Method: Konbini           │ │
│  │ Amount Pending: ¥50,000           │ │
│  │ Status: Awaiting payment          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Customer:                              │
│  • Name: {customer_name}                │
│  • Email: {customer_email}              │
│  • Phone: {customer_phone}              │
│                                         │
│  Travel Details:                        │
│  • Date: {date}                         │
│  • Pickup: {pickup}                     │
│  • Dropoff: {dropoff}                   │
│                                         │
│  [View in Admin →]                      │
│                                         │
└─────────────────────────────────────────┘
```

**Key Elements:**
- Compact admin-focused layout
- All essential customer info
- Travel details summary
- Direct link to admin panel

---

## 3. Payment Failed - Customer

**Subject:** `Payment Failed - Action Required {reference_code}`

**Trigger:** `checkout.session.async_payment_failed`

**Visual Design:**
```
┌─────────────────────────────────────────┐
│  ❌ Payment Failed - Action Required    │  (Red header)
├─────────────────────────────────────────┤
│                                         │
│  Dear {customer_name},                  │
│                                         │
│  We were unable to complete your        │
│  payment for booking {reference_code}.  │
│                                         │
│  Reference Code: {reference_code}       │
│  Travel Date: {date}                    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ❌ Payment Failed                 │ │ (Red error box)
│  │ Payment Method: Konbini           │ │
│  │ Amount: ¥50,000                   │ │
│  │ Your payment may have expired or  │ │
│  │ was not completed in time.        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  📌 What to Do Next:                   │
│  • Your booking is still reserved       │
│  • Retry payment using link below       │
│  • Choose different payment method      │
│  • Contact us if you need help          │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      [Retry Payment →]            │ │ (Big red CTA button)
│  └───────────────────────────────────┘ │
│                                         │
│  Click button to complete payment with  │
│  a new payment method.                  │
│                                         │
└─────────────────────────────────────────┘
```

**Key Elements:**
- Red color scheme (error/urgent)
- Clear explanation of what happened
- Prominent "Retry Payment" CTA button
- Reassurance booking is still reserved
- Link to tracking page for retry

---

## 4. Payment Failed - Admin

**Subject:** `Payment Failed - {reference_code} (konbini)`

**Trigger:** `checkout.session.async_payment_failed`

**Visual Design:**
```
┌─────────────────────────────────────────┐
│  ❌ Payment Failed                      │  (Red header)
├─────────────────────────────────────────┤
│                                         │
│  Customer payment failed -              │
│  follow up required                     │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Reference Code: {reference}       │ │ (Red error box)
│  │ Payment Method: Konbini           │ │
│  │ Failed Amount: ¥50,000            │ │
│  │ Status: Payment Failed            │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Customer:                              │
│  • Name: {customer_name}                │
│  • Email: {customer_email}              │
│  • Phone: {customer_phone}              │
│                                         │
│  Travel Details:                        │
│  • Date: {date}                         │
│  • Pickup: {pickup}                     │
│  • Dropoff: {dropoff}                   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ⚠️ Action Required:               │ │ (Amber box)
│  │ Customer notified and prompted to │ │
│  │ retry payment. Consider follow up │ │
│  │ if no action taken.               │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [View in Admin →]                      │
│                                         │
└─────────────────────────────────────────┘
```

**Key Elements:**
- Red header for urgency
- "Follow up required" message
- All customer contact info
- Action required reminder
- Direct link to admin panel

---

## Email Color Scheme

| Status | Header Color | Box Color | Use Case |
|--------|-------------|-----------|----------|
| **Pending** | 🟠 Orange (`#f59e0b`) | Amber (`#fef3c7`) | Payment awaiting completion |
| **Failed** | 🔴 Red (`#dc2626`) | Light Red (`#fee2e2`) | Payment error/expired |
| **Received** | 🟢 Green (`#10b981`) | Light Green (`#d1fae5`) | Payment successful (existing) |
| **Info** | 🔵 Blue (`#2563eb`) | Light Blue (`#eff6ff`) | What happens next boxes |

---

## Sample Email Flows

### Konbini Payment Success Flow
1. ✉️ **Checkout completed:** "Payment Pending - Booking Reserved" (Customer + Admin)
2. *(Customer pays at konbini)*
3. ✉️ **Payment succeeded:** "Payment Received" (Customer + Admin)

### Konbini Payment Failure Flow
1. ✉️ **Checkout completed:** "Payment Pending - Booking Reserved" (Customer + Admin)
2. *(Payment window expires)*
3. ✉️ **Payment failed:** "Payment Failed - Action Required" (Customer + Admin)
4. *(Customer clicks "Retry Payment")*
5. *(Creates new checkout session)*
6. ✉️ Flow repeats from step 1

### Card Payment Flow (No Change)
1. ✉️ **Checkout completed:** "Payment Received" (Customer + Admin)
2. *(Immediate payment, no pending state)*

---

## Testing Email Templates

### Manual Brevo Test
```typescript
// In Next.js API route or test script
import { sendBrevoEmail } from "@/lib/email/brevo";
import { paymentPendingCustomer } from "@/lib/email/templates";

const mockBooking = {
  reference_code: "TEST-001",
  customer_name: "John Doe",
  customer_email: "test@example.com",
  travel_date: new Date().toISOString(),
  total_amount: 100000,
  // ... other fields
};

const email = paymentPendingCustomer(mockBooking, 50000, "konbini");

await sendBrevoEmail({
  to: "test@example.com",
  subject: email.subject,
  html: email.html,
  text: email.text,
});
```

### Stripe Webhook Test Events
Use Stripe CLI to trigger events:
```bash
# Test pending payment
stripe trigger checkout.session.completed --add payment_status=unpaid

# Test failed payment
stripe trigger checkout.session.async_payment_failed

# Test successful delayed payment
stripe trigger checkout.session.async_payment_succeeded
```

---

## Browser Preview

All emails are responsive and tested on:
- ✅ Gmail (Desktop + Mobile)
- ✅ Outlook (Desktop)
- ✅ Apple Mail (Desktop + iOS)
- ✅ Yahoo Mail
- ✅ Mobile browsers (Chrome, Safari)

**Width constraints:**
- Max width: 600px
- Padding: 20px
- Rounded corners: 8px
- Button padding: 12px 30px
- Font: Arial, sans-serif

---

## Accessibility

All templates include:
- ✅ Semantic HTML structure
- ✅ Alt text for icons (emoji used as text)
- ✅ High contrast text (WCAG AA compliant)
- ✅ Plain text version for email clients that don't support HTML
- ✅ Descriptive link text ("Track your booking" not "Click here")
- ✅ Proper heading hierarchy (h1, h2, h3)
