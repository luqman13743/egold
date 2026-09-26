import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

interface SendEmailInput {
  to: string;
  subject: string;
  template: "verify-email" | "reset-password" | "order-confirmation" | "order-shipped" | "contact-message";
  data: Record<string, unknown>;
}

// Minimal templating — swap for React Email components later without
// changing any caller. Kept intentionally plain so no external template
// service is required to get transactional email working.
function renderTemplate(template: SendEmailInput["template"], data: Record<string, unknown>): string {
  switch (template) {
    case "verify-email":
      return `<p>Hi ${data.name},</p><p>Verify your email: <a href="${data.url}">${data.url}</a></p>`;
    case "reset-password":
      return `<p>Reset your password: <a href="${data.url}">${data.url}</a></p>`;
    case "order-confirmation":
      return `<p>Your order ${data.orderId} for ${data.total} has been confirmed.</p>`;
    case "order-shipped":
      return `<p>Your order ${data.orderId} has shipped. Tracking: ${data.trackingNumber}</p>`;
    case "contact-message":
      return `<p>From: ${data.name} (${data.email})</p><p>${data.message}</p>`;
    default:
      return "";
  }
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  if (!resend) {
    // Don't throw in development — just log, so local auth flows still work
    // without a Resend key configured.
    console.warn(`[email] RESEND_API_KEY not set — skipping email to ${input.to} (${input.template})`);
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "no-reply@example.com",
    to: input.to,
    subject: input.subject,
    html: renderTemplate(input.template, input.data),
  });
}
