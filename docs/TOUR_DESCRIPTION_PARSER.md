# Tour Description Parser & Structured Display

## Overview

This implementation parses the `tours.description` TEXT field (which contains a full tour writeup with multiple sections) into structured data and renders it in a clean, Klook-style layout.

## Architecture

### 1. Parser Utility (`lib/parseTourDescription.ts`)

**Purpose:** Parse a single large text block into structured sections.

**Supported Sections:**
- Overview/Intro (content before first heading)
- Tour Highlights
- Duration
- Detailed Sample Itinerary (with timeline)
- What's Included
- What's NOT Included
- What to Bring
- Perfect For
- Meeting Point
- Age Restrictions
- Important Notes

**Features:**
- ✅ Emoji-tolerant (handles ✨🗺️📍 etc.)
- ✅ Flexible heading formats (with/without colons, extra spaces)
- ✅ Timeline parsing (e.g., "08:30 AM - Pick-up" or "09:00-10:15 AM")
- ✅ Bullet list parsing (handles •, -, *, emoji bullets)
- ✅ Graceful handling of missing sections
- ✅ No SSR/hydration issues (no Date.now(), Math.random(), window/document)

### 2. UI Components (`components/tours/`)

**Section.tsx**
- Wrapper component with title, optional icon, border, padding
- Consistent styling across all sections

**Checklist.tsx**
- Renders bullet lists with checkmarks (green) or X marks (red)
- Used for: Highlights, Included, Not Included, What to Bring

**Timeline.tsx**
- Renders itinerary items with timeline dots and connecting line
- Supports time stamps (e.g., "08:30 AM") or sequential numbering
- Gradient vertical line for visual appeal

**Chips.tsx**
- Renders tags/badges in a flex-wrap layout
- Used for: Perfect For section
- Colorful gradient backgrounds

**Accordion.tsx**
- Collapsible section for Important Notes
- Click to expand/collapse
- Warning icon and amber styling
- Client component with useState (safe for hydration)

**TourDescription.tsx**
- Main component that brings everything together
- Receives description text and optional importantNotes fallback
- Calls parser and renders all sections
- Uses all UI components above

### 3. Integration (`app/(marketing)/tours/[slug]/page.tsx`)

Replaced `DetailContent` with `TourDescription`:

```tsx
<TourDescription
  description={tour.description || ""}
  importantNotes={tour.important_notes}
/>
```

## Example Tour Description Format

Here's an example of how admins should format `tours.description`:

```
Discover the beauty of Mount Fuji and the historic town of Hakone on this comprehensive day tour. Enjoy stunning views, hot springs, and traditional Japanese culture.

Tour Highlights:
✨ Visit iconic Mount Fuji 5th Station (weather permitting)
✨ Cruise across Lake Ashi with views of Mount Fuji
🏯 Explore Hakone Shrine with its famous torii gate
🚡 Ride the Hakone Ropeway for panoramic mountain views
♨️ Experience a traditional Japanese hot spring (onsen)

Duration:
Approximately 10-12 hours (hotel pick-up to drop-off)

Detailed Sample Itinerary:
08:00 AM - Hotel pick-up in Tokyo
09:30-10:30 AM - Mount Fuji 5th Station visit
11:00 AM - Traditional Japanese lunch
12:30-01:30 PM - Lake Ashi cruise
02:00-03:00 PM - Hakone Shrine visit
03:30 PM - Hakone Ropeway experience
05:00 PM - Depart for Tokyo
07:00 PM - Hotel drop-off

What's Included:
✅ Hotel pick-up and drop-off in central Tokyo
✅ English-speaking professional guide
✅ Private air-conditioned vehicle
✅ Lake Ashi cruise ticket
✅ Hakone Ropeway ticket
✅ All tolls and parking fees
✅ Bottled water

What's NOT Included:
❌ Lunch and dinner
❌ Personal expenses
❌ Travel insurance
❌ Gratuities (optional)

What to Bring:
🎒 Comfortable walking shoes
🎒 Weather-appropriate clothing
🎒 Camera for photos
🎒 Sun protection (hat, sunglasses, sunscreen)
🎒 Cash for personal purchases

Perfect For:
First-time visitors to Japan, Families with children, Photography enthusiasts, Nature lovers, Cultural explorers

Meeting Point:
Pick-up from your hotel in central Tokyo (Shibuya, Shinjuku, Ginza areas). Specific meeting point will be confirmed upon booking.

Age Restrictions:
This tour is suitable for all ages. Children under 3 years old are free of charge but must share seating with parents.

Important Notes:
❗️ Mount Fuji 5th Station access depends on weather conditions
❗️ The tour may be modified due to weather or traffic
❗️ Please inform us of any dietary restrictions in advance
❗️ Comfortable walking shoes are essential
❗️ The itinerary is subject to change based on seasonal conditions
```

## Parsing Rules

### Heading Detection
- Case-insensitive
- Optional trailing colon
- Emoji-tolerant (emojis before heading are ignored)
- Extra spaces are trimmed

### Content Parsing

**Highlights, Included, Not Included, What to Bring:**
- Parsed as bullet lists
- Each line becomes a list item
- Bullet markers (•, -, *, emojis) are removed
- Empty lines are skipped

**Itinerary:**
- Parsed as timeline items
- Lines with time patterns (e.g., "08:30 AM - ...") become timeline items
- Time is extracted and displayed separately
- Lines without time patterns are treated as regular descriptions

**Perfect For:**
- Parsed as chips/tags
- Split by commas or newlines
- Each item becomes a colorful badge

**Duration, Meeting Point, Age Restrictions:**
- Kept as simple text content
- Rendered in styled info boxes

**Important Notes:**
- Can be parsed as bullets or plain text
- Rendered in collapsible accordion
- Falls back to `tours.important_notes` field if not in description

## Benefits

1. **Single Source of Truth:** All content in `tours.description`
2. **Admin-Friendly:** Simple text formatting, no complex JSON
3. **Flexible:** Missing sections are gracefully skipped
4. **Beautiful UI:** Klook-style structured layout
5. **Consistent:** Reusable components across all tours
6. **Performant:** No client-side parsing (done server-side)
7. **SEO-Friendly:** All content rendered on server
8. **Accessible:** Proper semantic HTML and ARIA labels

## Migration Guide

If you have existing tours with data in separate fields:

1. **Combine data into `tours.description`:**
   ```sql
   UPDATE tours
   SET description = 
     'Tour Highlights:
     ' || highlights[1] || '
     ' || highlights[2] || '
     ...
     
     What''s Included:
     ' || included_items || '
     
     Important Notes:
     ' || important_notes
   WHERE ...;
   ```

2. **Keep `tours.important_notes` as fallback:**
   - The parser will use it if "Important Notes" not found in description

3. **Test the parser:**
   - View tour detail page
   - Verify all sections render correctly
   - Check for missing sections

## Troubleshooting

**Section not showing:**
- Check heading format matches patterns (see `SECTION_PATTERNS` in parser)
- Ensure heading is on its own line
- Try adding/removing trailing colon

**Timeline not parsing:**
- Use format: "HH:MM AM/PM - Description"
- Alternative: "HH:MM-HH:MM AM/PM Description"
- Ensure time is at the start of the line

**Bullets not rendering:**
- Each bullet should be on a new line
- Supported markers: •, -, *, ✅, ❌, etc.
- Empty lines between bullets are fine

**Accordion not collapsing:**
- This is a client component using useState
- Check browser console for React errors
- Ensure no hydration mismatches

## Future Enhancements

1. **Rich Text Support:** Add markdown parsing for bold, italic, links
2. **Image Insertion:** Allow images within description sections
3. **Video Embeds:** Support YouTube/Vimeo embeds in description
4. **Interactive Maps:** Render meeting point as interactive map
5. **Multi-language:** Parse and display multiple language versions
6. **Admin Preview:** Live preview of parsed sections in admin panel
