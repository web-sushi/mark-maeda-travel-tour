# Transfer Description Formatting Guide

**For Admins:** How to write beautiful, well-formatted transfer descriptions

---

## Overview

The Transfer detail page now supports **multiple content formats** with smart detection:

1. ✅ **Markdown** (Recommended) - Rich formatting with headings, lists, bold, etc.
2. ✅ **Plain text** - Automatic paragraph formatting with line break preservation
3. ✅ **Legacy HTML** - Basic tags safely converted to readable format

The system automatically detects which format you're using and renders it beautifully!

---

## ✨ Recommended: Markdown Format

Markdown provides the best visual quality and matches the Tour detail page styling.

### Basic Markdown Syntax

#### Headings
```markdown
## Main Heading (appears as large, bold heading)
### Sub-heading (appears as medium, bold heading)
```

#### Paragraphs
Just write text. Leave a blank line between paragraphs.
```markdown
This is the first paragraph describing the transfer service.

This is the second paragraph with more details about pickup locations.
```

#### Bold & Italic
```markdown
**Bold text** for emphasis
*Italic text* for subtle emphasis
```

#### Lists

**Bullet lists:**
```markdown
- First item
- Second item
- Third item
```

**Numbered lists:**
```markdown
1. First step
2. Second step
3. Third step
```

#### Links
```markdown
[Click here](https://example.com) to learn more.
```

#### Blockquotes
```markdown
> Important: Driver will wait for 60 minutes after flight landing.
```

---

## 📝 Complete Example: Narita Airport Transfer

Here's a full example you can copy/paste into the Admin form:

```markdown
## About This Transfer

Experience **comfortable and reliable** private transfer service from Narita Airport to central Tokyo. Our professional drivers ensure a smooth journey to your hotel or accommodation.

### Service Features

- Professional English-speaking driver
- Meet & greet at arrivals hall with name sign
- Flight tracking included (no extra charge for delays)
- Free cancellation up to 24 hours before pickup
- Child seats available upon request

### Pickup Process

1. After collecting your luggage, proceed to the arrivals hall
2. Look for your driver holding a sign with your name
3. Driver will assist with luggage and guide you to the vehicle
4. Enjoy your comfortable ride to your destination

### Vehicle Options

We offer three vehicle types to suit your group size:

**Standard Sedan** (1-3 passengers)
- Toyota Crown or similar
- 2 large suitcases + 2 carry-ons

**Premium Van** (4-7 passengers)
- Toyota Alphard or similar
- 4 large suitcases + hand luggage

**Large Van** (8-12 passengers)
- Toyota Hiace or similar
- 8 large suitcases + hand luggage

### Travel Time

Typical journey times from Narita Airport:

- Tokyo Station: 60-90 minutes
- Shinjuku: 90-120 minutes
- Shibuya: 90-120 minutes

*Note: Times may vary depending on traffic conditions.*

### What's Included

- Private door-to-door transfer
- All tolls and parking fees
- English-speaking driver
- Meet & greet service
- Flight delay monitoring
- Bottled water

### Important Notes

> Please provide your flight number at booking so we can track your arrival and adjust pickup time if needed.

For pickups from Tokyo to Narita Airport, please book at least 24 hours in advance and allow extra time for traffic.

### Contact Information

For any questions or special requests, please contact us after booking through the "Manage Booking" page.
```

---

## 🎨 How It Renders

When you paste the above Markdown, it will render as:

- **Large, bold section headings** with icons (🚐)
- **Properly spaced paragraphs** with readable line height
- **Styled lists** with bullets/numbers
- **Bold text** for emphasis
- **Blockquotes** with left border and background
- **Beautiful typography** using Tailwind prose classes

---

## Alternative Formats

### Plain Text (Auto-formatted)

If you paste plain text with line breaks, the system will automatically:
- Convert double line breaks to paragraphs
- Detect bullet points (-, *, +, •) and format as lists
- Preserve basic formatting

Example:
```
About This Transfer

Experience comfortable private transfer from Narita Airport.

Service Features:
- Professional driver
- Flight tracking
- Free cancellation

Pickup is at arrivals hall.
```

### Legacy HTML (Safely Handled)

If your existing content has HTML tags, the system will:
- Convert `<br>` to line breaks
- Convert `<h2>`, `<h3>` to Markdown headings
- Strip unsafe tags automatically
- Render as formatted content

However, **we recommend converting to Markdown** for the best results.

---

## Admin Form Instructions

### Where to Add Content

1. Go to **Admin Panel** → **Transfers**
2. Click **Edit** on the transfer you want to update
3. Find the **Description** field (large text area)
4. Paste your Markdown content
5. Click **Save**

### Tips for Best Results

1. ✅ **Use Markdown syntax** for rich formatting
2. ✅ **Leave blank lines** between sections for spacing
3. ✅ **Use headings** (## and ###) to organize content
4. ✅ **Use lists** for features, steps, or options
5. ✅ **Bold important** words or phrases
6. ✅ **Keep paragraphs** short (2-3 sentences max)
7. ✅ **Test on mobile** - descriptions are responsive

### Important Notes Field

The **Important Notes** field (separate from description) also supports Markdown and will render in a highlighted amber box.

Example:
```markdown
**Booking Requirements:**
- Valid phone number required
- Flight number mandatory for airport pickups
- 24-hour advance booking recommended

**Cancellation Policy:**
- Free cancellation up to 24 hours before pickup
- 50% refund for cancellations within 24 hours
- No refund for no-shows
```

---

## Visual Comparison

### Before (Plain HTML/Text)
```
<h2>About This Transfer</h2><p>Professional transfer service from Narita...</p><br><strong>Features:</strong><br>- Driver<br>- Tracking
```
❌ Looks messy, hard to read, no spacing

### After (Markdown)
```markdown
## About This Transfer

Professional transfer service from Narita Airport to Tokyo hotels.

### Features
- Professional English-speaking driver
- Real-time flight tracking
- Meet & greet service
```
✅ Clean, beautiful, easy to read, professional

---

## Markdown Cheat Sheet (Quick Reference)

| Element | Syntax | Example |
|---------|--------|---------|
| Heading 2 | `## Text` | ## Service Details |
| Heading 3 | `### Text` | ### Vehicle Options |
| Bold | `**text**` | **Important** |
| Italic | `*text*` | *Note: times vary* |
| Bullet List | `- item` | - Feature 1 |
| Numbered List | `1. item` | 1. Step one |
| Link | `[text](url)` | [Contact us](https://...) |
| Blockquote | `> text` | > Important reminder |
| Line Break | (blank line) | (just press Enter twice) |

---

## Sample Templates

### Template 1: Airport Transfer

```markdown
## Comfortable Private Transfer

Professional transfer service between [LOCATION A] and [LOCATION B].

### What's Included
- Private door-to-door service
- English-speaking driver
- Meet & greet
- Flight tracking (airport pickups)

### Booking Process
1. Select your vehicle type
2. Enter pickup and dropoff details
3. Complete booking
4. Receive confirmation email

### Contact
For special requests, contact us after booking.
```

### Template 2: City Transfer

```markdown
## City Transfer Service

Travel comfortably between major Tokyo districts with our private transfer service.

### Service Highlights
- Experienced local drivers
- Clean, well-maintained vehicles
- Fixed pricing (no surge charges)
- 24/7 customer support

### Popular Routes
- Shibuya to Narita Airport
- Shinjuku to Haneda Airport
- Tokyo Station to Disney Resort

### Vehicle Options
Choose from sedan (1-3 pax), van (4-7 pax), or large van (8-12 pax).
```

### Template 3: Ski Resort Transfer

```markdown
## Ski Resort Transfer

Direct transfer from Tokyo to popular ski resorts in Nagano and Niigata.

### Features
- Spacious vehicles with ski/snowboard storage
- Experienced mountain driving
- English-speaking drivers
- Complimentary bottled water

### Pickup Locations
We pick up from:
- Major Tokyo hotels
- Tokyo Station
- Shinjuku Station
- Haneda Airport
- Narita Airport

### Travel Time
- Hakuba: 4-5 hours
- Nozawa Onsen: 3.5-4.5 hours
- Myoko: 4-5 hours

*Times are approximate and depend on road conditions.*

### Important
> Winter tires and chains are standard equipment. Our drivers are experienced with mountain roads and winter conditions.
```

---

## Troubleshooting

### Description looks wrong or messy
- **Check for HTML tags** - Convert to Markdown instead
- **Check spacing** - Add blank lines between paragraphs
- **Check syntax** - Make sure headings use `##` not `<h2>`

### Lists not rendering correctly
- Make sure each list item starts with `-`, `*`, or `1.`
- Add a blank line before and after the list
- Keep consistent indentation

### Bold text not working
- Use `**text**` not `<strong>text</strong>`
- Make sure there's no space after opening `**`
- Example: `**Bold**` ✅ `** Bold**` ❌

### Headings too small/large
- Use `##` for main sections (largest)
- Use `###` for sub-sections (medium)
- Don't use `#` (too large)

---

## Technical Details (For Developers)

### Auto-Detection Logic
The system checks content for:
1. Markdown syntax (`##`, `**`, list markers)
2. HTML tags (`<h2>`, `<p>`, `<br>`)
3. Falls back to plain text formatting

### Rendering Pipeline
1. Content → Format Detection
2. Markdown → `react-markdown` + `remark-gfm`
3. HTML → Safe stripping + conversion to Markdown
4. Plain text → Auto-paragraph formatting
5. Output → Tailwind prose styling

### Styling Classes
- `prose prose-lg max-w-none` - Base typography
- Section backgrounds: `bg-white rounded-xl border`
- Icons: 🚐 (transfer), ⚠️ (notes)
- Responsive: All layouts adapt to mobile

---

## Questions?

If you need help formatting your transfer descriptions, refer to this guide or contact the development team.

**Last Updated:** Feb 10, 2026  
**Version:** 1.0
