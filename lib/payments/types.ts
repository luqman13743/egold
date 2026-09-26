// Provider-agnostic payment contracts.
// Every concrete provider (Stripe, others added later) implements this interface.
// Nothing in app/actions code should import a provider SDK directly — always
// go through PaymentProvider so swapping providers never touches business logic.

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface CreatePaymentInput {
  orderId: string;
  amount: number; // integer minor units (e.g. cents) — never a float
  currency: string; // ISO 4217, e.g. "usd"
  customerEmail: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentResult {
  providerPaymentId: string;
  clientSecret?: string; // for providers needing client-side confirmation
  redirectUrl?: string; // for redirect-based providers
  status: PaymentStatus;
}

export interface VerifyPaymentInput {
  providerPaymentId: string;
}

export interface VerifyPaymentResult {
  status: PaymentStatus;
  amountReceived: number;
  currency: string;
}

export interface RefundPaymentInput {
  providerPaymentId: string;
  amount?: number; // omit for full refund
  reason?: string;
}

export interface RefundPaymentResult {
  refundId: string;
  status: "pending" | "succeeded" | "failed";
}

export interface WebhookEvent {
  type: string;
  providerPaymentId: string | null;
  status: PaymentStatus | null;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;

  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;

  refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult>;

  /**
   * Verifies the webhook signature against the raw request body, then
   * normalizes the provider's event into our internal shape.
   * MUST throw if the signature is invalid — callers must never process
   * an unverified webhook.
   */
  handleWebhook(rawBody: string | Buffer, signatureHeader: string): Promise<WebhookEvent>;
}
