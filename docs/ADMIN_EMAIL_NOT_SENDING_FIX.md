# Admin Email Not Sending - Diagnosis & Fix

## ✅ GOOD NEWS: Code is Already Implemented!

The admin email sending logic **is already in place** in `src/app/api/notify/booking-created/route.ts` (lines 259-281). The email includes full itemized booking details per item.

---

## ❌ THE PROBLEM: Environment Variable Name Mismatch

**You set in Vercel:** `ADMIN_NOTIFY_EMAIL`  
**Code reads:** `ADMIN_EMAIL` (line 169)

**Result:** Code can't find the admin email → `finalAdminEmail = null` → admin email skipped

---

## 🔧 SOLUTION: Update Your Vercel Environment Variables

### Option 1: Rename Environment Variable (Recommended)

**In Vercel Dashboard:**
1. Go to your project → Settings → Environment Variables
2. **Delete:** `ADMIN_NOTIFY_EMAIL`
3. **Add:** `ADMIN_EMAIL` with your gmail address
4. Redeploy

### Option 2: Use App Settings (Alternative)

**In your app's Admin Settings UI (`/admin/settings`):**
1. Set "Admin Notification Email" field to your gmail
2. Save
3. This takes priority over environment variables

---

## 📋 Current Admin Email Resolution Logic

**Priority order (lines 162-170):**
```typescript
1. app_settings.admin_notification_email  (database)
2. app_settings.admin_notify_email       (database, deprecated)
3. process.env.ADMIN_EMAIL               (environment variable)
```

**NOT USED:** `process.env.ADMIN_NOTIFY_EMAIL` ❌

---

## 🧪 How to Test

### Test 1: Verify Logs After Next Booking

After creating a booking, check Vercel logs for:

```
[booking-created] Email configuration: {
  customerEmail: 'customer@example.com',
  adminEmail: 'YOUR_GMAIL@gmail.com',    ← Should show your email
  emailFrom: 'noreply@markmaeda.com'
}

[booking-created] Final admin recipient: YOUR_GMAIL@gmail.com  ← Should show your email

[booking-created] Sending admin email to: YOUR_GMAIL@gmail.com

[booking-created] ✅ Admin email sent successfully to: YOUR_GMAIL@gmail.com
```

**If you see:**
```
[booking-created] Final admin recipient: (none)
[booking-created] ⚠️  No admin email configured (skipping admin notification)
```
→ The environment variable is still not set correctly.

### Test 2: Check Brevo Dashboard

1. Log in to Brevo
2. Go to Transactional → Logs
3. Look for email with:
   - **To:** YOUR_GMAIL@gmail.com
   - **Subject:** `New Booking Received - <reference_code>`
   - **Status:** Sent / Delivered

### Test 3: Self-Send Safeguard

**Scenario:** If `EMAIL_FROM` === admin email (same address)

**Expected logs:**
```
[booking-created] ⚠️  Admin email equals FROM email, using fallback: {
  original: 'same@example.com',
  fallback: 'fallback@example.com'
}
```

If no valid fallback:
```
[booking-created] ❌ Admin email equals FROM email and no valid fallback available
[booking-created] Final admin recipient: (none)
```

---

## 📧 Admin Email Template Content

The admin email includes **itemized booking details**:

```
Subject: New Booking Received - MB-2026-001

Customer:
- Name: John Doe
- Email: customer@example.com
- Phone: +81-XXX-XXXX

Travel Details:
- Date(s): March 15 - March 18, 2026

Booking Items:
┌─[TRANSFER] Narita → Tokyo ────────┐
│ Date: March 15, 2026              │
│ Narita Terminal 1 → Shinjuku     │
│ Passengers: 2                     │
│ Suitcases: 4                      │
│ Subtotal: ¥25,000                 │
└───────────────────────────────────┘

┌─[TOUR] Kyoto Day Tour ────────────┐
│ Date: March 16, 2026              │
│ Kyoto → Nara                      │
│ Passengers: 2                     │
│ Subtotal: ¥45,000                 │
└───────────────────────────────────┘

Financial:
- Total: ¥100,000
- Paid: ¥50,000
- Remaining: ¥50,000
```

This template is already implemented in `src/lib/email/templates.ts` → `bookingReceivedAdmin()` function.

---

## 🛡️ Error Handling (Already Implemented)

**Customer email failure (lines 251-254):**
```typescript
catch (error) {
  console.error("[booking-created] Customer email failed:", error);
  emailError = true;
  // Does NOT crash booking creation ✅
}
```

**Admin email failure (lines 272-275):**
```typescript
catch (error) {
  console.error("[booking-created] ❌ Admin email failed:", error);
  emailError = true;
  // Does NOT crash booking creation ✅
}
```

**Both failures are logged but don't prevent booking from being created.**

---

## 🔍 Debugging Checklist

### If admin email still doesn't send after fixing env var:

**1. Check Vercel logs for these lines:**
```bash
# Search for:
[booking-created] Email configuration
[booking-created] Final admin recipient
[booking-created] Sending admin email to
```

**2. Check if email toggle is disabled:**
- Go to `/admin/settings`
- Scroll to "Email Notifications"
- Ensure "Booking Received (Admin)" checkbox is **CHECKED** ✅

**3. Check Brevo API logs:**
- Brevo Dashboard → Transactional → Logs
- Filter by recipient email
- Check error messages if any

**4. Verify EMAIL_FROM is set:**
```bash
# Required in Vercel:
EMAIL_FROM=noreply@markmaeda.com
EMAIL_FROM_NAME=Mark Maeda Travel & Tour
BREVO_API_KEY=xkeysib-...
```

---

## 📝 Required Vercel Environment Variables

```bash
# Email sender (Brevo)
EMAIL_FROM=noreply@markmaeda.com
EMAIL_FROM_NAME=Mark Maeda Travel & Tour
BREVO_API_KEY=xkeysib-your-api-key

# Admin notification (CORRECT NAME)
ADMIN_EMAIL=your-gmail@gmail.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**DO NOT USE:** `ADMIN_NOTIFY_EMAIL` (wrong name)

---

## 🚀 Quick Fix Steps

1. **Go to Vercel Dashboard**
   - Your Project → Settings → Environment Variables

2. **Add/Update:**
   - Variable: `ADMIN_EMAIL`
   - Value: `your-gmail@gmail.com`
   - Environment: Production (and Preview if needed)

3. **Redeploy:**
   - Deployments → Latest Deployment → "Redeploy"
   - Or push a new commit

4. **Test:**
   - Create a test booking
   - Check Vercel logs for `[booking-created]` messages
   - Check your Gmail inbox
   - Check Brevo dashboard

---

## ✅ Confirmation That Code is Correct

**File:** `src/app/api/notify/booking-created/route.ts`

**Admin email sending (lines 259-281):**
```typescript
// Send admin email (if enabled and email configured)
if (emailToggles.booking_received_admin !== false) {
  if (finalAdminEmail) {
    console.log("[booking-created] Sending admin email to:", finalAdminEmail);
    try {
      const adminTemplate = bookingReceivedAdmin(booking as Booking, items);
      await sendBrevoEmail({
        to: finalAdminEmail,
        subject: adminTemplate.subject,  // "New Booking Received - REF"
        html: adminTemplate.html,        // Full itemized details
        text: adminTemplate.text,
      });
      console.log("[booking-created] ✅ Admin email sent successfully to:", finalAdminEmail);
    } catch (error) {
      console.error("[booking-created] ❌ Admin email failed:", error);
      emailError = true;
    }
  } else {
    console.log("[booking-created] ⚠️  No admin email configured (skipping admin notification)");
  }
}
```

**✅ This code is already implemented and working.**
**❌ The issue is just the environment variable name mismatch.**

---

## 📞 If Still Not Working After Fix

**Check these in order:**

1. **Verify env var is set:**
   ```bash
   # In Vercel dashboard, confirm you see:
   ADMIN_EMAIL=your-gmail@gmail.com
   ```

2. **Verify redeploy picked up new env var:**
   - Check deployment logs
   - Look for "Environment variables updated"

3. **Check if booking-created route is being called:**
   - Search Vercel logs for `[booking-created]`
   - If not found, the route isn't being triggered

4. **Check customer email works:**
   - If customer email works but admin doesn't, it's config issue
   - If neither works, it's Brevo API issue

5. **Check Brevo API key permissions:**
   - Brevo Dashboard → Account → SMTP & API
   - Ensure API key has "Send transactional emails" permission

---

## 🎯 Summary

- ✅ **Code is correct** and already sends admin emails with itemized details
- ✅ **Self-send safeguard** is implemented
- ✅ **Error handling** is implemented
- ❌ **Problem:** You set `ADMIN_NOTIFY_EMAIL` but code reads `ADMIN_EMAIL`
- 🔧 **Fix:** Rename env var in Vercel from `ADMIN_NOTIFY_EMAIL` to `ADMIN_EMAIL`
- 📧 **Template:** Already includes full booking item details (type, title, date, pickup/dropoff, passengers, luggage, subtotal)

**After fixing the env var name, admin emails will start sending automatically.**
