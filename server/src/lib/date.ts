// Utilitas tanggal berbasis string "YYYY-MM-DD" (tanpa jam) agar bebas masalah timezone.
// "Hari ini" ditentukan oleh APP_TIMEZONE (default Asia/Jakarta / WIB).

export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Jakarta";
const DAY_MS = 86_400_000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayISO(now: Date = new Date()): string {
  // en-CA menghasilkan format YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toMs(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

function fromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isValidDate(date: string): boolean {
  return ISO_RE.test(date) && fromMs(toMs(date)) === date;
}

export function addDays(date: string, days: number): string {
  return fromMs(toMs(date) + days * DAY_MS);
}

/** Jumlah hari dari a ke b (b - a). */
export function diffDays(a: string, b: string): number {
  return Math.round((toMs(b) - toMs(a)) / DAY_MS);
}

/** 0 = Minggu, 1 = Senin, ... 6 = Sabtu */
export function dayOfWeek(date: string): number {
  return new Date(toMs(date)).getUTCDay();
}

/** Senin pada minggu yang sama (minggu dimulai Senin). */
export function weekStart(date: string): string {
  return addDays(date, -((dayOfWeek(date) + 6) % 7));
}

export function minDate(a: string, b: string): string {
  return a < b ? a : b;
}

export function maxDate(a: string, b: string): string {
  return a > b ? a : b;
}

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}
