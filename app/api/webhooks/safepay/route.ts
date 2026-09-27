import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { db } from "@/db";
import { payments, orders, processedWebhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

// Safepay requires the raw body for signature verification — do not use
// NextRequest.json() here, and this route must not run through any
// body-parsing middleware.
//
// NOTE: confirm the exact signature header name Safepay sends (dashboard →
// Webhooks settings) before go-live and update SAFEPAY_SIGNATURE_HEADER
// accordingly; this defaults to a common convention.
const SIGNATURE_HEADER = process.env.SAFEPAY_SIGNATURE_HEADER ?? "x-sfpy-signature";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get(SIGNATURE_HEADER);

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const provider = getPaymentProvider();

  let event;
  try {
    event = await provider.handleWebhook(rawBody, signature);
  } catch {
    // Invalid signature or malformed payload — never trust this request.
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: gateways may deliver the same event more than once.
  const eventId =
    (event.raw as { id?: string; data?: { id?: string } })?.id ??
    (event.raw as { data?: { id?: string } })?.data?.id;

  if (eventId) {
    const existing = await db.query.processedWebhookEvents.findFirst({
      where: eq(processedWebhookEvents.providerEventId, eventId),
    });
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  if (event.providerPaymentId && event.status) {
    await db.transaction(async (tx) => {
      const payment = await tx.query.payments.findFirst({
        where: eq(payments.providerPaymentId, event.providerPaymentId!),
      });

      if (!payment) return;

      await tx
        .update(payments)
        .set({ status: event.status!, updatedAt: new Date() })
        .where(eq(payments.id, payment.id));

      // Order status only ever transitions off the back of a verified
      // webhook — never from client-reported checkout success.
      if (event.status === "paid") {
        await tx
          .update(orders)
          .set({ paymentStatus: "paid", status: "confirmed", updatedAt: new Date() })
          .where(eq(orders.id, payment.orderId));
      } else if (event.status === "failed") {
        await tx
          .update(orders)
          .set({ paymentStatus: "failed", updatedAt: new Date() })
          .where(eq(orders.id, payment.orderId));
      } else if (event.status === "refunded") {
        await tx
          .update(orders)
          .set({ paymentStatus: "refunded", status: "refunded", updatedAt: new Date() })
          .where(eq(orders.id, payment.orderId));
      }

      if (eventId) {
        await tx.insert(processedWebhookEvents).values({
          providerEventId: eventId,
          eventType: event.type,
        });
      }
    });
  }

  return NextResponse.json({ received: true });
}
