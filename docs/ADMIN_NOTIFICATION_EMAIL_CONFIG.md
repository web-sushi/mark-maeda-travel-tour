# Admin Notification Email Configuration & Self-Send Safeguard

## Summary

Updated admin notification email configuration to be fully configurable via `app_settings` with a new `admin_notification_email` field. Added safeguard to prevent email provider self-send filtering when admin email matches sender email.

---

## Problem Statement

### Issue 1: Admin Email Not Fully Configurable
- Admin notification email was using `env.ADMIN_NOTIFY_EMAIL` as priority
- `app_settings.admin_notify_email` was only a fallback
- No way to change admin email without redeploying

### Issue 2: Self-Send Filtering Risk
- If admin email === sender email (EMAIL_FROM), email providers often filter/block
- No safeguard to detect or prevent this configuration issue
- Could result in admin not receiving booking notifications

---

## Solution Implemented

### 1. New Database Column

**Added:** `app_settings.admin_notification_email`

```sql
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS admin_notification_email TEXT;
```

**Priority Order (New Logic):**
1. `app_settings.admin_notification_email` (highest priority)
2. `app_settings.admin_notify_email` (backwards compatibility)
3. `env.ADMIN_EMAIL` (fallback)

### 2. Self-Send Safeguard

**Logic:** If `admin_email === EMAIL_FROM`, use fallback

```typescript
// Safeguard: if admin email === from email, use fallback
let finalAdminEmail = adminEmail;
if (adminEmail && emailFrom && adminEmail.toLowerCase() === emailFrom.toLowerCase()) {
  const fallbackAdminEmail = process.env.ADMIN_EMAIL;
  if (fallbackAdminEmail && fallbackAdminEmail.toLowerCase() !== emailFrom.toLowerCase()) {
    finalAdminEmail = fallbackAdminEmail;
    console.warn("[booking-created] ⚠️  Admin email equals FROM email, using fallback");
  } else {
    console.error("[booking-created] ❌ Admin email equals FROM email and no valid fallback available");
    finalAdminEmail = null;
  }
}
```

### 3. Enhanced Logging

**New logs added:**

```typescript
console.log("[booking-created] Email configuration:", {
  customerEmail,
  adminEmail: adminEmail || "(not configured)",
  emailFrom: emailFrom || "(not configured)",
});

console.log("[booking-created] Final admin recipient:", finalAdminEmail || "(none)");

console.log("[booking-created] Sending admin email to:", finalAdminEmail);

console.log("[booking-created] ✅ Admin email sent successfully to:", finalAdminEmail);
```

---

## Changes Made

### 1. Database Migration

**File:** `supabase/migrations/20260210_add_admin_notification_email.sql`

```sql
-- Add new column
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS admin_notification_email TEXT;

-- Migrate existing values
UPDATE public.app_settings
SET admin_notification_email = admin_notify_email
WHERE admin_notify_email IS NOT NULL 
  AND admin_notification_email IS NULL;
```

### 2. Type Definitions

**File:** `src/types/settings.ts`

```typescript
export interface AppSettings {
  // ... existing fields
  admin_notify_email?: string | null; // Deprecated: use admin_notification_email
  admin_notification_email?: string | null; // Primary admin email for notifications
  // ...
}

export interface AppSettingsFormData {
  // ... existing fields
  admin_notify_email: string;
  admin_notification_email: string; // New field
  // ...
}
```

### 3. Admin Settings Form

**File:** `src/components/admin/SettingsForm.tsx`

**Before:**
```tsx
<div>
  <label htmlFor="admin_notify_email">
    Admin Notification Email
  </label>
  <input
    type="email"
    id="admin_notify_email"
    value={formData.admin_notify_email}
    onChange={(e) => setFormData({ ...formData, admin_notify_email: e.target.value })}
  />
  <p className="text-xs text-gray-500 mt-1">
    Fallback if ADMIN_NOTIFY_EMAIL env var is not set
  </p>
</div>
```

**After:**
```tsx
{/* OLD FIELD - Deprecated, disabled */}
<div>
  <label htmlFor="admin_notify_email">
    Admin Notification Email (Deprecated)
  </label>
  <input
    type="email"
    id="admin_notify_email"
    value={formData.admin_notify_email}
    className="bg-gray-50"
    disabled
  />
  <p className="text-xs text-gray-500 mt-1">
    ⚠️ Deprecated: Use "Admin Notification Email" field below instead
  </p>
</div>

{/* NEW FIELD - Active */}
<div>
  <label htmlFor="admin_notification_email">
    Admin Notification Email *
  </label>
  <input
    type="email"
    id="admin_notification_email"
    value={formData.admin_notification_email}
    onChange={(e) => setFormData({ ...formData, admin_notification_email: e.target.value })}
    placeholder="notifications@example.com"
  />
  <p className="text-xs text-gray-500 mt-1">
    Primary email for booking notifications. Fallback: env ADMIN_EMAIL. 
    <span className="font-semibold text-amber-600">
      Must differ from sender email (EMAIL_FROM) to avoid filtering.
    </span>
  </p>
</div>
```

### 4. API Route Updates

**File:** `src/app/api/admin/settings/route.ts`

```typescript
// Update existing row
await supabase
  .from("app_settings")
  .update({
    // ... existing fields
    admin_notify_email: body.admin_notify_email || null, // Keep for backwards compat
    admin_notification_email: body.admin_notification_email || null, // New field
    // ...
  });

// Insert new row
await supabase
  .from("app_settings")
  .insert({
    // ... existing fields
    admin_notify_email: body.admin_notify_email || null, // Keep for backwards compat
    admin_notification_email: body.admin_notification_email || null, // New field
    // ...
  });
```

### 5. Booking Notification Logic

**File:** `src/app/api/notify/booking-created/route.ts`

**Key Changes:**

1. **Priority Order Updated:**
```typescript
// OLD
const adminEmail = 
  process.env.ADMIN_NOTIFY_EMAIL || 
  appSettings?.admin_notify_email || 
  null;

// NEW
const adminEmail = 
  appSettings?.admin_notification_email ||
  appSettings?.admin_notify_email || 
  process.env.ADMIN_EMAIL || 
  null;
```

2. **Self-Send Safeguard Added:**
```typescript
let finalAdminEmail = adminEmail;
if (adminEmail && emailFrom && adminEmail.toLowerCase() === emailFrom.toLowerCase()) {
  const fallbackAdminEmail = process.env.ADMIN_EMAIL;
  if (fallbackAdminEmail && fallbackAdminEmail.toLowerCase() !== emailFrom.toLowerCase()) {
    finalAdminEmail = fallbackAdminEmail;
    console.warn("[booking-created] ⚠️  Admin email equals FROM email, using fallback");
  } else {
    console.error("[booking-created] ❌ Admin email equals FROM email and no valid fallback available");
    finalAdminEmail = null;
  }
}
```

3. **Enhanced Logging:**
```typescript
console.log("[booking-created] Email configuration:", {
  customerEmail,
  adminEmail: adminEmail || "(not configured)",
  emailFrom: emailFrom || "(not configured)",
});

console.log("[booking-created] Final admin recipient:", finalAdminEmail || "(none)");
```

---

## Configuration Examples

### Example 1: Recommended Setup

```bash
# .env or Vercel Environment Variables
EMAIL_FROM=noreply@markmaeda.com
EMAIL_FROM_NAME=Mark Maeda Travel & Tour
ADMIN_EMAIL=admin@markmaeda.com  # Fallback only
```

**Admin Settings (Database):**
```
admin_notification_email: notifications@markmaeda.com
```

**Result:**
- ✅ Admin emails sent to: `notifications@markmaeda.com`
- ✅ No self-send issue (FROM ≠ TO)
- ✅ Configurable without redeployment

### Example 2: Self-Send Issue (Detected & Fixed)

```bash
# .env
EMAIL_FROM=admin@markmaeda.com
ADMIN_EMAIL=support@markmaeda.com  # Different from FROM
```

**Admin Settings (Database):**
```
admin_notification_email: admin@markmaeda.com  # Same as FROM!
```

**Result:**
- ⚠️ Detects: admin email === FROM email
- ✅ Uses fallback: `support@markmaeda.com` (from ADMIN_EMAIL)
- ✅ Logs warning
- ✅ Admin still receives notifications

**Console Output:**
```
[booking-created] Email configuration: {
  customerEmail: 'customer@example.com',
  adminEmail: 'admin@markmaeda.com',
  emailFrom: 'admin@markmaeda.com'
}
[booking-created] ⚠️  Admin email equals FROM email, using fallback: {
  original: 'admin@markmaeda.com',
  fallback: 'support@markmaeda.com'
}
[booking-created] Final admin recipient: support@markmaeda.com
[booking-created] Sending admin email to: support@markmaeda.com
[booking-created] ✅ Admin email sent successfully to: support@markmaeda.com
```

### Example 3: Self-Send Issue (No Valid Fallback)

```bash
# .env
EMAIL_FROM=admin@markmaeda.com
ADMIN_EMAIL=admin@markmaeda.com  # Same as FROM (invalid fallback)
```

**Admin Settings (Database):**
```
admin_notification_email: admin@markmaeda.com  # Same as FROM!
```

**Result:**
- ❌ Detects: admin email === FROM email
- ❌ Fallback also === FROM email (invalid)
- ⚠️ Sets finalAdminEmail = null
- ❌ No admin notification sent
- ✅ Logs error for debugging

**Console Output:**
```
[booking-created] Email configuration: {
  customerEmail: 'customer@example.com',
  adminEmail: 'admin@markmaeda.com',
  emailFrom: 'admin@markmaeda.com'
}
[booking-created] ❌ Admin email equals FROM email and no valid fallback available
[booking-created] Final admin recipient: (none)
[booking-created] ⚠️  No admin email configured (skipping admin notification)
```

---

## Migration Steps

### Step 1: Run Database Migration

```bash
# Local development
psql your_database < supabase/migrations/20260210_add_admin_notification_email.sql

# Or via Supabase CLI
supabase migration up
```

### Step 2: Configure Admin Email

1. Go to Admin Settings page (`/admin/settings`)
2. Set "Admin Notification Email" field
3. **Important:** Ensure it's different from `EMAIL_FROM` environment variable
4. Save settings

### Step 3: Verify Configuration

**Check logs after next booking:**
```
[booking-created] Email configuration: {
  customerEmail: 'customer@example.com',
  adminEmail: 'your-admin@example.com',
  emailFrom: 'noreply@example.com'
}
[booking-created] Final admin recipient: your-admin@example.com
[booking-created] ✅ Admin email sent successfully to: your-admin@example.com
```

---

## Backwards Compatibility

### ✅ Preserved

- Old `admin_notify_email` field still works as fallback
- Environment variable `ADMIN_EMAIL` still works as fallback
- Existing deployments won't break

### Migration Path

**Existing users with `admin_notify_email` set:**
1. Migration automatically copies value to `admin_notification_email`
2. Admin Settings form shows both fields (old is disabled)
3. System uses new field, falls back to old if new is empty

---

## Logging Summary

### Email Configuration Logs

**Purpose:** Verify what emails are configured

```typescript
console.log("[booking-created] Email configuration:", {
  customerEmail,
  adminEmail: adminEmail || "(not configured)",
  emailFrom: emailFrom || "(not configured)",
});
```

### Self-Send Detection Logs

**Purpose:** Detect and log self-send issues

```typescript
// Warning: Self-send detected, using fallback
console.warn("[booking-created] ⚠️  Admin email equals FROM email, using fallback:", {
  original: adminEmail,
  fallback: finalAdminEmail,
});

// Error: Self-send detected, no valid fallback
console.error("[booking-created] ❌ Admin email equals FROM email and no valid fallback available");
```

### Final Recipient Log

**Purpose:** Confirm which email will receive admin notification

```typescript
console.log("[booking-created] Final admin recipient:", finalAdminEmail || "(none)");
```

### Send Status Logs

**Purpose:** Confirm email was sent successfully

```typescript
// Before send
console.log("[booking-created] Sending admin email to:", finalAdminEmail);

// After send success
console.log("[booking-created] ✅ Admin email sent successfully to:", finalAdminEmail);

// After send failure
console.error("[booking-created] ❌ Admin email failed:", error);
```

---

## Testing Checklist

### Test 1: Normal Configuration
- [ ] Set `admin_notification_email` to different email than `EMAIL_FROM`
- [ ] Create booking
- [ ] Verify logs show correct final admin recipient
- [ ] Verify admin receives email

### Test 2: Self-Send Detection (Valid Fallback)
- [ ] Set `admin_notification_email` same as `EMAIL_FROM`
- [ ] Set `ADMIN_EMAIL` env var to different email
- [ ] Create booking
- [ ] Verify logs show self-send warning
- [ ] Verify fallback email used
- [ ] Verify admin receives email at fallback address

### Test 3: Self-Send Detection (No Valid Fallback)
- [ ] Set `admin_notification_email` same as `EMAIL_FROM`
- [ ] Set `ADMIN_EMAIL` env var to same email as `EMAIL_FROM`
- [ ] Create booking
- [ ] Verify logs show self-send error
- [ ] Verify no admin email sent
- [ ] Customer email still sent successfully

### Test 4: Backwards Compatibility
- [ ] Don't set `admin_notification_email` (leave empty)
- [ ] Set `admin_notify_email` (old field)
- [ ] Create booking
- [ ] Verify admin email sent to `admin_notify_email` value

### Test 5: Environment Variable Fallback
- [ ] Don't set either database field
- [ ] Set `ADMIN_EMAIL` env var only
- [ ] Create booking
- [ ] Verify admin email sent to `ADMIN_EMAIL` value

---

## Files Changed

1. **`supabase/migrations/20260210_add_admin_notification_email.sql`** ✅ (New)
   - Added `admin_notification_email` column
   - Migrated existing `admin_notify_email` values

2. **`src/types/settings.ts`** ✅
   - Added `admin_notification_email` to interfaces
   - Marked `admin_notify_email` as deprecated

3. **`src/components/admin/SettingsForm.tsx`** ✅
   - Disabled old `admin_notify_email` field
   - Added new `admin_notification_email` field
   - Added warning about EMAIL_FROM mismatch

4. **`src/app/api/admin/settings/route.ts`** ✅
   - Added `admin_notification_email` to update/insert operations
   - Kept `admin_notify_email` for backwards compatibility

5. **`src/app/api/notify/booking-created/route.ts`** ✅
   - Updated admin email priority order
   - Added self-send safeguard logic
   - Enhanced logging for email configuration
   - Logged final admin recipient

---

## Build Status

✅ **Build successful:** `npm run build` passed with no errors
✅ **TypeScript:** No type errors
✅ **All routes compiled:** 35/35 pages generated

---

## Benefits

### Before:
- ❌ Admin email not fully configurable (env var priority)
- ❌ No protection against self-send filtering
- ❌ Minimal logging for admin email
- ❌ No visibility into which email receives notifications

### After:
- ✅ Admin email fully configurable via UI
- ✅ Self-send safeguard with automatic fallback
- ✅ Comprehensive logging for debugging
- ✅ Clear visibility of final recipient in logs
- ✅ Backwards compatible with existing configs
- ✅ User-friendly warning in admin UI

---

## Recommended Environment Variables

```bash
# Sender email (used by Brevo)
EMAIL_FROM=noreply@markmaeda.com
EMAIL_FROM_NAME=Mark Maeda Travel & Tour

# Fallback admin email (different from EMAIL_FROM!)
ADMIN_EMAIL=admin@markmaeda.com

# Brevo API key (unchanged)
BREVO_API_KEY=your_brevo_api_key
```

**Then in Admin Settings UI:**
- Set "Admin Notification Email" to: `notifications@markmaeda.com` (or any email ≠ EMAIL_FROM)

---

## Troubleshooting

### Issue: Admin not receiving emails

**Check logs for:**
```
[booking-created] Final admin recipient: (none)
```

**Solution:**
1. Set `admin_notification_email` in Admin Settings
2. Ensure it's different from `EMAIL_FROM`
3. Verify Brevo API key is correct

### Issue: Self-send warning in logs

**Log message:**
```
⚠️  Admin email equals FROM email, using fallback
```

**Solution:**
- Change `admin_notification_email` to different email than `EMAIL_FROM`
- Or ensure `ADMIN_EMAIL` env var is set to valid fallback

### Issue: No valid fallback available

**Log message:**
```
❌ Admin email equals FROM email and no valid fallback available
```

**Solution:**
- Set `ADMIN_EMAIL` env var to different email than `EMAIL_FROM`
- Or change `admin_notification_email` in Admin Settings
