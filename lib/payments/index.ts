import type { PaymentProvider } from "./types";
import { SafepayProvider } from "./safepay-provider";
// Stripe kept available in case a future market needs it — swap the line
// below without touching any calling code, since every consumer depends
// only on the PaymentProvider interface in ./types.
// import { StripeProvider } from "./stripe-provider";

let cachedProvider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (!cachedProvider) {
    cachedProvider = new SafepayProvider();
  }
  return cachedProvider;
}

export type * from "./types";
