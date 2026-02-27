import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // TODO: Verify cron secret from headers (e.g., Vercel Cron Secret)
    // TODO: Query bookings with pending balances from database
    // TODO: For each booking, call /api/email/send-balance-link
    // TODO: Return summary of emails sent

    console.log("TODO: Process balance reminders");

    return NextResponse.json({
      success: true,
      message: "Balance reminders placeholder",
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}
