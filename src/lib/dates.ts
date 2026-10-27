// Calendar dates are passed around as "YYYY-MM-DD" strings. "Today" is
// always the date in Tallinn, regardless of the server's or browser's time zone.

export const TIME_ZONE = "Europe/Tallinn";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayInTallinn(now = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// For Prisma @db.Date columns
export function isoToDbDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

export function dbDateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// "2026-10-27" -> "27.10.2026"
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}
