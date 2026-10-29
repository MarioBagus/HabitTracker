import { ArrowDown, ArrowUp, ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router";
import { Emoji } from "../components/Emoji";
import { ErrorNote, Loading } from "../components/ui";
import { useMeta, useReorderHabits } from "../hooks/queries";
import { habitMeta } from "../lib/format";

export function HabitsPage() {
  const meta = useMeta();
  const reorder = useReorderHabits();

  if (meta.isPending) return <Loading />;
  if (meta.error) return <ErrorNote error={meta.error} />;
  const habits = meta.data.habits;

  const move = (index: number, dir: -1 | 1) => {
    const ids = habits.map((h) => h.id);
    const [id] = ids.splice(index, 1);
    ids.splice(index + dir, 0, id!);
    reorder.mutate(ids);
  };

  return (
    <div className="space-y-6 pt-2">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[32px] font-bold leading-tight tracking-tight">Kegiatan</h1>
          <p className="text-sm text-muted">{habits.length} kegiatan aktif</p>
        </div>
        <Link
          to="/habits/new"
          className="inline-flex h-11 items-center gap-1.5 rounded-2xl bg-pine px-4 text-sm font-semibold text-white dark:text-[#0f1a15]"
        >
          <Plus size={18} strokeWidth={2.6} /> Tambah
        </Link>
      </header>

      {habits.length === 0 ? (
        <div className="rounded-3xl bg-surface p-6 text-center">
          <p className="font-semibold">Belum ada kegiatan.</p>
          <p className="mt-1 text-sm text-muted">Mulai dari satu kebiasaan kecil, misalnya membaca 10 menit.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-surface">
          {habits.map((h, i) => (
            <li key={h.id} className="flex items-center">
              <Link to={`/habits/${h.id}`} className="flex min-w-0 flex-1 items-center gap-3.5 py-3.5 pl-4 active:bg-surface-2">
                <Emoji native={h.emoji} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{h.name}</span>
                  <span className="block truncate text-[13px] text-muted">{habitMeta(h, { withSchedule: true })}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-muted" />
              </Link>
              <span className="flex flex-col pr-2 pl-1">
                <button
                  type="button"
                  aria-label={`Naikkan ${h.name}`}
                  disabled={i === 0 || reorder.isPending}
                  onClick={() => move(i, -1)}
                  className="grid size-7 place-items-center rounded-full text-muted hover:bg-surface-2 disabled:opacity-25"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  aria-label={`Turunkan ${h.name}`}
                  disabled={i === habits.length - 1 || reorder.isPending}
                  onClick={() => move(i, 1)}
                  className="grid size-7 place-items-center rounded-full text-muted hover:bg-surface-2 disabled:opacity-25"
                >
                  <ArrowDown size={15} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
