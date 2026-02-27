import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, email, amountRemaining } = body;

    // TODO: Validate bookingId exists in database
    // TODO: Validate email format
    // TODO: Generate payment link using Stripe
    // TODO: Send email with payment link using email provider
    // TODO: Log email sent to database

    console.log("TODO: Send balance link email", {
      bookingId,
      email,
      amountRemaining,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
