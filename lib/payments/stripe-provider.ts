import Stripe from "stripe";
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

// Server-only. Never import this file from a Client Component.
const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!secretKey) {
  // Fail loudly at boot in production rather than silently accepting fake payments.
  if (process.env.NODE_ENV === "production") {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
}

const stripe = new Stripe(secretKey ?? "sk_test_placeholder", {
  apiVersion: "2024-09-30.acacia",
});

function mapStripeStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
  switch (status) {
    case "succeeded":
      return "paid";
    case "processing":
    case "requires_action":
    case "requires_capture":
    case "requires_confirmation":
    case "requires_payment_method":
      return "pending";
    case "canceled":
      return "failed";
    default:
      return "pending";
  }
}

export class StripeProvider implements PaymentProvider {
  readonly name = "stripe";

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const intent = await stripe.paymentIntents.create({
      amount: input.amount,
      currency: input.currency,
      receipt_email: input.customerEmail,
      metadata: { orderId: input.orderId, ...input.metadata },
      automatic_payment_methods: { enabled: true },
    });

    return {
      providerPaymentId: intent.id,
      clientSecret: intent.client_secret ?? undefined,
      status: mapStripeStatus(intent.status),
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const intent = await stripe.paymentIntents.retrieve(input.providerPaymentId);
    return {
      status: mapStripeStatus(intent.status),
      amountReceived: intent.amount_received,
      currency: intent.currency,
    };
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const refund = await stripe.refunds.create({
      payment_intent: input.providerPaymentId,
      amount: input.amount,
      reason: input.reason as Stripe.RefundCreateParams.Reason | undefined,
    });

    return {
      refundId: refund.id,
      status:
        refund.status === "succeeded"
          ? "succeeded"
          : refund.status === "failed"
            ? "failed"
            : "pending",
    };
  }

  async handleWebhook(rawBody: string | Buffer, signatureHeader: string): Promise<WebhookEvent> {
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set — refusing to process webhook");
    }

    // Throws on invalid signature — caller must let this propagate as a 400.
    const event = stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);

    const obj = event.data.object as Stripe.PaymentIntent;

    let status: PaymentStatus | null = null;
    if (event.type === "payment_intent.succeeded") status = "paid";
    else if (event.type === "payment_intent.payment_failed") status = "failed";
    else if (event.type === "charge.refunded") status = "refunded";

    return {
      type: event.type,
      providerPaymentId: obj?.id ?? null,
      status,
      raw: event,
    };
  }
}
