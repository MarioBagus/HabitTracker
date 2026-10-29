import { randomUUID } from "node:crypto";
import {
  addDays,
  dayOfWeek,
  diffDays,
  eachDay,
  maxDate,
  minDate,
  todayISO,
  weekStart,
} from "../lib/date";
import type { Storage } from "../storage";
import type {
  Challenge,
  DayDetail,
  DayItem,
  DayLog,
  DaySummary,
  Entry,
  Habit,
  HabitStat,
  HabitVersion,
  Meta,
  Stats,
  Status,
} from "../types";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type HabitInput = Omit<HabitVersion, "from">;

// ---------------------------------------------------------------------------
// Helper murni (tanpa I/O) — mudah diuji
// ---------------------------------------------------------------------------

export function challengeEnd(c: Challenge): string {
  return addDays(c.startDate, c.totalDays - 1);
}

function inChallenge(c: Challenge | null, date: string): boolean {
  return !!c && date >= c.startDate && date <= challengeEnd(c);
}

function firstFrom(h: Habit): string {
  return h.versions[0]!.from;
}

/** Versi kegiatan yang berlaku pada tanggal tertentu. */
export function versionAt(h: Habit, date: string): HabitVersion | null {
  let found: HabitVersion | null = null;
  for (const v of h.versions) if (v.from <= date) found = v;
  return found;
}

function activeVersion(h: Habit, date: string): HabitVersion | null {
  if (h.archivedFrom && date >= h.archivedFrom) return null;
  return versionAt(h, date);
}

function isScheduled(v: HabitVersion, date: string): boolean {
  return v.schedule.kind !== "days" || v.schedule.days.includes(dayOfWeek(date));
}

function isMet(v: HabitVersion, entry: Entry | undefined): boolean {
  if (!entry) return false;
  if (v.type === "check") return !!entry.done;
  const value = entry.value ?? 0;
  return v.target && v.target > 0 ? value >= v.target : value > 0;
}

interface Ctx {
  meta: Meta;
  logs: Record<string, DayLog>;
  today: string;
}

/** Evaluasi kegiatan "X kali per minggu" untuk satu tanggal. */
function weeklyInfo(ctx: Ctx, h: Habit, date: string, times: number) {
  const c = ctx.meta.challenge!;
  const ws = weekStart(date);
  const we = addDays(ws, 6);
  const from = maxDate(maxDate(ws, c.startDate), firstFrom(h));
  let evalDay = minDate(we, challengeEnd(c));
  if (h.archivedFrom) evalDay = minDate(evalDay, addDays(h.archivedFrom, -1));

  let done = 0;
  let available = 0;
  if (from <= evalDay) {
    for (const d of eachDay(from, evalDay)) {
      const v = activeVersion(h, d);
      if (!v) continue;
      available++;
      if (isMet(v, ctx.logs[d]?.entries[h.id])) done++;
    }
  }
  return { done, required: Math.min(times, available), evalDay };
}

function computeDay(ctx: Ctx, date: string): DayDetail {
  const { meta, logs, today } = ctx;
  const c = meta.challenge;
  const inCh = inChallenge(c, date);
  const isToday = date === today;
  const isFuture = date > today;
  const log = logs[date];
  const items: DayItem[] = [];

  if (inCh) {
    const habits = [...meta.habits].sort((a, b) => a.order - b.order);
    for (const h of habits) {
      const v = activeVersion(h, date);
      if (!v || !isScheduled(v, date)) continue;

      const entry = log?.entries[h.id];
      const met = isMet(v, entry);
      let status: Status;
      let week: DayItem["week"] = null;

      if (v.schedule.kind === "weekly") {
        const info = weeklyInfo(ctx, h, date, v.schedule.times);
        week = { done: info.done, required: info.required };
        if (met) status = "success";
        else if (info.done >= info.required) status = "optional";
        else if (date === info.evalDay) status = date < today ? "fail" : "pending";
        else status = "optional";
      } else if (met) {
        status = "success";
      } else {
        status = date < today ? "fail" : "pending";
      }

      items.push({
        habitId: h.id,
        name: v.name,
        emoji: v.emoji,
        type: v.type,
        durationMinutes: v.durationMinutes,
        target: v.target,
        unit: v.unit,
        schedule: v.schedule,
        done: v.type === "check" ? !!entry?.done : met,
        value: v.type === "quantity" ? (entry?.value ?? 0) : null,
        status,
        week,
      });
    }
  }

  const count = (s: Status) => (isFuture ? 0 : items.filter((i) => i.status === s).length);
  const success = count("success");
  const fail = count("fail");
  const pending = count("pending");
  const counted = success + fail + pending;

  return {
    date,
    inChallenge: inCh,
    dayNumber: inCh && c ? diffDays(c.startDate, date) + 1 : null,
    isToday,
    isFuture,
    success,
    fail,
    pending,
    rate: counted > 0 ? success / counted : null,
    hasNote: !!log?.note?.trim(),
    editable: inCh && !isFuture,
    items,
    note: log?.note ?? "",
  };
}

function toSummary(d: DayDetail): DaySummary {
  const { items: _items, note: _note, editable: _editable, ...summary } = d;
  return summary;
}

const isPerfect = (d: DayDetail) => d.fail === 0 && d.pending === 0 && d.success > 0;

// ---------------------------------------------------------------------------
// Contoh kegiatan (diambil dari kebutuhan awal)
// ---------------------------------------------------------------------------

const daily = { kind: "daily" } as const;
const SAMPLE_HABITS: HabitInput[] = [
  { name: "Duolingo", emoji: "🦉", type: "check", durationMinutes: 10, target: null, unit: null, schedule: daily },
  { name: "Lari/olahraga", emoji: "🏃‍♂️", type: "check", durationMinutes: 15, target: null, unit: null, schedule: daily },
  { name: "Baca buku", emoji: "📚", type: "check", durationMinutes: 10, target: null, unit: null, schedule: daily },
  { name: "Belajar Matematika", emoji: "📐", type: "check", durationMinutes: 10, target: null, unit: null, schedule: daily },
  { name: "Belajar Programming", emoji: "🔧", type: "check", durationMinutes: 10, target: null, unit: null, schedule: daily },
  { name: "Bangun pagi", emoji: "🌅", type: "check", durationMinutes: null, target: null, unit: null, schedule: daily },
  { name: "Journaling", emoji: "📝", type: "check", durationMinutes: null, target: null, unit: null, schedule: daily },
  { name: "Belajar hal baru", emoji: "🧠", type: "check", durationMinutes: null, target: null, unit: null, schedule: daily },
  { name: "Mengurangi scrolling", emoji: "📵", type: "check", durationMinutes: null, target: null, unit: null, schedule: daily },
];

// ---------------------------------------------------------------------------
// Service (dengan I/O ke storage)
// ---------------------------------------------------------------------------

export class TrackerService {
  constructor(private readonly storage: Storage) {}

  private async ctx(): Promise<Ctx> {
    const [meta, logs] = await Promise.all([this.storage.getMeta(), this.storage.getAllDays()]);
    return { meta, logs, today: todayISO() };
  }

  // ----- Meta -----

  async getMeta() {
    const meta = await this.storage.getMeta();
    const today = todayISO();
    const habits = meta.habits
      .filter((h) => !h.archivedFrom || h.archivedFrom > today)
      .sort((a, b) => a.order - b.order)
      .map((h) => ({
        id: h.id,
        order: h.order,
        startFrom: firstFrom(h),
        ...(h.versions.at(-1) as HabitVersion),
      }));
    const c = meta.challenge;
    return {
      today,
      storage: this.storage.kind,
      challenge: c ? { ...c, endDate: challengeEnd(c) } : null,
      habits,
    };
  }

  // ----- Challenge -----

  async setup(input: Challenge & { useSamples: boolean }) {
    const meta = await this.storage.getMeta();
    meta.challenge = { startDate: input.startDate, totalDays: input.totalDays };
    if (input.useSamples && meta.habits.length === 0) {
      meta.habits = SAMPLE_HABITS.map((s, i) => this.newHabit(s, input.startDate, i));
    }
    await this.storage.saveMeta(meta);
  }

  async updateChallenge(input: Challenge) {
    const meta = await this.storage.getMeta();
    if (input.startDate > todayISO()) throw new HttpError(400, "Tanggal mulai tidak boleh di masa depan.");
    meta.challenge = input;
    await this.storage.saveMeta(meta);
  }

  async extendChallenge(days: number) {
    const meta = await this.storage.getMeta();
    if (!meta.challenge) throw new HttpError(400, "Challenge belum dibuat.");
    meta.challenge.totalDays += days;
    await this.storage.saveMeta(meta);
  }

  // ----- Kegiatan -----

  private newHabit(input: HabitInput, from: string, order: number): Habit {
    return {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      order,
      archivedFrom: null,
      versions: [{ ...input, from }],
    };
  }

  async createHabit(input: HabitInput, startFrom?: string) {
    const meta = await this.storage.getMeta();
    const today = todayISO();
    let from = startFrom ?? today;
    if (from > today) throw new HttpError(400, "Tanggal mulai berlaku tidak boleh di masa depan.");
    if (meta.challenge && from < meta.challenge.startDate) from = meta.challenge.startDate;
    const order = meta.habits.reduce((m, h) => Math.max(m, h.order), -1) + 1;
    const habit = this.newHabit(input, from, order);
    meta.habits.push(habit);
    await this.storage.saveMeta(meta);
    return habit.id;
  }

  /** Perubahan berlaku mulai hari ini; riwayat sebelumnya memakai versi lama. */
  async updateHabit(id: string, input: HabitInput) {
    const meta = await this.storage.getMeta();
    const habit = this.findHabit(meta, id);
    const today = todayISO();
    const last = habit.versions.at(-1)!;
    if (last.from >= today) habit.versions[habit.versions.length - 1] = { ...input, from: last.from };
    else habit.versions.push({ ...input, from: today });
    await this.storage.saveMeta(meta);
  }

  async deleteHabit(id: string) {
    const meta = await this.storage.getMeta();
    const habit = this.findHabit(meta, id);
    const today = todayISO();
    if (firstFrom(habit) >= today) {
      // Belum punya riwayat — hapus permanen
      meta.habits = meta.habits.filter((h) => h.id !== id);
    } else {
      habit.archivedFrom = today;
    }
    await this.storage.saveMeta(meta);
  }

  async reorderHabits(ids: string[]) {
    const meta = await this.storage.getMeta();
    ids.forEach((id, i) => {
      const h = meta.habits.find((x) => x.id === id);
      if (h) h.order = i;
    });
    await this.storage.saveMeta(meta);
  }

  private findHabit(meta: Meta, id: string): Habit {
    const habit = meta.habits.find((h) => h.id === id && !h.archivedFrom);
    if (!habit) throw new HttpError(404, "Kegiatan tidak ditemukan.");
    return habit;
  }

  // ----- Hari -----

  async getDay(date: string) {
    return computeDay(await this.ctx(), date);
  }

  async getSummaries(from: string, to: string) {
    const ctx = await this.ctx();
    return eachDay(from, to).map((d) => toSummary(computeDay(ctx, d)));
  }

  async setEntry(date: string, habitId: string, entry: Entry) {
    const ctx = await this.ctx();
    const day = computeDay(ctx, date);
    if (!day.editable) throw new HttpError(400, "Tanggal ini tidak bisa diubah.");
    const item = day.items.find((i) => i.habitId === habitId);
    if (!item) throw new HttpError(404, "Kegiatan tidak dijadwalkan pada tanggal ini.");

    const log = ctx.logs[date] ?? { date, entries: {}, note: "", updatedAt: "" };
    log.entries[habitId] =
      item.type === "check" ? { done: !!entry.done } : { value: Math.max(0, entry.value ?? 0) };
    log.updatedAt = new Date().toISOString();
    await this.storage.saveDay(log);

    ctx.logs[date] = log;
    return computeDay(ctx, date);
  }

  async setNote(date: string, note: string) {
    const ctx = await this.ctx();
    if (!computeDay(ctx, date).editable) throw new HttpError(400, "Tanggal ini tidak bisa diubah.");
    const log = ctx.logs[date] ?? { date, entries: {}, note: "", updatedAt: "" };
    log.note = note;
    log.updatedAt = new Date().toISOString();
    await this.storage.saveDay(log);
  }

  // ----- Statistik -----

  async getStats(from: string, to: string): Promise<Stats> {
    const ctx = await this.ctx();
    const c = ctx.meta.challenge;
    const empty: Stats = {
      from, to, success: 0, fail: 0, rate: null, perfectDays: 0,
      trackedDays: 0, currentStreak: 0, bestStreak: 0, habits: [],
    };
    if (!c) return empty;

    const lastDay = minDate(challengeEnd(c), ctx.today);
    const days = c.startDate <= lastDay ? eachDay(c.startDate, lastDay).map((d) => computeDay(ctx, d)) : [];

    // Streak (hari sempurna berturut-turut) dihitung atas seluruh challenge
    let best = 0;
    let run = 0;
    for (const d of days) {
      if (d.isToday && d.pending > 0 && d.fail === 0) continue;
      run = isPerfect(d) ? run + 1 : 0;
      best = Math.max(best, run);
    }
    let current = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      const d = days[i]!;
      if (d.isToday && d.pending > 0 && d.fail === 0) continue;
      if (!isPerfect(d)) break;
      current++;
    }

    const perHabit = new Map<string, HabitStat>();
    const result: Stats = { ...empty, currentStreak: current, bestStreak: best };

    for (const d of days) {
      if (d.date < from || d.date > to) continue;
      if (d.success + d.fail + d.pending > 0) result.trackedDays++;
      if (isPerfect(d)) result.perfectDays++;
      result.success += d.success;
      result.fail += d.fail;
      for (const it of d.items) {
        if (it.status !== "success" && it.status !== "fail") continue;
        const h = ctx.meta.habits.find((x) => x.id === it.habitId)!;
        const latest = h.versions.at(-1)!;
        const s = perHabit.get(it.habitId) ?? {
          habitId: h.id, name: latest.name, emoji: latest.emoji,
          archived: !!h.archivedFrom, success: 0, fail: 0, rate: null,
        };
        if (it.status === "success") s.success++;
        else s.fail++;
        perHabit.set(it.habitId, s);
      }
    }

    const total = result.success + result.fail;
    result.rate = total > 0 ? result.success / total : null;
    result.habits = [...perHabit.values()]
      .map((s) => ({ ...s, rate: s.success + s.fail > 0 ? s.success / (s.success + s.fail) : null }))
      .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
    return result;
  }
}
