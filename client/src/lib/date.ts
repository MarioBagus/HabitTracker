// Tanggal selalu berupa string "YYYY-MM-DD". "Hari ini" datang dari server (WIB).

const DAY_MS = 86_400_000;

const toDate = (d: string) => {
  const [y, m, day] = d.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, day));
};
const fromDate = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (d: string, n: number) => fromDate(new Date(toDate(d).getTime() + n * DAY_MS));
export const diffDays = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY_MS);
/** 0 = Minggu ... 6 = Sabtu */
export const dayOfWeek = (d: string) => toDate(d).getUTCDay();
export const monthStart = (d: string) => `${d.slice(0, 7)}-01`;
export const monthEnd = (d: string) => {
  const dt = toDate(monthStart(d));
  dt.setUTCMonth(dt.getUTCMonth() + 1);
  return addDays(fromDate(dt), -1);
};
export const addMonths = (d: string, n: number) => {
  const dt = toDate(monthStart(d));
  dt.setUTCMonth(dt.getUTCMonth() + n);
  return fromDate(dt);
};

const fmt = (opts: Intl.DateTimeFormatOptions) => {
  const f = new Intl.DateTimeFormat("id-ID", { ...opts, timeZone: "UTC" });
  return (d: string) => f.format(toDate(d));
};

/** Kamis, 29 Oktober 2026 */
export const formatLong = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
/** 29 Okt 2026 */
export const formatMedium = fmt({ day: "numeric", month: "short", year: "numeric" });
/** Kamis */
export const formatWeekday = fmt({ weekday: "long" });
/** Kam, 29 Okt */
export const formatShort = fmt({ weekday: "short", day: "numeric", month: "short" });
/** Oktober 2026 */
export const formatMonth = fmt({ month: "long", year: "numeric" });

/** Urutan hari Senin → Minggu, dengan nilai getUTCDay. */
export const WEEKDAYS = [
  { value: 1, short: "Sen", long: "Senin" },
  { value: 2, short: "Sel", long: "Selasa" },
  { value: 3, short: "Rab", long: "Rabu" },
  { value: 4, short: "Kam", long: "Kamis" },
  { value: 5, short: "Jum", long: "Jumat" },
  { value: 6, short: "Sab", long: "Sabtu" },
  { value: 0, short: "Min", long: "Minggu" },
];

export const maxOf = (a: string, b: string) => (a > b ? a : b);
export const minOf = (a: string, b: string) => (a < b ? a : b);
