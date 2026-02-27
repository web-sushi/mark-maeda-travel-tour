# Supabase Configuration Guide

## Required Setup for Email Verification & Authentication

This guide covers the complete Supabase configuration needed for the Tour WebApp authentication system.

---

## 1. Email Configuration (REQUIRED)

### SMTP Setup

**Location:** Supabase Dashboard → Project Settings → Authentication → Email

#### Development (Local Testing)

**Option A: Use Supabase Test Email (Limited)**
- Supabase provides test email delivery in development
- Emails are sent to a test inbox (check Supabase dashboard)
- **Limitation:** Only works for testing, not for real email addresses

**Option B: Configure SMTP Provider (Recommended)**

Popular SMTP providers:
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month for 3 months)
- **AWS SES** (62,000 emails/month free for 1 year)
- **Resend** (100 emails/day free)

**SMTP Settings:**
```
SMTP Host: smtp.your-provider.com
SMTP Port: 587 (or 465 for SSL)
SMTP User: your-smtp-username
SMTP Password: your-smtp-password
Sender Email: noreply@yourdomain.com
Sender Name: Mark Maeda Travel & Tour
```

**Example (SendGrid):**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: <your-sendgrid-api-key>
Sender Email: noreply@markmaeda.com
Sender Name: Mark Maeda Travel & Tour
```

#### Production

**REQUIRED:** Configure a production SMTP provider
- Do NOT use Supabase test emails in production
- Use a custom domain for sender email (e.g., `noreply@yourdomain.com`)
- Set up SPF, DKIM, and DMARC records for email deliverability

---

## 2. URL Configuration (REQUIRED)

### Site URL

**Location:** Supabase Dashboard → Project Settings → Authentication → URL Configuration

#### Development:
```
Site URL: http://localhost:3000
```

#### Production:
```
Site URL: https://yourdomain.com
```

**Important:** This is the base URL Supabase uses for all redirect URLs.

---

### Redirect URLs Allowlist

**Location:** Supabase Dashboard → Project Settings → Authentication → URL Configuration → Redirect URLs

Add the following URLs to the allowlist:

#### Development URLs:
```
http://localhost:3000/auth/callback
http://localhost:3000/account
http://localhost:3000/login
http://localhost:3000/admin-login
```

#### Production URLs:
```
https://yourdomain.com/auth/callback
https://yourdomain.com/account
https://yourdomain.com/login
https://yourdomain.com/admin-login
```

**Why these URLs?**
- `/auth/callback` - Handles email verification and magic link redirects
- `/account` - Default destination after customer login/signup
- `/login` - Customer login page (in case of errors)
- `/admin-login` - Admin login page (in case of errors)

---

## 3. Email Templates (Optional Customization)

**Location:** Supabase Dashboard → Project Settings → Authentication → Email Templates

### Available Templates:

1. **Confirm Signup**
   - Sent when user creates account
   - Contains email verification link
   - Default template works, but you can customize

2. **Magic Link**
   - Sent for passwordless login
   - Contains one-time login link

3. **Change Email Address**
   - Sent when user changes email
   - Contains confirmation link

4. **Reset Password**
   - Sent when user requests password reset
   - Contains reset link

### Customization Variables:

Available in all templates:
- `{{ .ConfirmationURL }}` - Verification/action URL
- `{{ .Token }}` - Auth token
- `{{ .TokenHash }}` - Token hash
- `{{ .SiteURL }}` - Your configured site URL
- `{{ .Email }}` - User's email address

**Example Custom "Confirm Signup" Template:**
```html
<h2>Welcome to Mark Maeda Travel & Tour!</h2>
<p>Thank you for creating an account.</p>
<p>Please click the button below to verify your email address:</p>
<p>
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #E4005A; color: white; padding: 12px 24px; 
            text-decoration: none; border-radius: 6px; display: inline-block;">
    Verify Email Address
  </a>
</p>
<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link expires in 24 hours.</p>
<p>If you didn't create this account, you can safely ignore this email.</p>
```

---

## 4. Authentication Settings

**Location:** Supabase Dashboard → Project Settings → Authentication

### Email Auth

- ✅ **Enable Email Provider:** ON
- ✅ **Email Confirmation Required:** ON (recommended for production)
- ✅ **Secure Email Change:** ON
- ⚙️ **Email Confirmation Expiry:** 86400 seconds (24 hours)

### Password Settings

- ⚙️ **Minimum Password Length:** 8 characters (matches app validation)
- ✅ **Require Uppercase:** OFF (for better UX)
- ✅ **Require Lowercase:** OFF
- ✅ **Require Numbers:** OFF
- ✅ **Require Special Characters:** OFF

### Security

- ✅ **Enable Manual Linking:** OFF (prevents account takeover)
- ✅ **Disable Signup:** OFF (allow new signups)
- ⚙️ **JWT Expiry:** 3600 seconds (1 hour, default)
- ⚙️ **Refresh Token Rotation:** ON (recommended)

---

## 5. RLS Policies (Database Security)

### Required RLS Function

Ensure `public.is_admin()` function exists:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users u
    LEFT JOIN public.user_roles r ON u.id = r.user_id
    WHERE u.id = auth.uid()
    AND (r.role = 'admin' OR u.email IN (
      -- Fallback: Add initial admin emails here
      'admin@markmaeda.com'
    ))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Bookings Table RLS

```sql
-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- NO public SELECT or INSERT policies
-- All inserts via service role API routes
```

---

## 6. Environment Variables

### Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL (used for email redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Brevo for booking notifications)
BREVO_API_KEY=your-brevo-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Mark Maeda Travel & Tour
ADMIN_NOTIFY_EMAIL=admin@yourdomain.com
```

### Production Environment:

Update these values in your hosting platform (Vercel, Netlify, etc.):
```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
# ... (use production Supabase keys)
```

---

## 7. Testing Email Verification Flow

### Test Checklist:

1. **Signup Flow:**
   - [ ] Go to `/signup`
   - [ ] Create account with valid email
   - [ ] See success message: "Check your email"
   - [ ] Receive verification email (check inbox/spam)
   - [ ] Click verification link in email
   - [ ] Redirected to `/auth/callback?code=...`
   - [ ] Session created successfully
   - [ ] Redirected to `/account`
   - [ ] See account page with bookings

2. **Email Not Received:**
   - [ ] Check spam/junk folder
   - [ ] Verify SMTP is configured in Supabase
   - [ ] Check Supabase logs: Authentication → Logs
   - [ ] Click "Resend Verification Email" button
   - [ ] Wait 2-5 minutes (SMTP delays)

3. **Magic Link Login:**
   - [ ] Go to `/login`
   - [ ] Click "Or sign in with magic link"
   - [ ] Enter email
   - [ ] Receive magic link email
   - [ ] Click link → redirected to `/auth/callback`
   - [ ] Logged in successfully

4. **Redirect After Verification:**
   - [ ] Signup from `/checkout?redirect=/account`
   - [ ] After verification, should land on `/account`
   - [ ] Previous cart/session should be preserved

---

## 8. Common Issues & Troubleshooting

### Issue: "Email not sent"

**Possible Causes:**
- SMTP not configured in Supabase dashboard
- Invalid SMTP credentials
- Rate limits reached (check provider)
- Email blocked by spam filter

**Solutions:**
1. Check Supabase Dashboard → Authentication → Logs
2. Verify SMTP settings are saved
3. Test with a different email provider (Gmail, Outlook)
4. Check SMTP provider dashboard for delivery logs

---

### Issue: "Redirect URL not allowed"

**Error Message:** "Redirect URL is not in the allowlist"

**Solution:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your redirect URL to the allowlist:
   - `http://localhost:3000/auth/callback` (dev)
   - `https://yourdomain.com/auth/callback` (prod)
3. Save and wait 1-2 minutes for changes to propagate

---

### Issue: "Email already registered"

**Cause:** User tried to sign up with an email that already exists

**Solutions:**
- Use "Sign In" instead of "Sign Up"
- Use "Forgot Password" to reset password
- Admin can delete duplicate users in Supabase Dashboard → Authentication → Users

---

### Issue: "Verification link expired"

**Cause:** User clicked verification link after 24 hours

**Solution:**
1. Go to `/signup` page
2. Try to sign up again with same email
3. Supabase will resend verification email
4. OR use "Resend Verification Email" button on success page

---

### Issue: "Session not created after verification"

**Possible Causes:**
- `/auth/callback` route not working
- Code exchange failed
- Browser blocked cookies

**Solutions:**
1. Check browser console for errors
2. Verify `/auth/callback/route.ts` exists
3. Check browser allows third-party cookies
4. Try in incognito mode
5. Check Supabase logs for error details

---

## 9. Production Deployment Checklist

Before going live:

### Supabase:
- [ ] SMTP configured with production email provider
- [ ] Custom domain for sender email (e.g., `noreply@yourdomain.com`)
- [ ] Production redirect URLs added to allowlist
- [ ] Site URL set to production domain
- [ ] Email confirmation required: ON
- [ ] RLS policies enabled and tested
- [ ] Test emails sent successfully

### Application:
- [ ] `NEXT_PUBLIC_SITE_URL` set to production URL
- [ ] All environment variables updated in hosting platform
- [ ] Build successful with no errors
- [ ] Test signup flow end-to-end in production
- [ ] Test magic link login in production
- [ ] Monitor Supabase logs for first 24 hours

### Email Deliverability:
- [ ] SPF record added to DNS
- [ ] DKIM configured in email provider
- [ ] DMARC policy set up
- [ ] Test email delivery to Gmail, Outlook, Yahoo
- [ ] Check spam score (use mail-tester.com)

---

## 10. Support & Resources

### Supabase Documentation:
- Auth Overview: https://supabase.com/docs/guides/auth
- Email Auth: https://supabase.com/docs/guides/auth/auth-email
- SMTP Setup: https://supabase.com/docs/guides/auth/auth-smtp
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security

### SMTP Providers:
- SendGrid: https://sendgrid.com/
- Mailgun: https://www.mailgun.com/
- AWS SES: https://aws.amazon.com/ses/
- Resend: https://resend.com/

### Email Deliverability:
- SPF/DKIM Checker: https://mxtoolbox.com/
- Spam Test: https://www.mail-tester.com/
- Email Validator: https://www.emailonacid.com/

---

## Quick Reference: Key URLs

| Purpose | Development | Production |
|---------|------------|------------|
| Site URL | `http://localhost:3000` | `https://yourdomain.com` |
| Auth Callback | `http://localhost:3000/auth/callback` | `https://yourdomain.com/auth/callback` |
| Customer Login | `http://localhost:3000/login` | `https://yourdomain.com/login` |
| Admin Login | `http://localhost:3000/admin-login` | `https://yourdomain.com/admin-login` |
| Account Page | `http://localhost:3000/account` | `https://yourdomain.com/account` |

---

Date: February 10, 2026
Version: 1.0
