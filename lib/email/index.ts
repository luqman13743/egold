interface SendEmailInput {
  to: string;
  subject: string;
  template:
    | "verify-email"
    | "reset-password"
    | "order-confirmation"
    | "order-shipped"
    | "contact-message";
  data: Record<string, unknown>;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTemplate(
  template: SendEmailInput["template"],
  data: Record<string, unknown>
): string {
  switch (template) {
    case "verify-email":
      return `
        <p>Hi ${escapeHtml(data.name)},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p>
          <a href="${escapeHtml(data.url)}">Verify your email</a>
        </p>
        <p>If you did not create an account, you can ignore this email.</p>
      `;

    case "reset-password":
      return `
        <p>Reset your password:</p>
        <p>
          <a href="${escapeHtml(data.url)}">Reset password</a>
        </p>
      `;

    case "order-confirmation":
      return `
        <p>Your order ${escapeHtml(data.orderId)} for ${escapeHtml(
        data.total
      )} has been confirmed.</p>
      `;

    case "order-shipped":
      return `
        <p>Your order ${escapeHtml(data.orderId)} has shipped.</p>
        <p>Tracking: ${escapeHtml(data.trackingNumber)}</p>
      `;

    case "contact-message":
      return `
        <p>From: ${escapeHtml(data.name)} (${escapeHtml(data.email)})</p>
        <p>${escapeHtml(data.message)}</p>
      `;

    default:
      return "";
  }
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  const fromName = process.env.EMAIL_FROM_NAME ?? "Essens";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set");
  }

  if (!fromEmail) {
    throw new Error("EMAIL_FROM is not set");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: fromName,
        email: fromEmail,
      },
      to: [
        {
          email: input.to,
        },
      ],
      subject: input.subject,
      htmlContent: renderTemplate(input.template, input.data),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();

    console.error("[email] Brevo send failed", {
      status: response.status,
      body: errorBody,
    });

    throw new Error(`Brevo email send failed (${response.status})`);
  }

  console.log("[email] Brevo email sent", {
    to: input.to,
    template: input.template,
  });
}
