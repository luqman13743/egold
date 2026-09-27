import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  const { allowed } = await rateLimit(`contact:${ip}`, 5, 60 * 10); // 5 per 10 min per IP
  if (!allowed) {
    return NextResponse.json({ error: "Too many messages — please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.EMAIL_FROM ?? "support@example.com";

  await sendTransactionalEmail({
    to: supportEmail,
    subject: `Contact form: ${parsed.data.name}`,
    template: "contact-message",
    data: parsed.data,
  }).catch(() => {
    // Don't fail the request just because email delivery had a hiccup —
    // log server-side and still acknowledge receipt.
    console.error("Failed to send contact form email");
  });

  return NextResponse.json({ ok: true });
}
