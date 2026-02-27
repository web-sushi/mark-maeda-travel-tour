# Route Structure - Admin Login Fix

```
src/app/
│
├── (auth)/                    ← Route group (no layout protection)
│   ├── login/
│   │   └── page.tsx          → /login (customer login)
│   ├── signup/
│   │   └── page.tsx          → /signup (customer signup)
│   └── admin-login/          ✅ NEW LOCATION
│       └── page.tsx          → /admin-login (admin login, PUBLIC)
│
├── (account)/
│   └── account/
│       ├── page.tsx          → /account
│       └── bookings/[id]/
│           └── page.tsx      → /account/bookings/[id]
│
├── admin/                     ← Protected by layout.tsx
│   ├── layout.tsx            ✅ Calls requireAdmin()
│   ├── page.tsx              → /admin (dashboard)
│   ├── bookings/             → /admin/bookings
│   ├── tours/                → /admin/tours
│   ├── transfers/            → /admin/transfers
│   ├── packages/             → /admin/packages
│   ├── reviews/              → /admin/reviews
│   └── settings/             → /admin/settings
│
└── api/
    ├── bookings/
    │   ├── create/           → POST /api/bookings/create
    │   └── claim/            → POST /api/bookings/claim
    └── admin/                ← API routes with admin checks
        ├── reviews/
        │   ├── approve/      → POST /api/admin/reviews/approve
        │   └── feature/      → POST /api/admin/reviews/feature
        └── settings/         → GET/POST /api/admin/settings
```

## Protection Levels

### 🟢 Public (No Auth Required)
```
/                       Homepage
/tours                  Browse tours
/transfers              Browse transfers
/packages               Browse packages
/cart                   Shopping cart
/checkout               Checkout page
/booking/track          Track booking (public lookup)
/login                  Customer login
/signup                 Customer signup
/admin-login            ✅ Admin login (PUBLIC)
/admin-register         Admin registration (setup key required)
```

### 🟡 Customer Auth (Optional/Recommended)
```
/account                Account page (shows CTA if logged out)
/account/bookings/[id]  Booking details (requires auth + ownership)
```

### 🔴 Admin Only (requireAdmin)
```
/admin                  Admin dashboard
/admin/bookings         Manage bookings
/admin/tours            Manage tours
/admin/transfers        Manage transfers
/admin/packages         Manage packages
/admin/reviews          Moderate reviews
/admin/settings         App settings
/api/admin/*            Admin API routes
```

## Redirect Flow

### Scenario 1: Logged Out User → Admin Panel
```
┌─────────────┐
│ User visits │
│   /admin    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ admin/layout.tsx│
│ requireAdmin()  │
└──────┬──────────┘
       │ No auth
       ▼
┌─────────────────┐
│  redirect to    │
│ /admin-login    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Login form     │
│  (public page)  │
└──────┬──────────┘
       │ Login success
       ▼
┌─────────────────┐
│ Check is_admin()│
└──────┬──────────┘
       │ If admin
       ▼
┌─────────────────┐
│  Redirect to    │
│    /admin       │
└─────────────────┘
```

### Scenario 2: Already Admin → Admin Login
```
┌─────────────┐
│ Admin visits│
│/admin-login │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   useEffect     │
│ checks auth +   │
│   is_admin()    │
└──────┬──────────┘
       │ Already admin
       ▼
┌─────────────────┐
│  Auto redirect  │
│  to /admin      │
└─────────────────┘
```

### Scenario 3: Non-Admin Tries Admin Login
```
┌─────────────┐
│ User visits │
│/admin-login │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Login with      │
│ credentials     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Check is_admin()│
└──────┬──────────┘
       │ NOT admin
       ▼
┌─────────────────┐
│ Sign out + Error│
│  "Unauthorized" │
└─────────────────┘
```

## File Locations

### Admin Login (NEW)
```
📁 src/app/(auth)/admin-login/page.tsx
   ✅ Outside admin layout
   ✅ Publicly accessible
   ✅ Checks admin status after login
   ✅ Auto-redirects if already admin
```

### Admin Layout (UNCHANGED)
```
📁 src/app/admin/layout.tsx
   ✅ Calls requireAdmin()
   ✅ Protects all /admin/* routes
   ✅ Does NOT affect /admin-login
```

### Middleware (UPDATED)
```
📁 middleware.ts
   ✅ Allows /admin-login through
   ✅ Allows /admin-register through
   ✅ Minimal interference
```

### requireAdmin Helper (UPDATED)
```
📁 src/lib/auth/requireAdmin.ts
   ✅ Redirects to /admin-login (not home)
   ✅ Called by admin layout
```

---

## Key Points

1. **Admin login is at `/admin-login` (not `/admin/login`)**
   - This keeps it outside the protected admin layout
   - Allows public access for login attempts

2. **All other admin routes still protected**
   - `/admin`, `/admin/bookings`, etc. require admin auth
   - Protection happens in `admin/layout.tsx`

3. **No middleware blocking**
   - Middleware explicitly allows `/admin-login`
   - Middleware config includes path in matcher

4. **Smart redirects**
   - Unauthenticated → `/admin-login`
   - Already admin → auto-redirect to `/admin`
   - Non-admin login attempt → error + sign out

5. **Clear separation**
   - Customer auth: `(auth)` route group
   - Admin pages: `admin/` folder with layout guard
   - Public pages: No protection

---

Date: February 10, 2026
