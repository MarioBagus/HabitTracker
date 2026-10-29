import type { DayDetail, DaySummary, HabitInput, MetaResponse, Stats } from "./types";

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body?.error ?? `Permintaan gagal (${res.status}).`);
  return body as T;
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) });

export const api = {
  meta: () => request<MetaResponse>("/meta"),
  setup: (data: { startDate: string; totalDays: number; useSamples: boolean }) =>
    request<MetaResponse>("/setup", json("POST", data)),
  updateChallenge: (data: { startDate: string; totalDays: number }) =>
    request<MetaResponse>("/challenge", json("PUT", data)),
  extendChallenge: (days: number) => request<MetaResponse>("/challenge/extend", json("POST", { days })),

  createHabit: (data: HabitInput & { startFrom?: string }) =>
    request<{ id: string }>("/habits", json("POST", data)),
  updateHabit: (id: string, data: HabitInput) => request(`/habits/${id}`, json("PUT", data)),
  deleteHabit: (id: string) => request(`/habits/${id}`, { method: "DELETE" }),
  reorderHabits: (ids: string[]) => request("/habits/reorder", json("POST", { ids })),

  day: (date: string) => request<DayDetail>(`/days/${date}`),
  days: (from: string, to: string) => request<DaySummary[]>(`/days?from=${from}&to=${to}`),
  setEntry: (date: string, habitId: string, entry: { done?: boolean; value?: number }) =>
    request<DayDetail>(`/days/${date}/entries/${habitId}`, json("PATCH", entry)),
  setNote: (date: string, note: string) => request(`/days/${date}/note`, json("PUT", { note })),

  stats: (from: string, to: string) => request<Stats>(`/stats?from=${from}&to=${to}`),
};
