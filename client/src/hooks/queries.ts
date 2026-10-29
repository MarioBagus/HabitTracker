import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { DayDetail, HabitInput, Status } from "../lib/types";

export const keys = {
  meta: ["meta"] as const,
  day: (date: string) => ["day", date] as const,
  days: (from: string, to: string) => ["days", from, to] as const,
  stats: (from: string, to: string) => ["stats", from, to] as const,
};

/** Data turunan (ringkasan, statistik, detail hari) perlu dihitung ulang setelah ada perubahan. */
const refreshDerived = (qc: QueryClient) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: ["day"] }),
    qc.invalidateQueries({ queryKey: ["days"] }),
    qc.invalidateQueries({ queryKey: ["stats"] }),
  ]);

const refreshAll = (qc: QueryClient) =>
  Promise.all([qc.invalidateQueries({ queryKey: keys.meta }), refreshDerived(qc)]);

// ----- Queries -----

export const useMeta = () => useQuery({ queryKey: keys.meta, queryFn: api.meta });

export const useDay = (date: string | null | undefined) =>
  useQuery({ queryKey: keys.day(date ?? ""), queryFn: () => api.day(date!), enabled: !!date });

export const useDays = (from: string | null, to: string | null) =>
  useQuery({
    queryKey: keys.days(from ?? "", to ?? ""),
    queryFn: () => api.days(from!, to!),
    enabled: !!from && !!to && from <= to,
  });

export const useStats = (from: string | null, to: string | null) =>
  useQuery({
    queryKey: keys.stats(from ?? "", to ?? ""),
    queryFn: () => api.stats(from!, to!),
    enabled: !!from && !!to && from <= to,
  });

// ----- Mutations -----

export function useSetEntry(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { habitId: string; done?: boolean; value?: number }) =>
      api.setEntry(date, v.habitId, { done: v.done, value: v.value }),
    // Update optimistis agar centang terasa instan
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: keys.day(date) });
      const prev = qc.getQueryData<DayDetail>(keys.day(date));
      if (prev) {
        qc.setQueryData<DayDetail>(keys.day(date), {
          ...prev,
          items: prev.items.map((it) => {
            if (it.habitId !== v.habitId) return it;
            const done = v.done ?? (it.target ? (v.value ?? 0) >= it.target : (v.value ?? 0) > 0);
            const status: Status = done ? "success" : it.status === "success" ? "pending" : it.status;
            return { ...it, done, value: v.value ?? it.value, status };
          }),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.day(date), ctx.prev);
    },
    onSuccess: (detail) => qc.setQueryData(keys.day(date), detail),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["days"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useSetNote(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => api.setNote(date, note),
    onSuccess: (_r, note) => {
      qc.setQueryData<DayDetail>(keys.day(date), (d) => (d ? { ...d, note, hasNote: !!note.trim() } : d));
      qc.invalidateQueries({ queryKey: ["days"] });
    },
  });
}

export function useSetup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.setup, onSuccess: () => refreshAll(qc) });
}

export function useUpdateChallenge() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateChallenge, onSuccess: () => refreshAll(qc) });
}

export function useExtendChallenge() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.extendChallenge, onSuccess: () => refreshAll(qc) });
}

export function useSaveHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id?: string; data: HabitInput; startFrom?: string }) =>
      v.id ? api.updateHabit(v.id, v.data) : api.createHabit({ ...v.data, startFrom: v.startFrom }),
    onSuccess: () => refreshAll(qc),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteHabit, onSuccess: () => refreshAll(qc) });
}

export function useReorderHabits() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.reorderHabits, onSuccess: () => refreshAll(qc) });
}
