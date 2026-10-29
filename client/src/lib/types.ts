// Disamakan dengan server/src/types.ts

/** 0 = Minggu ... 6 = Sabtu */
export type Schedule =
  | { kind: "daily" }
  | { kind: "days"; days: number[] }
  | { kind: "weekly"; times: number };

export type HabitType = "check" | "quantity";
export type Status = "success" | "fail" | "pending" | "optional";

export interface HabitInput {
  name: string;
  emoji: string;
  type: HabitType;
  durationMinutes: number | null;
  target: number | null;
  unit: string | null;
  schedule: Schedule;
}

export interface HabitView extends HabitInput {
  id: string;
  order: number;
  from: string;
  startFrom: string;
}

export interface ChallengeView {
  startDate: string;
  totalDays: number;
  endDate: string;
}

export interface MetaResponse {
  today: string;
  storage: "json" | "redis";
  challenge: ChallengeView | null;
  habits: HabitView[];
}

export interface DayItem extends HabitInput {
  habitId: string;
  done: boolean;
  value: number | null;
  status: Status;
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
