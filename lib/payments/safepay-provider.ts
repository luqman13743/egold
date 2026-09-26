import crypto from "crypto";
import { Safepay } from "@sfpy/node-sdk";
import type {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
  RefundPaymentInput,
  RefundPaymentResult,
  WebhookEvent,
  PaymentStatus,
} from "./types";

// Server-only — Safepay is Pakistan's hosted-checkout gateway, routing cards,
// JazzCash and EasyPaisa through one integration. Never import this file
// from a Client Component.

const apiKey = process.env.SAFEPAY_API_KEY;
const v1Secret = process.env.SAFEPAY_V1_SECRET;
const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET;
const environment = (process.env.SAFEPAY_ENVIRONMENT ?? "sandbox") as "sandbox" | "production";
const apiBase =
  environment === "production" ? "https://api.getsafepay.com" : "https://sandbox.api.getsafepay.com";

if (!apiKey || !v1Secret || !webhookSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SAFEPAY_API_KEY / SAFEPAY_V1_SECRET / SAFEPAY_WEBHOOK_SECRET is not set");
  }
}

const safepay = new Safepay({
  environment,
  apiKey: apiKey ?? "sec_placeholder",
  v1Secret: v1Secret ?? "placeholder",
  webhookSecret: webhookSecret ?? "placeholder",
});

// Safepay is redirect/hosted-checkout based (no immediate "paid" response
// like Stripe's PaymentIntent) — an order starts pending and only becomes
// paid/failed once the customer completes the hosted flow and the signed
// webhook arrives. verifyPayment below polls the order/tracker endpoint as
// a fallback; the webhook remains the source of truth for order state.
function mapSafepayState(state: string | undefined): PaymentStatus {
  switch ((state ?? "").toUpperCase()) {
    case "TRACKER_ENDED":
    case "PAID":
    case "COMPLETED":
      return "paid";
    case "TRACKER_CANCELLED":
    case "FAILED":
    case "CANCELLED":
      return "failed";
    case "REFUNDED":
      return "refunded";
    default:
      return "pending";
  }
}

export class SafepayProvider implements PaymentProvider {
  readonly name = "safepay";

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // Safepay amounts are in the currency's minor unit already matching our
    // convention (integer, e.g. paisa for PKR) — no conversion needed.
    const { token } = await safepay.payments.create({
      amount: input.amount,
      currency: input.currency.toUpperCase() as "PKR" | "USD",
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const redirectUrl = safepay.checkout.create({
      token,
      orderId: input.orderId,
      cancelUrl: `${siteUrl}/checkout?status=cancelled&order=${input.orderId}`,
      redirectUrl: `${siteUrl}/checkout/confirmation?order=${input.orderId}`,
      source: "custom",
      webhooks: true,
    });

    return {
      providerPaymentId: token,
      redirectUrl,
      status: "pending",
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    // Confirm the exact tracker/order-status endpoint path against current
    // Safepay API docs before relying on this in production — the SDK's
    // published surface covers payments.create/checkout.create/verify.*,
    // not a documented "get status" call, so this hits the REST API directly.
    const res = await fetch(`${apiBase}/order/v1/${input.providerPaymentId}/tracker/`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Safepay tracker lookup failed: ${res.status}`);
    }

    const data = await res.json();
    return {
      status: mapSafepayState(data?.data?.state ?? data?.state),
      amountReceived: data?.data?.amount ?? 0,
      currency: (data?.data?.currency ?? "PKR").toLowerCase(),
    };
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const res = await fetch(`${apiBase}/order/v1/${input.providerPaymentId}/refund/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: input.amount, reason: input.reason }),
    });

    if (!res.ok) {
      return { refundId: "", status: "failed" };
    }

    const data = await res.json();
    return {
      refundId: data?.data?.id ?? "",
      status: "pending",
    };
  }

  async handleWebhook(rawBody: string | Buffer, signatureHeader: string): Promise<WebhookEvent> {
    if (!webhookSecret) {
      throw new Error("SAFEPAY_WEBHOOK_SECRET is not set — refusing to process webhook");
    }

    const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");

    // HMAC-SHA256 of the raw body against the webhook secret, constant-time
    // compared. Verify this matches Safepay's current signing scheme
    // (header name / encoding) against their dashboard docs before go-live.
    const expected = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
    const sigBuffer = Buffer.from(signatureHeader ?? "", "utf8");
    const expBuffer = Buffer.from(expected, "utf8");

    const valid =
      sigBuffer.length === expBuffer.length && crypto.timingSafeEqual(sigBuffer, expBuffer);

    if (!valid) {
      throw new Error("Invalid Safepay webhook signature");
    }

    const event = JSON.parse(body);
    const state: string | undefined = event?.data?.state ?? event?.state ?? event?.type;

    return {
      type: event?.type ?? "safepay.webhook",
      providerPaymentId: event?.data?.token ?? event?.data?.order_id ?? null,
      status: mapSafepayState(state),
      raw: event,
    };
  }
}
