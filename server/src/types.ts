// ===== Data yang disimpan =====

/** 0 = Minggu ... 6 = Sabtu */
export type Schedule =
  | { kind: "daily" }
  | { kind: "days"; days: number[] }
  | { kind: "weekly"; times: number };

export type HabitType = "check" | "quantity";

/**
 * Setiap perubahan kegiatan membuat versi baru yang berlaku mulai tanggal `from`.
 * Dengan begitu riwayat hari-hari sebelumnya tetap utuh.
 */
export interface HabitVersion {
  from: string;
  name: string;
  emoji: string;
  type: HabitType;
  durationMinutes: number | null;
  target: number | null;
  unit: string | null;
  schedule: Schedule;
}

export interface Habit {
  id: string;
  createdAt: string;
  order: number;
  versions: HabitVersion[];
  /** Kegiatan dihapus mulai tanggal ini (soft delete, riwayat tetap ada). */
  archivedFrom: string | null;
}

export interface Challenge {
  startDate: string;
  totalDays: number;
}

export interface Meta {
  schemaVersion: 1;
  challenge: Challenge | null;
  habits: Habit[];
}

export interface Entry {
  done?: boolean;
  value?: number;
}

export interface DayLog {
  date: string;
  entries: Record<string, Entry>;
  note: string;
  updatedAt: string;
}

// ===== Data hasil perhitungan (respons API) =====

export type Status = "success" | "fail" | "pending" | "optional";

export interface DayItem {
  habitId: string;
  name: string;
  emoji: string;
  type: HabitType;
  durationMinutes: number | null;
  target: number | null;
  unit: string | null;
  schedule: Schedule;
  done: boolean;
  value: number | null;
  status: Status;
  /** Hanya untuk jadwal "X kali per minggu" */
  week: { done: number; required: number } | null;
}

export interface DaySummary {
  date: string;
  inChallenge: boolean;
  dayNumber: number | null;
  isToday: boolean;
  isFuture: boolean;
  success: number;
  fail: number;
  pending: number;
  /** success / (success + fail + pending), null jika tidak ada kegiatan yang dihitung */
  rate: number | null;
  hasNote: boolean;
}

export interface DayDetail extends DaySummary {
  editable: boolean;
  items: DayItem[];
  note: string;
}

export interface HabitStat {
  habitId: string;
  name: string;
  emoji: string;
  archived: boolean;
  success: number;
  fail: number;
  rate: number | null;
}

export interface Stats {
  from: string;
  to: string;
  success: number;
  fail: number;
  rate: number | null;
  perfectDays: number;
  trackedDays: number;
  currentStreak: number;
  bestStreak: number;
  habits: HabitStat[];
}
