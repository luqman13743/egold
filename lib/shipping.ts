// Flat-rate shipping for now — architecture leaves room for carrier-rate
// lookups later without touching checkout's calling code.
const FLAT_RATE = 250; // PKR
const FREE_SHIPPING_THRESHOLD = 5000; // PKR

export function calculateShipping(subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return FLAT_RATE;
}
