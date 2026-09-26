export function formatPrice(value: string | number, currency = "PKR") {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}
