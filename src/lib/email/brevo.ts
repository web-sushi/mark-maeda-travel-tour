// Brevo transactional email sender (server-side only)
// Uses Brevo API v3 with fetch (no dependencies)

interface SendBrevoEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendBrevoEmail({
  to,
  subject,
  html,
  text,
}: SendBrevoEmailParams): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const emailFromName = process.env.EMAIL_FROM_NAME || "Bookings";

  if (!apiKey) {
    throw new Error("Missing env.BREVO_API_KEY - cannot send emails");
  }

  if (!emailFrom) {
    throw new Error("Missing env.EMAIL_FROM - cannot send emails");
  }

  const body = {
    sender: {
      email: emailFrom,
      name: emailFromName,
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    ...(text && { textContent: text }),
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Brevo API error (${response.status}): ${errorText}`
    );
  }

  const result = await response.json();
  console.log("Brevo email sent:", { to, subject, messageId: result.messageId });
}
