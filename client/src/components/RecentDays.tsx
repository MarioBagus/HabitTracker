import { NotebookPen } from "lucide-react";
import { Link } from "react-router";
import { formatShort } from "../lib/date";
import { percent } from "../lib/format";
import type { DaySummary } from "../lib/types";

/** Ringkasan 10 hari terakhir — satu baris per hari, minimalis. */
export function RecentDays({ days }: { days: DaySummary[] }) {
  if (days.length === 0) {
    return <p className="px-1 text-sm text-muted">Riwayat akan muncul di sini mulai besok.</p>;
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-surface">
      {days.map((d) => {
        const total = d.success + d.fail + d.pending;
        return (
          <li key={d.date}>
            <Link to={`/day/${d.date}`} className="flex items-center gap-3 px-4 py-3 active:bg-surface-2">
              <span className="w-24 shrink-0">
                <span className="block text-sm font-semibold">{formatShort(d.date)}</span>
                <span className="block text-xs text-muted">Hari ke-{d.dayNumber}</span>
              </span>
              <span className="flex h-2 flex-1 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                {total > 0 && (
                  <>
                    <span className="bg-pine" style={{ width: `${(d.success / total) * 100}%` }} />
                    <span className="bg-berry/70" style={{ width: `${(d.fail / total) * 100}%` }} />
                  </>
                )}
              </span>
              <span className="w-[4.5rem] shrink-0 text-right text-sm tabular-nums">
                <span className="font-semibold">{d.success}</span>
                <span className="text-muted">/{total}</span>
                <span className="ml-1.5 text-xs text-muted">{percent(d.rate)}</span>
              </span>
              <NotebookPen
                size={14}
                className={d.hasNote ? "text-muted" : "invisible"}
                aria-label={d.hasNote ? "Ada catatan" : undefined}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
