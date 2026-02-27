# Floating Cart Button - Mobile Implementation

## Overview

The floating cart button is a mobile-only component that provides easy access to the shopping cart from any page on the site. It appears as a circular button in the bottom-right corner on mobile devices.

## Implementation

### Component Location
- **File**: `src/components/layout/FloatingCart.tsx`
- **Rendered in**: `src/components/layout/Header.tsx` (site-wide)

### Key Features

1. **Mobile-Only Visibility**
   - Hidden on desktop (≥768px) via `md:hidden` class
   - Desktop users use the cart link in the navbar

2. **Smart Display Logic**
   - Only shows when cart has items (totalQuantity > 0)
   - Hidden on `/cart` and `/checkout` pages (redundant)
   - Visible on all other pages (home, tours, transfers, reviews, account, etc.)

3. **Accurate Quantity Calculation**
   - Shows total vehicle quantity (not just item count)
   - Sum of all vehicle selections across all cart items
   - Example: 1 tour with 2 sedans + 1 transfer with 1 van = Badge shows "3"

4. **Real-Time Updates**
   - Listens to `storage` events (cross-tab updates)
   - Listens to `cartUpdated` custom events (same-tab updates)
   - Updates immediately when items added/removed

5. **Accessibility**
   - Proper ARIA label: "Shopping cart with X items"
   - Keyboard accessible
   - Focus ring visible: `focus:ring-4 focus:ring-[#E4005A]/50`
   - Screen reader friendly

## Code Structure

### FloatingCart Component

```tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCartTotalQuantity } from "@/lib/cart/store";

export default function FloatingCart() {
  const [totalQuantity, setTotalQuantity] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  // Real-time cart count updates
  useEffect(() => {
    const updateCartCount = () => {
      setTotalQuantity(getCartTotalQuantity());
    };

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  // Hide logic
  if (totalQuantity === 0) return null;
  if (pathname === "/checkout" || pathname === "/cart") return null;

  // Navigate to cart page
  const handleClick = () => router.push("/cart");

  return (/* Button JSX */);
}
```

### Cart Store Enhancement

**File**: `src/lib/cart/store.ts`

**Added Functions:**

```typescript
/**
 * Get total quantity of all items in cart (sum of all vehicle counts)
 */
export function getCartTotalQuantity(): number {
  const cart = getCart();
  return cart.reduce((sum, item) => {
    const vehicleCount = Object.values(item.vehicleSelection || {}).reduce(
      (acc, qty) => acc + qty,
      0
    );
    return sum + vehicleCount;
  }, 0);
}
```

**Updated Functions:**

```typescript
export function setCart(items: CartItem[]): void {
  // ... save to localStorage
  window.dispatchEvent(new Event("cartUpdated")); // NEW: Dispatch event
}

export function clearCart(): void {
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event("cartUpdated")); // NEW: Dispatch event
}
```

## Styling

### Button Styles

```tsx
className="
  md:hidden                      // Mobile only
  fixed bottom-4 right-4         // Position (safe spacing)
  z-40                            // Above content, below modals
  bg-[#E4005A] text-white        // Brand colors
  p-4 rounded-full               // Circular shape
  shadow-lg                       // Subtle shadow
  hover:bg-[#C4004A]             // Darker on hover
  transition-all                  // Smooth transitions
  transform hover:scale-110       // Scale up on hover
  active:scale-95                 // Scale down on click
  focus:outline-none              // Remove default outline
  focus:ring-4                    // Custom focus ring
  focus:ring-[#E4005A]/50        // Semi-transparent pink ring
"
```

### Badge Styles

```tsx
className="
  absolute -top-1 -right-1       // Position on button
  bg-white text-[#E4005A]        // Inverse colors
  text-xs font-bold               // Small, bold text
  rounded-full                    // Circular
  min-w-[24px] h-6 px-1.5        // Responsive width, fixed height
  flex items-center justify-center // Center content
  border-2 border-[#E4005A]      // Pink border
  shadow-md                       // Shadow for depth
"
```

## Quantity Calculation

### How It Works

**Cart Structure:**
```json
[
  {
    "type": "tour",
    "id": "tour-123",
    "vehicleSelection": {
      "sedan": 2,
      "van": 1
    }
  },
  {
    "type": "transfer",
    "id": "transfer-456",
    "vehicleSelection": {
      "suv": 1
    }
  }
]
```

**Calculation:**
```
Item 1: sedan(2) + van(1) = 3
Item 2: suv(1) = 1
Total: 3 + 1 = 4

Badge displays: "4"
```

**Badge Display:**
- 0: Hidden (button not shown)
- 1-99: Shows exact number
- 100+: Shows "99+"

## Event System

### Custom Events

**cartUpdated Event:**
- Dispatched when cart is modified
- Allows components to react without polling
- Cross-component synchronization

**Usage:**
```typescript
// Dispatch (in cart store)
window.dispatchEvent(new Event("cartUpdated"));

// Listen (in components)
window.addEventListener("cartUpdated", updateHandler);
```

**Event Flow:**
```
User adds item to cart
  ↓
setCart() called
  ↓
localStorage updated
  ↓
"cartUpdated" event dispatched
  ↓
FloatingCart listens and updates
  ↓
Badge shows new count
```

## Display Logic

### When FloatingCart Shows

```typescript
// Shows if ALL conditions are true:
✅ totalQuantity > 0
✅ NOT on /cart page
✅ NOT on /checkout page
✅ Screen width < 768px (md breakpoint)
```

### When FloatingCart Hides

```typescript
// Hides if ANY condition is true:
❌ totalQuantity === 0
❌ pathname === "/cart"
❌ pathname === "/checkout"
❌ Screen width ≥ 768px (desktop)
```

## Positioning

### Z-Index Hierarchy

```
z-50: Header, Mobile menu, Modals
z-40: Floating cart button  ← HERE
z-30: Filter bars
z-10: Regular content
z-0:  Background
```

### Safe Spacing

```
bottom-4  = 1rem (16px) from bottom
right-4   = 1rem (16px) from right

On iPhone SE (375px width):
- Button: 56px × 56px (p-4 + icon)
- Badge: 24px × 24px
- Total width from right: 16px + 56px = 72px
- Leaves 303px for content (safe)
```

## Accessibility

### ARIA Implementation

```tsx
<button
  aria-label={`Shopping cart with ${totalQuantity} ${
    totalQuantity === 1 ? 'item' : 'items'
  }`}
  type="button"
>
  <svg aria-hidden="true">...</svg>
  <span aria-hidden="true">{totalQuantity}</span>
</button>
```

**Screen Reader Output:**
- 1 item: "Shopping cart with 1 item"
- 5 items: "Shopping cart with 5 items"

### Keyboard Navigation

1. **Tab**: Focuses button
2. **Enter/Space**: Navigates to /cart
3. **Tab**: Moves to next focusable element

**Focus Indicator:**
- 4px semi-transparent pink ring
- Visible on all backgrounds
- Smooth transition

## Testing Checklist

### Mobile Display
- [ ] Button visible on home page (mobile)
- [ ] Button visible on tours page (mobile)
- [ ] Button visible on transfers page (mobile)
- [ ] Button visible on reviews page (mobile)
- [ ] Button visible on account page (mobile)
- [ ] Button hidden on /cart page
- [ ] Button hidden on /checkout page
- [ ] Button hidden on desktop (≥768px)

### Functionality
- [ ] Badge shows correct count (sum of vehicles)
- [ ] Badge updates when item added
- [ ] Badge updates when item removed
- [ ] Badge shows "99+" for counts over 99
- [ ] Button navigates to /cart on click
- [ ] Button hidden when cart empty

### Interactions
- [ ] Hover: Button scales up (110%)
- [ ] Active: Button scales down (95%)
- [ ] Focus: Pink ring visible
- [ ] Tap: Smooth navigation (no flash)
- [ ] Badge: No layout shift

### Accessibility
- [ ] Screen reader announces correct count
- [ ] Keyboard: Tab focuses button
- [ ] Keyboard: Enter/Space navigates
- [ ] ARIA label reads correctly
- [ ] Focus visible on all themes

### Edge Cases
- [ ] Cart with 0 items: Button hidden
- [ ] Cart with 1 item: "1 item" (singular)
- [ ] Cart with 100 items: "99+" shown
- [ ] Multiple tabs: Count syncs across tabs
- [ ] Local storage error: Fails gracefully

## Browser Compatibility

### Supported
- ✅ Chrome/Edge 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ Mobile Safari (iOS 14+)
- ✅ Mobile Chrome (Android 10+)

### Features Used
- CSS: `fixed`, `bottom`, `right`, `transform`, `transition`
- JS: `usePathname`, `useRouter`, `localStorage`
- Events: `storage`, custom `cartUpdated`

## Performance

### Optimizations

1. **Conditional Rendering**
   - Returns `null` when hidden (no DOM node)
   - React skips reconciliation

2. **Event Listeners**
   - Cleaned up in `useEffect` return
   - No memory leaks

3. **Efficient Calculation**
   - `getCartTotalQuantity()` only called on events
   - No unnecessary re-renders

4. **Small Bundle Size**
   - ~60 lines of code
   - No external dependencies
   - Tree-shakeable

## Troubleshooting

### Button Not Showing

**Check:**
1. Cart has items: `getCartTotalQuantity() > 0`
2. Not on /cart or /checkout: `usePathname()`
3. Mobile screen: `< 768px width`
4. Component rendered: Check Header.tsx

**Debug:**
```tsx
console.log('Cart quantity:', getCartTotalQuantity());
console.log('Pathname:', pathname);
console.log('Screen width:', window.innerWidth);
```

### Count Not Updating

**Check:**
1. `cartUpdated` event dispatched: In `setCart()`
2. Event listener attached: In `useEffect`
3. Cart store updated: Check localStorage

**Debug:**
```tsx
useEffect(() => {
  const handler = () => {
    console.log('Cart updated event received');
    setTotalQuantity(getCartTotalQuantity());
  };
  window.addEventListener("cartUpdated", handler);
}, []);
```

### Badge Positioning Off

**Check:**
1. Parent has `relative` positioning: Button does
2. Badge has `absolute` positioning: It does
3. Negative margins: `-top-1 -right-1`

**Fix:**
```tsx
// Ensure button has position context
className="relative ..." // on button
className="absolute -top-1 -right-1 ..." // on badge
```

## Future Enhancements

### Potential Features
- Animation when count changes (number pop)
- Haptic feedback on mobile (vibration)
- Mini cart preview on long-press
- Swipe to clear cart
- Shake animation when cart empty and user tries to add

### Performance Improvements
- Use Web Workers for cart calculations
- Implement virtual scrolling for large carts
- Add service worker for offline support

## Summary

✅ **Mobile-Only**: Hidden on desktop, visible < 768px
✅ **Smart Display**: Only shows when needed
✅ **Accurate Count**: Sum of all vehicle quantities
✅ **Real-Time**: Updates immediately on cart changes
✅ **Accessible**: ARIA labels, keyboard navigation
✅ **Performant**: Conditional rendering, event-driven
✅ **Safe Positioning**: bottom-4 right-4, z-40
✅ **Brand Styled**: Pink button, white badge

The floating cart button provides an excellent mobile UX for accessing the cart from anywhere on the site.
