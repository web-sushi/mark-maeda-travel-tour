# Stripe Webhook HTTP 307 Redirect Fix

## Problem

Stripe webhook deliveries to `https://markmaedatravelandtour.com/api/stripe/webhook` were failing with **HTTP 307**. Stripe webhooks cannot follow redirects—they require a direct **200** response.

## Root Cause

HTTP 307/308 typically occurs from:

1. **Vercel domain redirect** (most common): www ↔ apex (e.g. `markmaedatravelandtour.com` → `www.markmaedatravelandtour.com` or vice versa)
2. **Middleware** returning a redirect for the webhook path
3. **Next.js trailing slash** redirect (e.g. `/api/stripe/webhook/` → `/api/stripe/webhook`)

## Code Changes Made

### 1. `middleware.ts` – Webhook bypass

- Added **early return** for `/api/stripe/webhook` so it never goes through any redirect/session logic
- Added path to `matcher` so we explicitly handle it
- Ensures the webhook always gets `NextResponse.next()` with no redirects

### 2. `src/app/api/stripe/webhook/route.ts` – Logging and status codes

- **Logging at top**: method, pathname, whether `stripe-signature` header exists
- **Logging at each return**: final status code (200, 400, 500)
- **Status codes**:
  - `200` – Handled events and already-processed events
  - `400` – Signature verification failure or handler error
  - `405` – Non-POST (GET, etc.) via explicit `GET` handler
  - `500` – Missing `STRIPE_WEBHOOK_SECRET`

### 3. `vercel.json` – Cache headers

- Added `Cache-Control: no-store` for `/api/stripe/webhook` to avoid caching

### 4. `next.config.ts`

- No redirects; left as-is (no `trailingSlash` or custom redirects)

## Vercel Domain Configuration (IMPORTANT)

If 307 persists after these changes, the cause is usually **domain redirect** in Vercel:

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. Check which domain is primary: apex (`markmaedatravelandtour.com`) or `www.markmaedatravelandtour.com`
3. In **Stripe Dashboard** → Developers → Webhooks → your endpoint
4. Set the endpoint URL to the **exact** primary domain:
   - If apex is primary: `https://markmaedatravelandtour.com/api/stripe/webhook`
   - If www is primary: `https://www.markmaedatravelandtour.com/api/stripe/webhook`
5. Use **no trailing slash** (`/api/stripe/webhook`, not `/api/stripe/webhook/`)

## Verification

1. Call the endpoint directly:
   ```bash
   curl -X POST https://markmaedatravelandtour.com/api/stripe/webhook \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   Expected: **400** (missing signature), not **307**.

2. In Stripe Dashboard → Webhooks → your endpoint: run a test event and confirm **200**.

3. Check logs for `[Stripe Webhook] Incoming:` and `[Stripe Webhook] Returning status:` entries.
