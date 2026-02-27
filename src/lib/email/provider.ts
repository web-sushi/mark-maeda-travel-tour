// Email provider using Resend API
// TODO: Add email templates and better error handling

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM_EMAIL = "Bookings <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || DEFAULT_FROM_EMAIL;

  if (!apiKey) {
    console.error("EMAIL_PROVIDER_API_KEY is not set");
    return { success: false, error: "Email provider API key not configured" };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const statusText = response.statusText;
      let errorBody = "";
      let errorData: any = {};

      try {
        errorBody = await response.text();
        errorData = JSON.parse(errorBody);
      } catch {
        // If parsing fails, use the text body
        errorData = { message: errorBody || statusText };
      }

      console.error("Resend API error:", {
        status,
        statusText,
        body: errorBody,
        parsed: errorData,
      });

      return {
        success: false,
        error: errorData.message || `Failed to send email (${status} ${statusText})`,
      };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    console.error("Email sending error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
