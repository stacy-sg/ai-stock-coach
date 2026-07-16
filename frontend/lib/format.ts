export function returnClass(value: number): string {
  if (value > 0) return "value-positive";
  if (value < 0) return "value-negative";
  return "value-neutral";
}

export function formatSignedPct(value: number, digits = 2): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

/** KRW has no minor unit in everyday quotes; USD (and other currencies) show cents. */
export function formatPrice(value: number, currency: string): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  });
}
