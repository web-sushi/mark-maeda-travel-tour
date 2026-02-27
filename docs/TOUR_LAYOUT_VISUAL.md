# Visual Example: Tour Details Page Layout

## Before (Old Implementation)
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  Mount Fuji & Hakone Tour                                    │
│  📍 Kanto  ⏰ 8 hours  💰 From ¥60,000                      │
│                                                               │
├─────────────────────────────────┬───────────────────────────┤
│                                 │                             │
│  [Only showing Important Notes] │   Book This Tour          │
│                                 │   [Booking Card]          │
│                                 │                             │
│                                 │                             │
└─────────────────────────────────┴───────────────────────────┘
```

## After (New Implementation)
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  Mount Fuji & Hakone Tour                                    │
│  📍 Kanto  ⏰ 8 hours  💰 From ¥60,000                      │
│                                                               │
├─────────────────────────────────┬───────────────────────────┤
│                                 │                             │
│  ┌─────────────────────────┐   │   Book This Tour          │
│  │ 📖 About This Tour       │   │   [Booking Card]          │
│  │ Overview paragraph...    │   │   (Sticky on scroll)      │
│  └─────────────────────────┘   │                             │
│                                 │                             │
│  ┌─────────────────────────┐   │                             │
│  │ ✨ Tour Highlights       │   │                             │
│  │ ✓ Visit Mount Fuji       │   │                             │
│  │ ✓ Lake Ashi cruise       │   │                             │
│  │ ✓ Hakone Shrine          │   │                             │
│  └─────────────────────────┘   │                             │
│                                 │                             │
│  ┌─────────────────────────┐   │                             │
│  │ ⏰ Duration              │   │                             │
│  │ [10-12 hours badge]      │   │                             │
│  └─────────────────────────┘   │                             │
│                                 │                             │
│  ┌─────────────────────────┐   │                             │
│  │ 🗺️ Detailed Itinerary    │   │                             │
│  │ ① 08:00 AM - Pick-up     │   │                             │
│  │ │                         │   │                             │
│  │ ② 09:30 AM - Mt Fuji     │   │                             │
│  │ │                         │   │                             │
│  │ ③ 11:00 AM - Lunch       │   │                             │
│  └─────────────────────────┘   │                             │
│                                 │                             │
│  ┌─────────────────────────┐   │                             │
│  │ ✅ What's Included       │   │                             │
│  │ ✓ Hotel pick-up          │   │                             │
│  │ ✓ English guide          │   │                             │
│  │ ✓ Vehicle                │   │                             │
│  └─────────────────────────┘   │                             │
│                                 │                             │
│  ┌─────────────────────────┐   │                             │
│  │ ❌ What's NOT Included   │   │                             │
│  │ ✗ Lunch & dinner         │   │                             │
│  │ ✗ Personal expenses      │   │                             │
│  └─────────────────────────┘   │                             │
│                                 │                             │
│  ┌─────────────────────────┐   │                             │
│  │ 🎒 What to Bring         │   │                             │
│  │ ✓ Comfortable shoes      │   │                             │
│  │ ✓ Camera                 │   │                             │
│  │ ✓ Weather gear           │   │                             │
│  └─────────────────────────┘   │                             │
│                                 │                             │
│  ┌─────────────────────────┐   │                             │
│  │ 👥 Perfect For           │   │                             │
│  │ [Families] [Couples]     │   │                             │
│  │ [Nature lovers]          │   │                             │
│  └─────────────────────────┘   │                             │
│                                 │                             │
│  ┌─────────────────────────┐   │                             │
│  │ 📍 Meeting Point         │   │                             │
│  │ Pick-up from hotel...    │   │                             │
│  └─────────────────────────┘   │                             │
│                                 │                             │
│  ┌─────────────────────────┐   │                             │
│  │ 👶 Age Restrictions      │   │                             │
│  │ Suitable for all ages... │   │                             │
│  └─────────────────────────┘   │                             │
│                                 │                             │
│  ┌─────────────────────────┐   │                             │
│  │ ⚠️ Important Notes ▼     │   │                             │
│  │ [Click to expand]        │   │                             │
│  └─────────────────────────┘   │                             │
│                                 │                             │
│  ┌─────────────────────────┐   │                             │
│  │ 🖼️ Gallery               │   │                             │
│  │ [Image] [Image] [Image]  │   │                             │
│  └─────────────────────────┘   │                             │
│                                 │                             │
│  ┌─────────────────────────┐   │                             │
│  │ ⭐ Customer Reviews      │   │                             │
│  │ (Existing component)     │   │                             │
│  └─────────────────────────┘   │                             │
│                                 │                             │
└─────────────────────────────────┴───────────────────────────┘
```

## Key Visual Features

### 1. Structured Cards
- White background
- Rounded corners (`rounded-xl`)
- Border (`border-gray-200`)
- Consistent padding (6)
- Proper spacing between sections (gap-6)

### 2. Section Headers
- Icon + Title on same line
- Text-2xl font
- Bold weight
- Proper gap (3)

### 3. Checklist Items
- Green checkmarks (✅) for included items
- Red X marks (❌) for excluded items
- Icon + text with gap
- Leading-relaxed for readability

### 4. Timeline (Itinerary)
- Numbered circles (1, 2, 3...)
- Vertical gradient line connecting them
- Time displayed separately (blue text)
- Description below time
- Proper spacing between items

### 5. Chips/Tags (Perfect For)
- Gradient background (purple-pink)
- Rounded-full shape
- Border and shadow
- Flex-wrap layout
- Gap between chips

### 6. Info Boxes
- Meeting Point: Blue background
- Age Restrictions: Orange background
- Icon + text layout
- Rounded corners

### 7. Accordion (Important Notes)
- Amber/warning colors
- Click to expand/collapse
- Chevron icon rotates
- Smooth transition
- Collapsible content area

### 8. Responsive Design
- Mobile: Single column
- Desktop: 2 columns (content + booking card)
- Booking card is sticky on desktop
- All cards stack nicely on mobile

## Color Palette

```css
- White cards: bg-white
- Borders: border-gray-200
- Text: text-gray-700, text-gray-900
- Highlights/Included: text-green-600
- Not Included: text-red-600
- Duration badge: bg-purple-50, text-purple-700
- Timeline: bg-blue-500 gradient
- Perfect For chips: purple-pink gradient
- Meeting Point: bg-blue-50, border-blue-200
- Age Restrictions: bg-orange-50, border-orange-200
- Important Notes: bg-amber-50, border-amber-200
```

## Typography

```css
- Section titles: text-2xl font-bold
- Body text: text-gray-700 leading-relaxed
- Time stamps: text-sm font-semibold text-blue-600
- Badges: text-sm font-medium
```

## Spacing

```css
- Between sections: space-y-6
- Inside cards: p-6
- Between list items: space-y-3
- Icon gaps: gap-3
- Chip gaps: gap-2
```

## Icons

All icons are inline emojis for simplicity:
- 📖 About
- ✨ Highlights
- ⏰ Duration
- 🗺️ Itinerary
- ✅ Included
- ❌ Not Included
- 🎒 What to Bring
- 👥 Perfect For
- 📍 Meeting Point
- 👶 Age Restrictions
- ⚠️ Important Notes

## Result

A clean, scannable, Klook-style layout that makes it easy for customers to:
1. ✅ Understand what's included
2. ✅ See the itinerary at a glance
3. ✅ Know what to bring
4. ✅ Check restrictions
5. ✅ Read important notes
6. ✅ Decide if the tour is right for them
7. ✅ Book with confidence
