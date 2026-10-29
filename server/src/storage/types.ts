import type { DayLog, Meta } from "../types";

/**
 * Kontrak penyimpanan. Untuk migrasi ke database cloud (Postgres, MongoDB, Firestore, dll.)
 * cukup buat implementasi baru dari interface ini lalu daftarkan di storage/index.ts.
 * Saat nanti ada login, buat instance per user (misalnya dengan prefix/ID user).
 */
export interface Storage {
  readonly kind: "json" | "redis";
  getMeta(): Promise<Meta>;
  saveMeta(meta: Meta): Promise<void>;
  getDay(date: string): Promise<DayLog | null>;
  getAllDays(): Promise<Record<string, DayLog>>;
  saveDay(day: DayLog): Promise<void>;
}

export const emptyMeta = (): Meta => ({ schemaVersion: 1, challenge: null, habits: [] });
