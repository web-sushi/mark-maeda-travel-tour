# Legal Pages Implementation

## Overview

Two comprehensive legal pages have been created for the Mark Maeda Travel & Tour website to ensure compliance before going live with Stripe payments. These pages cover data protection, payment terms, cancellation policies, and liability limitations.

## Files Created

### 1. Privacy Policy Page
**Path:** `src/app/(legal)/privacy/page.tsx`
**URL:** `/privacy`

### 2. Terms & Conditions Page
**Path:** `src/app/(legal)/terms/page.tsx`
**URL:** `/terms`

## Footer Integration

**File:** `src/components/layout/Footer.tsx`

The footer already contains links to both legal pages:
- Line 83: Privacy Policy link
- Line 86: Terms of Service link

No modifications were needed to the footer.

## Page Structure

### Privacy Policy (12 Sections)

1. **Introduction** - Overview of privacy commitment
2. **Information We Collect**
   - Personal information (name, email, phone)
   - Booking information (dates, locations, passengers)
   - Technical data (IP, browser, device)
3. **How We Use Your Information** - Service delivery, communication, payment processing
4. **Third-Party Services**
   - Stripe (payment processing)
   - Supabase (data hosting)
   - Brevo (email communications)
   - Vercel (website hosting)
5. **Data Storage & Security** - Encryption, access controls, backups
6. **Data Retention** - Retention periods for different data types
7. **Your Rights** - Access, correction, deletion, portability
8. **Cookies and Tracking** - Essential, analytics, preference cookies
9. **International Data Transfers** - Cross-border data handling
10. **Children's Privacy** - Protection for users under 18
11. **Changes to Privacy Policy** - Update procedures
12. **Contact Information** - How to reach the business

### Terms & Conditions (14 Sections)

1. **Acceptance of Terms** - Legal agreement overview
2. **Services Overview** - Types of services offered
3. **Booking & Payment**
   - Booking process and requirements
   - Pricing (included and excluded items)
   - Deposit payment (25%, 50%, or 100%)
   - Remaining balance (due 7 days before travel)
   - Payment security via Stripe
4. **Cancellation Policy**
   - 14+ days: Full refund
   - 7-14 days: 50% refund
   - Less than 3 days: No refund
   - No-show: No refund
5. **Changes & Modifications** - How to modify bookings
6. **Customer Responsibilities** - Punctuality, conduct, safety
7. **Liability Limitations**
   - Insurance coverage
   - Limitation of liability
   - Personal belongings disclaimer
8. **Force Majeure** - Natural disasters, acts of God
9. **Intellectual Property** - Copyright protection
10. **Privacy** - Link to Privacy Policy
11. **Governing Law** - Japanese law, Tokyo jurisdiction
12. **Severability** - Invalid provisions don't affect rest
13. **Entire Agreement** - Complete agreement statement
14. **Contact Information** - Business contact details

## Placeholder Constants

Both pages use clearly marked constants at the top of the file for easy replacement:

```typescript
const BUSINESS_NAME = "Mark Maeda Travel & Tour";
const BUSINESS_EMAIL = "contact@markmaeda.com";
const BUSINESS_PHONE = "+81 (0)XX-XXXX-XXXX";
const BUSINESS_ADDRESS = "Tokyo, Japan";
const LAST_UPDATED = "February 2026";
```

**Terms page also includes:**
```typescript
const CANCELLATION_POLICY = {
  FULL_REFUND_DAYS: 14,
  PARTIAL_REFUND_DAYS: 7,
  PARTIAL_REFUND_PERCENT: 50,
  NO_REFUND_DAYS: 3,
};
```

## Styling & Design

### Layout
- Uses `Container` component for consistent max-width (7xl)
- White card with shadow on gray background
- Responsive padding (8 on mobile, 12 on desktop)
- Max-width 4xl for optimal reading experience

### Typography
- H1: 4xl, bold, gray-900
- H2: 2xl, semibold, gray-900, mb-4
- H3: xl, semibold, gray-800, mb-3, mt-6
- Body text: gray-700, leading-relaxed
- Proper spacing between sections (mb-8)

### Visual Elements
- Colored info boxes (blue-50, border-l-4)
- Icon-enhanced lists (SVG icons for bullet points)
- Contact information cards (gray-50 background)
- Border separators between major sections
- Styled links (blue-600, hover:blue-800, underline)

### Accessibility
- Semantic HTML (proper heading hierarchy)
- Descriptive section headings
- Clear list structures
- Sufficient color contrast
- Responsive design for all screen sizes

## Compliance Features

### Privacy Policy Compliance
✅ **Japan APPI (Act on the Protection of Personal Information)**
- Clear purpose of data collection
- Transparent data usage explanation
- User rights clearly outlined
- Data retention periods specified

✅ **GDPR-aligned** (for international visitors)
- Lawful basis for processing
- Data subject rights
- Third-party processor disclosure
- International data transfer notice

### Terms & Conditions Coverage
✅ **Stripe Requirements**
- Payment processing disclosure
- PCI-DSS compliance mention
- Secure payment handling explanation

✅ **Business Protection**
- Liability limitations
- Force majeure clause
- Cancellation policy (clear refund structure)
- Customer responsibilities
- Insurance coverage disclosure

✅ **Japanese Law Compliance**
- Governing law: Japan
- Jurisdiction: Tokyo courts
- Proper legal language for Japan-based business

## Pre-Launch Checklist

Before going live, replace the following placeholders:

### Contact Information
- [ ] Update `BUSINESS_EMAIL` with actual email
- [ ] Update `BUSINESS_PHONE` with actual phone number
- [ ] Update `BUSINESS_ADDRESS` with complete business address
- [ ] Update `LAST_UPDATED` to actual launch date

### Cancellation Policy (Terms page only)
- [ ] Confirm `FULL_REFUND_DAYS: 14` matches business policy
- [ ] Confirm `PARTIAL_REFUND_DAYS: 7` matches business policy
- [ ] Confirm `PARTIAL_REFUND_PERCENT: 50` matches business policy
- [ ] Confirm `NO_REFUND_DAYS: 3` matches business policy

### Legal Review
- [ ] Have a lawyer review both documents for Japan compliance
- [ ] Verify insurance coverage details match actual policies
- [ ] Confirm Stripe, Supabase, Brevo, Vercel mentions are accurate
- [ ] Review pricing inclusions/exclusions match actual service
- [ ] Verify data retention periods align with business practices

### Footer Links
- [ ] Verify footer links work correctly on all pages
- [ ] Test responsive behavior of footer on mobile devices

## Routes Available

After implementation, the following routes are live:

| Route | Page | Status |
|-------|------|--------|
| `/privacy` | Privacy Policy | ✅ Active |
| `/terms` | Terms & Conditions | ✅ Active |

## Build Verification

✅ **Build Status:** Success (exit code 0)
✅ **TypeScript:** No errors
✅ **Linter:** No errors
✅ **Routes Generated:** Both `/privacy` and `/terms` appear in build output

## Testing Recommendations

### Manual Testing
1. **Navigation**
   - [ ] Click footer "Privacy Policy" link from homepage
   - [ ] Click footer "Terms of Service" link from homepage
   - [ ] Test links on mobile devices
   - [ ] Verify back button works correctly

2. **Content Display**
   - [ ] All sections render properly
   - [ ] All headings use correct hierarchy (h1 > h2 > h3)
   - [ ] Lists display correctly (bullets, spacing)
   - [ ] Contact information boxes render properly
   - [ ] Icons display in cancellation policy boxes

3. **Responsive Design**
   - [ ] Test on mobile (320px - 768px)
   - [ ] Test on tablet (768px - 1024px)
   - [ ] Test on desktop (1024px+)
   - [ ] Verify text is readable at all sizes
   - [ ] Check padding/margins are appropriate

4. **Cross-browser**
   - [ ] Chrome
   - [ ] Safari (especially for iOS users visiting Japan)
   - [ ] Firefox
   - [ ] Edge

### SEO & Meta Tags

Both pages include proper metadata:
```typescript
export const metadata: Metadata = {
  title: "Privacy Policy | Mark Maeda Travel & Tour",
  description: "...",
};
```

### Accessibility
- [ ] Screen reader compatibility
- [ ] Keyboard navigation (tab through links)
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Semantic HTML structure

## Integration with Payment Flow

The legal pages are designed to support the Stripe payment integration:

1. **Privacy Policy** mentions:
   - Stripe as payment processor
   - PCI-DSS compliance
   - Data storage with Supabase
   - Email handling via Brevo

2. **Terms & Conditions** covers:
   - Deposit payment options (25%, 50%, 100%)
   - Remaining balance payment (7 days before travel)
   - Secure payment via Stripe
   - Refund processing (7-10 business days)

## Future Enhancements (Optional)

Consider adding in future updates:
- [ ] Cookie consent banner (if tracking cookies are added)
- [ ] Downloadable PDF versions of legal documents
- [ ] Multiple language support (Japanese, English)
- [ ] Version history of terms (for transparency)
- [ ] Email notification when terms are updated
- [ ] "Last reviewed by lawyer" date field

## Support Resources

If customers have questions about legal pages:
- Privacy questions → Contact via email at `BUSINESS_EMAIL`
- Terms questions → Contact via email or phone
- Data access requests → Follow process in Privacy Policy Section 7
- Cancellation requests → Follow process in Terms Section 4

## Notes

- Both pages use App Router structure (`(legal)` route group)
- Pages are server-rendered (no client-side state needed)
- All external links open in new tabs with proper security attributes
- Internal links (e.g., Privacy to Terms) use Next.js `<Link>` component
- Styling matches existing site design (navy/pink brand colors in footer)
- Mobile-first responsive design throughout
