# Admin Reviews Moderation Fix

## Problem
Admin Reviews moderation (Approve/Feature buttons) was failing with "Failed to update review" error because:
1. Client-side direct Supabase updates were blocked by RLS
2. Component was using incorrect column names (`approved`/`featured` instead of `is_approved`/`is_featured`)

## Solution
Implemented robust server-side moderation through dedicated API routes with proper admin authentication.

---

## A) New API Routes (Service Role)

### 1. POST /api/admin/reviews/approve

**File:** `src/app/api/admin/reviews/approve/route.ts`

**Purpose:** Update review approval status

**Request:**
```json
{
  "reviewId": "uuid",
  "isApproved": true | false
}
```

**Response:**
```json
{
  "ok": true,
  "review": { /* updated review object */ }
}
```

**Logic:**
1. Verify current user is authenticated
2. Check user is admin using `is_admin()` RPC
3. Validate input (`reviewId` string, `isApproved` boolean)
4. Use service role client to update `public.reviews`
5. If `isApproved=false`, also set `is_featured=false` (can't feature unapproved)
6. Return updated review object

**Security:**
- Server-side admin check using existing `is_admin()` RPC
- Service role bypasses RLS for the update
- Detailed error logging

### 2. POST /api/admin/reviews/feature

**File:** `src/app/api/admin/reviews/feature/route.ts`

**Purpose:** Update review featured status

**Request:**
```json
{
  "reviewId": "uuid",
  "isFeatured": true | false
}
```

**Response:**
```json
{
  "ok": true,
  "review": { /* updated review object */ }
}
```

**Logic:**
1. Verify admin authentication (same as approve)
2. Validate input
3. If `isFeatured=true`, first verify review `is_approved=true`
   - Return 400 error if trying to feature unapproved review
4. Use service role to update `is_featured`
5. Return updated review

**Validation:**
- Cannot feature an unapproved review (returns error)
- Can unfeature at any time

---

## B) Updated Component

**File:** `src/components/admin/ReviewsTableClient.tsx`

### Changes Made:

#### 1. Fixed Interface Column Names
```typescript
interface Review {
  // ... other fields
  is_approved: boolean;  // ✅ Was: approved
  is_featured: boolean;  // ✅ Was: featured
}
```

#### 2. Replaced Direct Supabase Calls with API Fetch

**Before:**
```typescript
const { error: updateError } = await supabase
  .from("reviews")
  .update({ approved: newApproved })
  .eq("id", reviewId);
```

**After:**
```typescript
const response = await fetch("/api/admin/reviews/approve", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    reviewId,
    isApproved: newApproved,
  }),
});

const data = await response.json();

if (!response.ok || !data.ok) {
  throw new Error(data.error || "Failed to update review");
}
```

#### 3. Enhanced Error Handling

**Shows actual error messages:**
```typescript
catch (err) {
  console.error("[ReviewsTable] Failed to toggle approve:", err);
  const errorMessage = err instanceof Error 
    ? err.message 
    : "Failed to update review";
  setError(errorMessage);
}
```

**Console logs for debugging:**
- Success: `console.log("[ReviewsTable] Review approval updated:", reviewId)`
- Error: `console.error("[ReviewsTable] Failed to toggle approve:", err)`

#### 4. Added Loading State

```typescript
const [loading, setLoading] = useState<string | null>(null);

// Button shows "..." when loading
disabled={loading === review.id}
```

#### 5. Optimistic UI Updates Preserved

State updates immediately after successful API call:
```typescript
setReviews((prev) =>
  prev.map((r) =>
    r.id === reviewId
      ? {
          ...r,
          is_approved: newApproved,
          is_featured: newApproved ? r.is_featured : false,
        }
      : r
  )
);
```

#### 6. Fixed All Column References

Updated throughout component:
- `review.approved` → `review.is_approved`
- `review.featured` → `review.is_featured`
- Filter counts updated
- Status badge conditions updated
- Button click handlers updated

---

## C) Authentication Flow

Both API routes use the same admin verification:

```typescript
// 1. Get authenticated user
const supabaseServer = await createServerClient();
const { data: { user }, error: authError } = 
  await supabaseServer.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { ok: false, error: "Unauthorized" },
    { status: 401 }
  );
}

// 2. Verify admin status
const { data: isAdmin, error: adminCheckError } = 
  await supabaseServer.rpc("is_admin");

if (adminCheckError || !isAdmin) {
  return NextResponse.json(
    { ok: false, error: "Admin access required" },
    { status: 403 }
  );
}
```

---

## D) Business Rules

### Approve/Unapprove:
- ✅ Can approve any review
- ✅ Can unapprove any review
- ⚠️ Unapproving automatically unfeatures (can't have featured + unapproved)

### Feature/Unfeature:
- ✅ Can feature an approved review
- ✅ Can unfeature any review
- ❌ **Cannot feature an unapproved review** (returns 400 error)
- UI: Feature button disabled when review not approved

---

## E) Error Messages

### User-Facing Errors (shown in UI):
- "Unauthorized" (401)
- "Admin access required" (403)
- "reviewId is required" (400)
- "isApproved/isFeatured must be a boolean" (400)
- "Cannot feature an unapproved review" (400)
- "Review not found" (404)
- Actual Supabase error message (500)

### Server Logs (console):
```
[reviews/approve] Auth failed: ...
[reviews/approve] Admin check failed: ...
[reviews/approve] Updating review: { reviewId, updateData, user_id }
[reviews/approve] Update failed: { reviewId, error, code, details }
[reviews/approve] Review updated successfully: reviewId
```

---

## F) Database Columns

```sql
public.reviews:
- id (uuid, PK)
- booking_item_id (uuid, FK)
- booking_id (uuid, FK)
- rating (int, 1-5)
- comment (text)
- display_name (text)
- is_approved (boolean, default false)  ⚠️ Not "approved"
- is_featured (boolean, default false)  ⚠️ Not "featured"
- created_at (timestamp)
```

---

## G) Testing Checklist

### Approve Flow:
- [ ] Click "Approve" on pending review → Status changes to "Approved"
- [ ] Click "Unapprove" on approved review → Status changes to "Pending"
- [ ] Unapproving a featured review → Removes featured status too
- [ ] Error messages display actual API error
- [ ] Loading state shows "..." during API call
- [ ] Console logs appear for success/failure

### Feature Flow:
- [ ] Feature button disabled on pending reviews
- [ ] Click "Feature" on approved review → Status changes to "Featured"
- [ ] Click "Unfeature" on featured review → Status changes to "Approved"
- [ ] Attempting to feature unapproved shows error: "Cannot feature an unapproved review"
- [ ] Error messages display in red alert box
- [ ] Console logs appear for success/failure

### Permissions:
- [ ] Non-admin users cannot access API routes (403)
- [ ] Unauthenticated requests rejected (401)
- [ ] Service role successfully bypasses RLS

### UI/UX:
- [ ] Filter tabs show correct counts
- [ ] Status badges use correct colors
- [ ] Button states update immediately (optimistic)
- [ ] Error alert dismissible
- [ ] No page refresh needed

---

## H) Files Modified

### New Files:
- `src/app/api/admin/reviews/approve/route.ts`
- `src/app/api/admin/reviews/feature/route.ts`

### Modified Files:
- `src/components/admin/ReviewsTableClient.tsx`

### No Changes Needed:
- `src/app/admin/reviews/page.tsx` (uses `*` selector, gets correct columns)

---

## I) Build Status

✅ TypeScript compiles successfully  
✅ All routes built without errors  
✅ API routes appear in build output:
- `/api/admin/reviews/approve`
- `/api/admin/reviews/feature`

---

## J) Key Improvements

1. **RLS Compatible:** Service role routes bypass RLS properly
2. **Secure:** Server-side admin verification on every request
3. **Better UX:** Shows actual error messages, loading states
4. **Correct Schema:** Uses `is_approved`/`is_featured` column names
5. **Robust Logging:** Detailed console logs for debugging
6. **Business Logic:** Enforces "can't feature unapproved" rule
7. **Optimistic UI:** State updates immediately, no refresh needed
8. **Error Recovery:** Clear error messages with dismiss button
