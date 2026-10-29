import { Link } from "react-router";
import { formatShort } from "../lib/date";
import { percent, rateColor } from "../lib/format";
import type { DaySummary } from "../lib/types";

/**
 * Rantai hari: satu butir per hari challenge.
 * Warna menunjukkan tingkat keberhasilan; butir kosong = hari yang belum tiba.
 */
export function DayChain({ days, selected }: { days: DaySummary[]; selected: string }) {
  const size = days.length > 60 ? 10 : 14;
  return (
    <ol className="flex flex-wrap gap-[5px]" aria-label="Rantai hari challenge">
      {days.map((d) => {
        const color = d.isFuture ? undefined : rateColor(d.rate, d.fail);
        const label = `Hari ke-${d.dayNumber}, ${formatShort(d.date)}${
          d.isFuture ? ", belum tiba" : `, ${d.success} berhasil, ${d.fail} gagal (${percent(d.rate)})`
        }`;
        const ring =
          d.date === selected ? "outline-2 outline-offset-2 outline-ink outline" : d.isToday ? "outline outline-2 outline-offset-2 outline-pine" : "";
        const style = { width: size, height: size, background: color };
        const cls = `block rounded-full ${color ? "" : d.isFuture ? "border border-line" : "bg-surface-2"} ${ring}`;
        return (
          <li key={d.date}>
            {d.isFuture ? (
              <span className={cls} style={style} title={label} aria-label={label} />
            ) : (
              <Link to={d.isToday ? "/" : `/day/${d.date}`} className={cls} style={style} title={label} aria-label={label} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
