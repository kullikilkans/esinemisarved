// Money is handled as integer cents on the client and as Decimal in the
// database, so no floating-point rounding errors creep in.

// Parses "150", "150,5" or "1 250.50" into cents. Returns null if invalid.
export function parseAmountToCents(input: string): number | null {
  const normalized = input.replace(/[\s ]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, frac = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function centsToDecimalString(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

// "24.00" -> 2400 basis points
export function rateToBasisPoints(rate: string | number): number {
  return Math.round(Number(rate) * 100);
}

// VAT rounded half up to whole cents
export function calculateVat(netCents: number, rateBasisPoints: number) {
  const vatCents = Math.round((netCents * rateBasisPoints) / 10000);
  return { vatCents, totalCents: netCents + vatCents };
}

const EUR = new Intl.NumberFormat("et-EE", { style: "currency", currency: "EUR" });

export function formatEur(value: number | string, unit: "cents" | "euros" = "euros"): string {
  const euros = unit === "cents" ? Number(value) / 100 : Number(value);
  return EUR.format(euros);
}

export function formatRate(rate: string | number): string {
  return `${Number(rate).toLocaleString("et-EE", { maximumFractionDigits: 2 })}%`;
}
