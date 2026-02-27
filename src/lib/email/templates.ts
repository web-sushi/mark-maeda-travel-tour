// Email templates for booking lifecycle notifications
// Returns { subject, html, text } for each template

import { Booking } from "@/types/booking";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getTrackingLink(referenceCode: string): string {
  return `${siteUrl}/booking/track?ref=${referenceCode}`;
}

// Base HTML template structure
function createEmailHTML(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${content}
</body>
</html>
  `;
}

// 1. Booking Received - Customer
export function bookingReceivedCustomer(booking: Booking) {
  const subject = `Booking Received - ${booking.reference_code}`;
  
  // Calculate deposit details
  const depositPercent = booking.deposit_choice || 100;
  const amountDueNow = Math.round((booking.total_amount * depositPercent) / 100);
  const remainingAfterDeposit = booking.total_amount - amountDueNow;
  
  const html = createEmailHTML(`
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h1 style="margin: 0; color: #111827;">Booking Received</h1>
    </div>
    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p>Dear ${booking.customer_name},</p>
      <p>Thank you for your booking! We've received your request and are processing your payment.</p>
      
      <div style="margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>Reference Code:</strong> ${booking.reference_code}</p>
        <p style="margin: 10px 0;"><strong>Travel Date:</strong> ${formatDate(booking.travel_date)}</p>
        ${booking.pickup_location ? `<p style="margin: 10px 0;"><strong>Pickup:</strong> ${booking.pickup_location}</p>` : ""}
        ${booking.dropoff_location ? `<p style="margin: 10px 0;"><strong>Dropoff:</strong> ${booking.dropoff_location}</p>` : ""}
        ${booking.passengers_count ? `<p style="margin: 10px 0;"><strong>Passengers:</strong> ${booking.passengers_count}</p>` : ""}
        ${booking.large_suitcases ? `<p style="margin: 10px 0;"><strong>Large Suitcases:</strong> ${booking.large_suitcases}</p>` : ""}
      </div>

      <div style="margin: 20px 0; background-color: #f9fafb; padding: 15px; border-radius: 6px;">
        <h3 style="color: #374151; margin: 0 0 10px 0;">Payment Details</h3>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${formatCurrency(booking.total_amount)}</p>
        <p style="margin: 5px 0;"><strong>Selected Payment:</strong> ${depositPercent}% ${depositPercent === 100 ? "(Full Payment)" : "(Deposit)"}</p>
        <p style="margin: 5px 0; color: #2563eb;"><strong>Amount Due Now:</strong> ${formatCurrency(amountDueNow)}</p>
        ${
          remainingAfterDeposit > 0
            ? `<p style="margin: 5px 0; color: #dc2626;"><strong>Remaining After Payment:</strong> ${formatCurrency(remainingAfterDeposit)}</p>`
            : ""
        }
      </div>

      ${
        remainingAfterDeposit > 0
          ? `<p style="color: #92400e; background-color: #fef3c7; padding: 10px; border-radius: 6px; font-size: 14px;">The remaining balance of ${formatCurrency(remainingAfterDeposit)} will be due before your travel date.</p>`
          : ""
      }

      <p style="margin-top: 20px;">
        <a href="${getTrackingLink(booking.reference_code)}" style="color: #2563eb; text-decoration: none;">Track your booking</a>
      </p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p>If you have any questions, please contact us with your reference code.</p>
      </div>
    </div>
  `);

  const text = `
Booking Received

Dear ${booking.customer_name},

Thank you for your booking! We've received your request and are processing your payment.

Reference Code: ${booking.reference_code}
Travel Date: ${formatDate(booking.travel_date)}
${booking.pickup_location ? `Pickup: ${booking.pickup_location}` : ""}
${booking.dropoff_location ? `Dropoff: ${booking.dropoff_location}` : ""}
${booking.passengers_count ? `Passengers: ${booking.passengers_count}` : ""}
${booking.large_suitcases ? `Large Suitcases: ${booking.large_suitcases}` : ""}

Payment Details:
Total Amount: ${formatCurrency(booking.total_amount)}
Selected Payment: ${depositPercent}% ${depositPercent === 100 ? "(Full Payment)" : "(Deposit)"}
Amount Due Now: ${formatCurrency(amountDueNow)}
${remainingAfterDeposit > 0 ? `Remaining After Payment: ${formatCurrency(remainingAfterDeposit)}` : ""}

${remainingAfterDeposit > 0 ? `Note: The remaining balance of ${formatCurrency(remainingAfterDeposit)} will be due before your travel date.` : ""}

Track your booking: ${getTrackingLink(booking.reference_code)}

If you have any questions, please contact us with your reference code.
  `.trim();

  return { subject, html, text };
}

// 2. Booking Received - Admin
export function bookingReceivedAdmin(booking: Booking) {
  const subject = `New Booking Received - ${booking.reference_code}`;
  
  const html = createEmailHTML(`
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h1 style="margin: 0; color: #111827;">New Booking Received</h1>
    </div>
    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p><strong>Reference Code:</strong> ${booking.reference_code}</p>
      
      <div style="margin: 20px 0;">
        <h3 style="color: #374151; margin-bottom: 10px;">Customer</h3>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${booking.customer_name}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${booking.customer_email}</p>
        ${booking.customer_phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${booking.customer_phone}</p>` : ""}
      </div>

      <div style="margin: 20px 0;">
        <h3 style="color: #374151; margin-bottom: 10px;">Travel Details</h3>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(booking.travel_date)}</p>
        ${booking.pickup_location ? `<p style="margin: 5px 0;"><strong>Pickup:</strong> ${booking.pickup_location}</p>` : ""}
        ${booking.dropoff_location ? `<p style="margin: 5px 0;"><strong>Dropoff:</strong> ${booking.dropoff_location}</p>` : ""}
        ${booking.passengers_count ? `<p style="margin: 5px 0;"><strong>Passengers:</strong> ${booking.passengers_count}</p>` : ""}
        ${booking.large_suitcases ? `<p style="margin: 5px 0;"><strong>Large Suitcases:</strong> ${booking.large_suitcases}</p>` : ""}
        <p style="margin: 5px 0;"><strong>Vehicles:</strong> ${booking.vehicles_count}</p>
      </div>

      <div style="margin: 20px 0;">
        <h3 style="color: #374151; margin-bottom: 10px;">Financial</h3>
        <p style="margin: 5px 0;"><strong>Total:</strong> ${formatCurrency(booking.total_amount)}</p>
        <p style="margin: 5px 0;"><strong>Paid:</strong> ${formatCurrency(booking.amount_paid)}</p>
        <p style="margin: 5px 0;"><strong>Remaining:</strong> ${formatCurrency(booking.remaining_amount)}</p>
      </div>

      <p style="margin-top: 20px;">
        <a href="${siteUrl}/admin/bookings/${booking.id}" style="color: #2563eb; text-decoration: none;">View in Admin</a>
      </p>
    </div>
  `);

  const text = `
New Booking Received

Reference Code: ${booking.reference_code}

Customer:
- Name: ${booking.customer_name}
- Email: ${booking.customer_email}
${booking.customer_phone ? `- Phone: ${booking.customer_phone}` : ""}

Travel Details:
- Date: ${formatDate(booking.travel_date)}
${booking.pickup_location ? `- Pickup: ${booking.pickup_location}` : ""}
${booking.dropoff_location ? `- Dropoff: ${booking.dropoff_location}` : ""}
${booking.passengers_count ? `- Passengers: ${booking.passengers_count}` : ""}
${booking.large_suitcases ? `- Large Suitcases: ${booking.large_suitcases}` : ""}
- Vehicles: ${booking.vehicles_count}

Financial:
- Total: ${formatCurrency(booking.total_amount)}
- Paid: ${formatCurrency(booking.amount_paid)}
- Remaining: ${formatCurrency(booking.remaining_amount)}

View in Admin: ${siteUrl}/admin/bookings/${booking.id}
  `.trim();

  return { subject, html, text };
}

// 3. Booking Confirmed - Customer
export function bookingConfirmedCustomer(booking: Booking) {
  const subject = `Booking Confirmed - ${booking.reference_code}`;
  
  const html = createEmailHTML(`
    <div style="background-color: #10b981; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h1 style="margin: 0; color: #ffffff;">Booking Confirmed!</h1>
    </div>
    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p>Dear ${booking.customer_name},</p>
      <p>Great news! Your booking has been confirmed.</p>
      
      <div style="margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>Reference Code:</strong> ${booking.reference_code}</p>
        <p style="margin: 10px 0;"><strong>Travel Date:</strong> ${formatDate(booking.travel_date)}</p>
        ${booking.pickup_location ? `<p style="margin: 10px 0;"><strong>Pickup:</strong> ${booking.pickup_location}</p>` : ""}
        ${booking.dropoff_location ? `<p style="margin: 10px 0;"><strong>Dropoff:</strong> ${booking.dropoff_location}</p>` : ""}
        ${booking.passengers_count ? `<p style="margin: 10px 0;"><strong>Passengers:</strong> ${booking.passengers_count}</p>` : ""}
        ${booking.large_suitcases ? `<p style="margin: 10px 0;"><strong>Large Suitcases:</strong> ${booking.large_suitcases}</p>` : ""}
        <p style="margin: 10px 0;"><strong>Total Amount:</strong> ${formatCurrency(booking.total_amount)}</p>
        ${booking.remaining_amount > 0 ? `<p style="margin: 10px 0;"><strong>Remaining Balance:</strong> ${formatCurrency(booking.remaining_amount)}</p>` : ""}
      </div>

      <p>We're looking forward to serving you!</p>

      <p style="margin-top: 20px;">
        <a href="${getTrackingLink(booking.reference_code)}" style="color: #2563eb; text-decoration: none;">Track your booking</a>
      </p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p>If you have any questions, please contact us with your reference code.</p>
      </div>
    </div>
  `);

  const text = `
Booking Confirmed!

Dear ${booking.customer_name},

Great news! Your booking has been confirmed.

Reference Code: ${booking.reference_code}
Travel Date: ${formatDate(booking.travel_date)}
${booking.pickup_location ? `Pickup: ${booking.pickup_location}` : ""}
${booking.dropoff_location ? `Dropoff: ${booking.dropoff_location}` : ""}
${booking.passengers_count ? `Passengers: ${booking.passengers_count}` : ""}
${booking.large_suitcases ? `Large Suitcases: ${booking.large_suitcases}` : ""}
Total Amount: ${formatCurrency(booking.total_amount)}
${booking.remaining_amount > 0 ? `Remaining Balance: ${formatCurrency(booking.remaining_amount)}` : ""}

We're looking forward to serving you!

Track your booking: ${getTrackingLink(booking.reference_code)}

If you have any questions, please contact us with your reference code.
  `.trim();

  return { subject, html, text };
}

// 4. Payment Marked Paid - Customer
export function paymentMarkedPaidCustomer(booking: Booking) {
  const subject = `Payment Received - ${booking.reference_code}`;
  
  const html = createEmailHTML(`
    <div style="background-color: #10b981; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h1 style="margin: 0; color: #ffffff;">Payment Received</h1>
    </div>
    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p>Dear ${booking.customer_name},</p>
      <p>We've received your payment for booking ${booking.reference_code}.</p>
      
      <div style="margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>Reference Code:</strong> ${booking.reference_code}</p>
        <p style="margin: 10px 0;"><strong>Travel Date:</strong> ${formatDate(booking.travel_date)}</p>
        <p style="margin: 10px 0;"><strong>Total Amount:</strong> ${formatCurrency(booking.total_amount)}</p>
        <p style="margin: 10px 0;"><strong>Amount Paid:</strong> ${formatCurrency(booking.amount_paid)}</p>
        ${booking.remaining_amount > 0 ? `<p style="margin: 10px 0;"><strong>Remaining Balance:</strong> ${formatCurrency(booking.remaining_amount)}</p>` : ""}
      </div>

      ${booking.remaining_amount === 0 ? '<p style="color: #10b981; font-weight: bold;">Your booking is fully paid!</p>' : ''}

      <p style="margin-top: 20px;">
        <a href="${getTrackingLink(booking.reference_code)}" style="color: #2563eb; text-decoration: none;">Track your booking</a>
      </p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p>Thank you for your payment!</p>
      </div>
    </div>
  `);

  const text = `
Payment Received

Dear ${booking.customer_name},

We've received your payment for booking ${booking.reference_code}.

Reference Code: ${booking.reference_code}
Travel Date: ${formatDate(booking.travel_date)}
Total Amount: ${formatCurrency(booking.total_amount)}
Amount Paid: ${formatCurrency(booking.amount_paid)}
${booking.remaining_amount > 0 ? `Remaining Balance: ${formatCurrency(booking.remaining_amount)}` : ""}

${booking.remaining_amount === 0 ? "Your booking is fully paid!" : ""}

Track your booking: ${getTrackingLink(booking.reference_code)}

Thank you for your payment!
  `.trim();

  return { subject, html, text };
}

// 5. Booking Cancelled - Customer
export function bookingCancelledCustomer(booking: Booking) {
  const subject = `Booking Cancelled - ${booking.reference_code}`;
  
  const html = createEmailHTML(`
    <div style="background-color: #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h1 style="margin: 0; color: #ffffff;">Booking Cancelled</h1>
    </div>
    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p>Dear ${booking.customer_name},</p>
      <p>Your booking ${booking.reference_code} has been cancelled.</p>
      
      <div style="margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>Reference Code:</strong> ${booking.reference_code}</p>
        <p style="margin: 10px 0;"><strong>Travel Date:</strong> ${formatDate(booking.travel_date)}</p>
        <p style="margin: 10px 0;"><strong>Total Amount:</strong> ${formatCurrency(booking.total_amount)}</p>
        ${booking.amount_paid > 0 ? `<p style="margin: 10px 0;"><strong>Amount Paid:</strong> ${formatCurrency(booking.amount_paid)}</p>` : ""}
      </div>

      ${booking.amount_paid > 0 ? '<p>If you made a payment, our team will contact you regarding the refund process.</p>' : ''}

      <p style="margin-top: 20px;">
        <a href="${getTrackingLink(booking.reference_code)}" style="color: #2563eb; text-decoration: none;">View booking details</a>
      </p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p>If you have any questions, please contact us with your reference code.</p>
      </div>
    </div>
  `);

  const text = `
Booking Cancelled

Dear ${booking.customer_name},

Your booking ${booking.reference_code} has been cancelled.

Reference Code: ${booking.reference_code}
Travel Date: ${formatDate(booking.travel_date)}
Total Amount: ${formatCurrency(booking.total_amount)}
${booking.amount_paid > 0 ? `Amount Paid: ${formatCurrency(booking.amount_paid)}` : ""}

${booking.amount_paid > 0 ? "If you made a payment, our team will contact you regarding the refund process." : ""}

View booking details: ${getTrackingLink(booking.reference_code)}

If you have any questions, please contact us with your reference code.
  `.trim();

  return { subject, html, text };
}

// 6. Review Request - Customer
export function reviewRequestCustomer(
  booking: Booking,
  items: Array<{ title: string; item_type: string }>,
  reviewLink: string
) {
  const subject = `Share Your Experience - ${booking.reference_code}`;
  
  const itemsList = items
    .map((item) => `<li style="margin: 5px 0;">${item.title} (${item.item_type})</li>`)
    .join("");

  const html = createEmailHTML(`
    <div style="background-color: #8b5cf6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h1 style="margin: 0; color: #ffffff;">How Was Your Experience?</h1>
    </div>
    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p>Dear ${booking.customer_name},</p>
      <p>Thank you for choosing us! We hope you enjoyed your experience.</p>
      <p>We'd love to hear your feedback about your recent booking:</p>
      
      <div style="margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>Reference Code:</strong> ${booking.reference_code}</p>
        <p style="margin: 10px 0;"><strong>Travel Date:</strong> ${formatDate(booking.travel_date)}</p>
      </div>

      <div style="margin: 20px 0;">
        <h3 style="color: #374151; margin-bottom: 10px;">Items in Your Booking:</h3>
        <ul style="list-style-type: disc; padding-left: 20px;">
          ${itemsList}
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${reviewLink}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Leave Your Review
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">Your honest feedback helps us improve and helps other travelers make informed decisions.</p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p>This review link is unique to your booking and will expire in 30 days.</p>
      </div>
    </div>
  `);

  const itemsListText = items.map((item) => `- ${item.title} (${item.item_type})`).join("\n");

  const text = `
How Was Your Experience?

Dear ${booking.customer_name},

Thank you for choosing us! We hope you enjoyed your experience.

We'd love to hear your feedback about your recent booking:

Reference Code: ${booking.reference_code}
Travel Date: ${formatDate(booking.travel_date)}

Items in Your Booking:
${itemsListText}

Leave your review: ${reviewLink}

Your honest feedback helps us improve and helps other travelers make informed decisions.

This review link is unique to your booking and will expire in 30 days.
  `.trim();

  return { subject, html, text };
}

// 7. Payment Received (Post-Stripe webhook)
export function paymentReceivedCustomer(
  booking: Booking,
  paidAmount: number,
  remainingAmount: number
) {
  const subject = `Payment Received - ${booking.reference_code}`;
  const isFullyPaid = remainingAmount === 0;
  const trackingLink = getTrackingLink(booking.reference_code);
  
  const html = createEmailHTML(`
    <div style="background-color: #10b981; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h1 style="margin: 0; color: #ffffff;">${isFullyPaid ? "Payment Complete!" : "Payment Received"}</h1>
    </div>
    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p>Dear ${booking.customer_name},</p>
      <p>Thank you! We've received your payment of ${formatCurrency(paidAmount)}.</p>
      
      <div style="margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>Reference Code:</strong> ${booking.reference_code}</p>
        <p style="margin: 10px 0;"><strong>Travel Date:</strong> ${formatDate(booking.travel_date)}</p>
      </div>

      <div style="margin: 20px 0; background-color: #f9fafb; padding: 15px; border-radius: 6px;">
        <h3 style="color: #374151; margin: 0 0 10px 0;">Payment Summary</h3>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${formatCurrency(booking.total_amount)}</p>
        <p style="margin: 5px 0;"><strong>This Payment:</strong> ${formatCurrency(paidAmount)}</p>
        <p style="margin: 5px 0;"><strong>Total Paid:</strong> ${formatCurrency(booking.total_amount - remainingAmount)}</p>
        ${
          remainingAmount > 0
            ? `<p style="margin: 5px 0; color: #dc2626;"><strong>Remaining Balance:</strong> ${formatCurrency(remainingAmount)}</p>`
            : `<p style="margin: 5px 0; color: #10b981;"><strong>Status:</strong> Fully Paid ✓</p>`
        }
      </div>

      ${
        remainingAmount > 0
          ? `
      <div style="margin: 20px 0; background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e;"><strong>Note:</strong> You have a remaining balance of ${formatCurrency(remainingAmount)}. This should be paid before your travel date.</p>
        <div style="margin-top: 15px;">
          <a href="${trackingLink}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Pay Remaining Balance
          </a>
        </div>
      </div>
      `
          : `
      <div style="margin: 20px 0; background-color: #d1fae5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
        <p style="margin: 0; color: #065f46;"><strong>All Set!</strong> Your booking is fully paid. We look forward to serving you!</p>
      </div>
      `
      }

      <p style="margin-top: 20px;">
        <a href="${trackingLink}" style="color: #2563eb; text-decoration: none;">Track your booking</a>
      </p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p>If you have any questions, please contact us with your reference code.</p>
      </div>
    </div>
  `);

  const text = `
${isFullyPaid ? "Payment Complete!" : "Payment Received"}

Dear ${booking.customer_name},

Thank you! We've received your payment of ${formatCurrency(paidAmount)}.

Reference Code: ${booking.reference_code}
Travel Date: ${formatDate(booking.travel_date)}

Payment Summary:
Total Amount: ${formatCurrency(booking.total_amount)}
This Payment: ${formatCurrency(paidAmount)}
Total Paid: ${formatCurrency(booking.total_amount - remainingAmount)}
${
  remainingAmount > 0
    ? `Remaining Balance: ${formatCurrency(remainingAmount)}`
    : "Status: Fully Paid ✓"
}

${
  remainingAmount > 0
    ? `Note: You have a remaining balance of ${formatCurrency(remainingAmount)}. This should be paid before your travel date.

Pay remaining balance: ${trackingLink}`
    : "All Set! Your booking is fully paid. We look forward to serving you!"
}

Track your booking: ${trackingLink}

If you have any questions, please contact us with your reference code.
  `.trim();

  return { subject, html, text };
}
