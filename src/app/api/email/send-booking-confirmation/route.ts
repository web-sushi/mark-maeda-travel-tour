import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/provider";

function formatCurrency(amount: number): string {
  // JPY has no minor unit; amounts stored/sent as yen.
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

function formatItems(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) {
    return "No items";
  }

  return items
    .map((item) => {
      const type = item.type || "unknown";
      const title = item.title || "Untitled";
      const price = item.base_price_jpy
        ? `¥${item.base_price_jpy.toLocaleString()}`
        : "Price not available";
      return `• ${type.charAt(0).toUpperCase() + type.slice(1)}: ${title} (${price})`;
    })
    .join("<br>");
}

function createAdminEmailHTML(
  referenceCode: string,
  customerName: string,
  customerEmail: string,
  travelDate: string,
  vehiclesCount: number,
  items: any[],
  totalAmount: number
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #4b5563; }
          .value { color: #111827; }
          .total { font-size: 18px; font-weight: bold; color: #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Booking Received</h1>
          </div>
          <div class="content">
            <div class="section">
              <p class="label">Reference Code:</p>
              <p class="value">${referenceCode}</p>
            </div>
            <div class="section">
              <p class="label">Customer:</p>
              <p class="value">${customerName} (${customerEmail})</p>
            </div>
            <div class="section">
              <p class="label">Travel Date:</p>
              <p class="value">${new Date(travelDate).toLocaleDateString()}</p>
            </div>
            <div class="section">
              <p class="label">Vehicles:</p>
              <p class="value">${vehiclesCount}</p>
            </div>
            <div class="section">
              <p class="label">Items:</p>
              <p class="value">${formatItems(items)}</p>
            </div>
            <div class="section">
              <p class="label">Total Amount:</p>
              <p class="total">${formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function createCustomerEmailHTML(
  referenceCode: string,
  customerName: string,
  travelDate: string,
  vehiclesCount: number,
  items: any[],
  totalAmount: number
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #4b5563; }
          .value { color: #111827; }
          .total { font-size: 18px; font-weight: bold; color: #059669; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmation</h1>
          </div>
          <div class="content">
            <p>Dear ${customerName},</p>
            <p>Thank you for your booking! We've received your request and will contact you shortly.</p>
            
            <div class="section">
              <p class="label">Reference Code:</p>
              <p class="value">${referenceCode}</p>
            </div>
            <div class="section">
              <p class="label">Travel Date:</p>
              <p class="value">${new Date(travelDate).toLocaleDateString()}</p>
            </div>
            <div class="section">
              <p class="label">Vehicles:</p>
              <p class="value">${vehiclesCount}</p>
            </div>
            <div class="section">
              <p class="label">Items:</p>
              <p class="value">${formatItems(items)}</p>
            </div>
            <div class="section">
              <p class="label">Total Amount:</p>
              <p class="total">${formatCurrency(totalAmount)}</p>
            </div>
            
            <div class="footer">
              <p>If you have any questions, please contact us using your reference code.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      bookingId,
      referenceCode,
      customerName,
      customerEmail,
      travelDate,
      vehiclesCount,
      items,
      totalAmount,
    } = body;

    // Validate required fields
    if (!referenceCode || !customerName || !customerEmail || !travelDate || !totalAmount) {
      console.error("Missing required fields for booking confirmation email");
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const errors: string[] = [];

    // Determine admin email (use env var or fallback to customer email for testing)
    const adminEmail = process.env.ADMIN_EMAIL || customerEmail;
    if (!process.env.ADMIN_EMAIL) {
      console.warn(
        "ADMIN_EMAIL not set, sending admin notification to customer email for testing:",
        customerEmail
      );
    }

    // Send admin notification email
    try {
      const adminResult = await sendEmail({
        to: adminEmail,
        subject: `New booking received – ${referenceCode}`,
        html: createAdminEmailHTML(
          referenceCode,
          customerName,
          customerEmail,
          travelDate,
          vehiclesCount || 1,
          items || [],
          totalAmount
        ),
      });

      if (!adminResult.success) {
        const errorMsg = `Admin email failed: ${adminResult.error}`;
        errors.push(errorMsg);
        console.error("Failed to send admin email to", adminEmail, ":", adminResult.error);
      } else {
        console.log("Admin notification email sent successfully to", adminEmail);
      }
    } catch (error) {
      const errorMsg = `Admin email error: ${error instanceof Error ? error.message : "Unknown error"}`;
      errors.push(errorMsg);
      console.error("Admin email sending error to", adminEmail, ":", error);
    }

    // Send customer confirmation email
    try {
      const customerResult = await sendEmail({
        to: customerEmail,
        subject: `We received your booking – ${referenceCode}`,
        html: createCustomerEmailHTML(
          referenceCode,
          customerName,
          travelDate,
          vehiclesCount || 1,
          items || [],
          totalAmount
        ),
      });

      if (!customerResult.success) {
        const errorMsg = `Customer email failed: ${customerResult.error}`;
        errors.push(errorMsg);
        console.error("Failed to send customer email to", customerEmail, ":", customerResult.error);
      } else {
        console.log("Customer confirmation email sent successfully to", customerEmail);
      }
    } catch (error) {
      const errorMsg = `Customer email error: ${error instanceof Error ? error.message : "Unknown error"}`;
      errors.push(errorMsg);
      console.error("Customer email sending error to", customerEmail, ":", error);
    }

    // Return 200 even if emails failed (log errors but don't block)
    return NextResponse.json({
      success: true,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Booking confirmation email error:", error);
    // Return 200 even on error to not block booking creation
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
