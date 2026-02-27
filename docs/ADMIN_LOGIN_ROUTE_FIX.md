# Admin Login Route Protection Fix

## Issue
`/admin/login` was blocked by the admin guard in `src/app/admin/layout.tsx`, causing a redirect loop to `/?error=unauthorized`.

## Root Cause
The admin login page was located at `/admin/login`, which placed it inside the `/admin` folder structure. This folder has a `layout.tsx` that calls `requireAdmin()`, blocking all unauthenticated users - including those trying to log in.

## Solution

### 1. Moved Admin Login Outside Protected Layout

**Before:**
```
src/app/admin/login/page.tsx  ❌ (blocked by admin/layout.tsx)
```

**After:**
```
src/app/(auth)/admin-login/page.tsx  ✅ (public access, no admin layout)
```

**New Route:** `/admin-login`

**Benefits:**
- Not protected by `admin/layout.tsx`
- Uses the `(auth)` route group (same as `/login` and `/signup`)
- Publicly accessible for login attempts

---

### 2. Updated Admin Login Logic

**File:** `src/app/(auth)/admin-login/page.tsx`

**Features:**

1. **Auto-Redirect for Already-Authenticated Admins:**
   ```typescript
   useEffect(() => {
     // If already logged in AND admin → redirect to /admin
     if (user && isAdmin) {
       router.push(next);
     }
   }, []);
   ```

2. **Admin Verification After Login:**
   ```typescript
   // After successful password login:
   const { data: isAdmin } = await supabase.rpc("is_admin");
   
   if (!isAdmin) {
     await supabase.auth.signOut(); // Sign out non-admins
     throw new Error("Unauthorized: Admin access required");
   }
   ```

3. **Error Handling:**
   - Non-admin users see: "Unauthorized: Admin access required"
   - Invalid credentials show standard Supabase errors
   - Auto signs out non-admin users who try to access admin panel

---

### 3. Updated Middleware

**File:** `middleware.ts`

**Changes:**
```typescript
// Allow /admin-login through (it's the login page, must be public)
if (pathname.startsWith("/admin-login")) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin-register/:path*", "/admin-login/:path*"],
};
```

**Purpose:**
- Ensures middleware doesn't interfere with admin login page
- Middleware still protects all other `/admin/*` routes

---

### 4. Updated requireAdmin Helper

**File:** `src/lib/auth/requireAdmin.ts`

**Changes:**
```typescript
if (authError || !user) {
  // Not logged in → redirect to admin login page
  redirect("/admin-login");  // Changed from "/?error=unauthorized"
}
```

**Behavior:**
- Unauthenticated users trying to access `/admin/*` → redirected to `/admin-login`
- Authenticated non-admins → redirected to `/?error=access_denied`
- Authenticated admins → access granted

---

## Route Protection Summary

| Route | Protection | Behavior |
|-------|-----------|----------|
| `/admin-login` | ❌ None (public) | Login form, checks admin status after login |
| `/admin` | ✅ Admin required | Redirects to `/admin-login` if not authenticated |
| `/admin/*` | ✅ Admin required | All admin pages protected by `admin/layout.tsx` |
| `/api/admin/*` | ✅ Admin required | API routes check `is_admin()` RPC |

---

## User Flows

### 1. Unauthenticated User Tries to Access Admin Panel
```
User → /admin
  ↓ (requireAdmin check)
Redirect → /admin-login
  ↓ (user logs in)
Check admin status
  ↓ (if admin)
Redirect → /admin
```

### 2. Authenticated Admin Visits Admin Login
```
User (admin) → /admin-login
  ↓ (useEffect checks auth)
Already admin
  ↓
Redirect → /admin (dashboard)
```

### 3. Authenticated Non-Admin Tries Admin Login
```
Non-admin user → /admin-login
  ↓ (useEffect checks auth)
Logged in but not admin
  ↓
Show login form
  ↓ (if they try to login again)
Check admin status → FAIL
  ↓
Sign out + Error: "Unauthorized: Admin access required"
```

### 4. Customer Accidentally Visits Admin Login
```
Customer → /admin-login
  ↓
See login form + "Customer? Sign in here" link
  ↓
Click link → /login (customer login)
```

---

## Files Changed

### Deleted:
- ❌ `src/app/admin/login/page.tsx` (was inside protected admin layout)

### Created:
- ✅ `src/app/(auth)/admin-login/page.tsx` (outside protected layout)

### Modified:
1. `middleware.ts` - Added `/admin-login` to allowed routes
2. `src/lib/auth/requireAdmin.ts` - Redirect unauthenticated users to `/admin-login`

---

## Testing Checklist

- [x] Build successful (`npm run build`)
- [x] Route `/admin-login` generated correctly
- [ ] Manual tests needed:
  - [ ] Visit `/admin-login` while logged out → see login form
  - [ ] Login with non-admin account → error + sign out
  - [ ] Login with admin account → redirect to `/admin`
  - [ ] Visit `/admin` while logged out → redirect to `/admin-login`
  - [ ] Visit `/admin-login` while already admin → auto-redirect to `/admin`
  - [ ] Customer login link works (`/login`)

---

## Key Improvements

1. **No More Catch-22:** Admin login page is now accessible without being admin
2. **Better UX:** Unauthenticated users redirected to login, not home page
3. **Security:** Still validates admin status after login
4. **Clear Separation:** Admin login at `/admin-login`, customer login at `/login`
5. **Auto-Redirect:** Admins who visit login page are sent directly to dashboard

---

## Production Notes

- Route changed from `/admin/login` → `/admin-login`
- Update any bookmarks or external links
- No database changes required
- No environment variable changes needed

---

Date: February 10, 2026
Status: ✅ FIXED & TESTED (build verification)
