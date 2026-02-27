# Customer Account System - Quick Reference

## User Flows

### 1. Guest Checkout (No Account)
```
Browse Tours → Add to Cart → Checkout → Pay → Track via Email Link
```
- No login required
- Booking created with `user_id: null`
- Can claim later by creating account

### 2. Customer Checkout (With Account)
```
Sign In → Browse Tours → Add to Cart → Checkout → Pay → View in Account
```
- Booking automatically linked to account
- Immediately visible in `/account`

### 3. Claim Guest Booking
```
Create Account → Account Page → Claim Booking Form → Enter Ref + Email → Claimed
```
- Links past guest bookings to account
- Rate limited: 5 attempts/minute
- Validates reference code + email match

---

## Key URLs

### Customer Facing:
- `/login` - Customer sign in
- `/signup` - Create account
- `/account` - View bookings (or sign-in CTA if logged out)
- `/account/bookings/[id]` - Booking detail page
- `/booking/track` - Track by reference (no login)

### Admin:
- `/admin/login` - Admin sign in
- `/admin` - Admin dashboard

### API:
- `POST /api/bookings/create` - Create booking (service role)
- `POST /api/bookings/claim` - Claim booking (authenticated + rate limited)
- `POST /api/stripe/create-checkout-remaining` - Pay remaining balance

---

## Account Page Features

### When Logged Out:
- Sign-in CTA with benefits list
- "Track Booking" link
- "Sign In" and "Create Account" buttons
- No forced redirect

### When Logged In:
- User email display
- Claim Booking Form (collapsible)
- Bookings List with filters:
  - **All** - All bookings (upcoming first, then past)
  - **Upcoming** - Future travel dates
  - **Past** - Completed travel dates
  - **Unpaid** - Has remaining balance
- Each booking shows:
  - Reference code, travel date, status badges
  - Total/paid/remaining amounts
  - "View Details" button
  - "Pay Remaining" button (if applicable)

---

## Booking Detail Page

### Shows:
- Customer name, reference code
- Status badges (booking + payment)
- Travel date, passengers, suitcases
- Pickup/dropoff locations
- Special requests
- List of items (tours/transfers/packages)
- Payment summary (total/paid/remaining)

### Actions:
- **Track Booking Details** → `/booking/track?bookingId=...`
- **Pay Remaining** → Stripe checkout (if balance > 0)

---

## Security Features

### RLS Policies:
- Bookings: Only users can view their own (`user_id = auth.uid()`)
- No public SELECT or INSERT on bookings
- All inserts via service role API

### Rate Limiting:
- Claim endpoint: 5 attempts per minute per user
- Returns 429 with cooldown time

### Ownership Verification:
- Booking detail page checks `user_id = auth.uid()`
- Returns 404 if unauthorized

---

## Error Messages (Claim Booking)

| Error | Message |
|-------|---------|
| Not found | "Booking not found. Please check your reference code." |
| Email mismatch | "The email you entered doesn't match our records for this booking." |
| Already claimed | "This booking has already been claimed by an account." |
| Rate limited | "Too many attempts. Please wait X seconds." |

---

## Database Schema

### bookings table:
- `user_id` (uuid, nullable) - Links to auth.users
- `null` = guest booking
- Set automatically during checkout if logged in

### Index:
- `idx_bookings_user_id` - For fast user queries

---

## Environment Setup

### Required:
- `NEXT_PUBLIC_SITE_URL` - Production URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (secret)

### Supabase Auth Config:
- Redirect URL: `https://yourdomain.com/auth/callback`
- Site URL: `https://yourdomain.com`
- Email confirmation: Enabled (recommended)

---

## Testing Checklist

- [ ] Guest checkout works (user_id = null)
- [ ] Authenticated checkout links booking (user_id set)
- [ ] Account page shows sign-in CTA when logged out
- [ ] Account page lists bookings when logged in
- [ ] Filters work (All/Upcoming/Past/Unpaid)
- [ ] Sorting correct (upcoming first)
- [ ] Claim booking validates ref + email
- [ ] Claim rate limiting works (5/minute)
- [ ] Booking detail page shows correct data
- [ ] Cannot view other users' bookings (404)
- [ ] Pay remaining button only shows when applicable
- [ ] Admin link only visible to admins

---

## Deployment Steps

1. **Run Database Migration:**
   ```sql
   -- File: docs/sql/009_customer_accounts.sql
   ALTER TABLE public.bookings ADD COLUMN user_id uuid ...
   CREATE INDEX idx_bookings_user_id ...
   CREATE POLICY "Users can view own bookings" ...
   ```

2. **Verify Environment Variables:**
   - Set production URLs in `.env.production`
   - Verify Supabase keys

3. **Configure Supabase Auth:**
   - Add redirect URLs
   - Enable email confirmation

4. **Build and Deploy:**
   ```bash
   npm run build
   npm start
   ```

5. **Verify Routes:**
   - `/account` - Shows sign-in CTA
   - `/login` - Customer login page
   - `/admin/login` - Admin login page
   - `/signup` - Signup page

---

## Support

### Common Issues:

**Q: "I can't see my past bookings in my account"**
A: Use the "Claim Booking" form with your reference code and email.

**Q: "Too many attempts" error**
A: Wait 60 seconds before trying again.

**Q: "Booking not found"**
A: Verify reference code is correct (case-sensitive).

**Q: "Email doesn't match"**
A: Use the exact email you provided during checkout.

---

Date: February 10, 2026
Version: 1.0
