import { WEEKDAYS } from "./date";
import type { HabitInput, Schedule } from "./types";

const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
export const formatNumber = (n: number) => num.format(n);

export const percent = (rate: number | null) => (rate == null ? "–" : `${Math.round(rate * 100)}%`);

export function scheduleLabel(s: Schedule): string {
  if (s.kind === "daily") return "Setiap hari";
  if (s.kind === "weekly") return `${s.times}x seminggu`;
  if (s.days.length === 7) return "Setiap hari";
  return WEEKDAYS.filter((d) => s.days.includes(d.value))
    .map((d) => d.short)
    .join(", ");
}

/** Keterangan singkat di bawah nama kegiatan. */
export function habitMeta(h: HabitInput, opts: { withSchedule?: boolean } = {}): string {
  const parts: string[] = [];
  if (h.type === "quantity" && h.target) parts.push(`Target ${formatNumber(h.target)} ${h.unit ?? ""}`.trim());
  if (h.durationMinutes) parts.push(`${h.durationMinutes} menit`);
  if (opts.withSchedule || h.schedule.kind !== "daily") parts.push(scheduleLabel(h.schedule));
  return parts.join(", ");
}

/** Warna sel berdasarkan tingkat keberhasilan (dipakai kalender & rantai hari). */
export function rateColor(rate: number | null, fail: number): string | undefined {
  if (rate == null) return undefined;
  if (rate === 0 && fail > 0) return "var(--berry-soft)";
  const pct = Math.round(25 + rate * 75);
  return `color-mix(in srgb, var(--pine) ${pct}%, var(--surface-2))`;
}
