import { ChevronLeft, ChevronRight, NotebookPen } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Emoji } from "../components/Emoji";
import { Sheet } from "../components/Sheet";
import { ErrorNote, Loading, Segmented, StatusMark } from "../components/ui";
import { useDay, useDays, useMeta, useStats } from "../hooks/queries";
import {
  addMonths,
  dayOfWeek,
  formatLong,
  formatMonth,
  maxOf,
  minOf,
  monthEnd,
  monthStart,
  WEEKDAYS,
} from "../lib/date";
import { formatNumber, percent, rateColor } from "../lib/format";
import type { ChallengeView, DaySummary } from "../lib/types";

export function CalendarPage() {
  const meta = useMeta();
  if (meta.isPending) return <Loading />;
  if (meta.error) return <ErrorNote error={meta.error} />;
  if (!meta.data.challenge)
    return (
      <div className="pt-16 text-center">
        <p className="font-semibold">Belum ada challenge.</p>
        <Link to="/" className="mt-2 inline-block text-sm font-semibold text-pine">
          Mulai challenge di halaman Hari Ini
        </Link>
      </div>
    );
  return <CalendarView today={meta.data.today} challenge={meta.data.challenge} />;
}

function CalendarView({ today, challenge }: { today: string; challenge: ChallengeView }) {
  const [month, setMonth] = useState(() => monthStart(minOf(today, challenge.endDate)));
  const [selected, setSelected] = useState<string | null>(null);
  const [scope, setScope] = useState<"month" | "all">("month");

  const from = monthStart(month);
  const to = monthEnd(month);
  const days = useDays(from, to);

  const statsFrom = scope === "month" ? maxOf(from, challenge.startDate) : challenge.startDate;
  const statsTo = scope === "month" ? minOf(to, challenge.endDate) : challenge.endDate;
  const stats = useStats(statsFrom, statsTo);

  const canPrev = from > challenge.startDate;
  const canNext = to < maxOf(today, challenge.endDate);
  const leading = (dayOfWeek(from) + 6) % 7;

  return (
    <div className="space-y-7 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-[32px] font-bold capitalize leading-tight tracking-tight">{formatMonth(month)}</h1>
        <div className="-mr-2 flex">
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            disabled={!canPrev}
            onClick={() => setMonth(addMonths(month, -1))}
            className="grid size-10 place-items-center rounded-full hover:bg-surface disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Bulan berikutnya"
            disabled={!canNext}
            onClick={() => setMonth(addMonths(month, 1))}
            className="grid size-10 place-items-center rounded-full hover:bg-surface disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Kalender */}
      <section className="rounded-3xl bg-surface p-3">
        <div className="grid grid-cols-7 pb-1 text-center text-xs font-semibold text-muted">
          {WEEKDAYS.map((d) => (
            <span key={d.value} className="py-1.5">
              {d.short}
            </span>
          ))}
        </div>
        {days.isPending ? (
          <Loading />
        ) : days.error ? (
          <ErrorNote error={days.error} />
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leading }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {days.data.map((d) => (
              <DayCell key={d.date} day={d} onSelect={setSelected} />
            ))}
          </div>
        )}
        <Legend />
      </section>

      {/* Statistik */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="font-display text-lg font-bold">Statistik</h2>
          <div className="w-56">
            <Segmented
              label="Rentang statistik"
              value={scope}
              onChange={setScope}
              options={[
                { value: "month", label: "Bulan ini" },
                { value: "all", label: "Challenge" },
              ]}
            />
          </div>
        </div>

        {stats.isPending ? (
          <Loading />
        ) : stats.error ? (
          <ErrorNote error={stats.error} />
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-line">
              <Stat label="Keberhasilan" value={percent(stats.data.rate)} big />
              <Stat label="Hari sempurna" value={`${stats.data.perfectDays}/${stats.data.trackedDays}`} big />
              <Stat label="Berhasil" value={formatNumber(stats.data.success)} tone="pine" />
              <Stat label="Gagal" value={formatNumber(stats.data.fail)} tone="berry" />
              <Stat label="Streak sekarang" value={`${stats.data.currentStreak} hari`} />
              <Stat label="Streak terbaik" value={`${stats.data.bestStreak} hari`} />
            </dl>

            {stats.data.habits.length > 0 && (
              <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-surface">
                {stats.data.habits.map((h) => (
                  <li key={h.habitId} className="flex items-center gap-3 px-4 py-3">
                    <Emoji native={h.emoji} size={24} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold">
                          {h.name}
                          {h.archived && <span className="ml-1.5 font-normal text-muted">(dihapus)</span>}
                        </span>
                        <span className="shrink-0 text-sm tabular-nums">
                          <span className="font-semibold">{percent(h.rate)}</span>
                          <span className="ml-1.5 text-xs text-muted">
                            {h.success}/{h.success + h.fail}
                          </span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-berry-soft">
                        <div className="h-full rounded-full bg-pine" style={{ width: `${(h.rate ?? 0) * 100}%` }} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <DayDetailSheet date={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function DayCell({ day, onSelect }: { day: DaySummary; onSelect: (d: string) => void }) {
  const num = Number(day.date.slice(8));
  const active = day.inChallenge && !day.isFuture;
  const bg = active ? rateColor(day.rate, day.fail) : undefined;
  const strong = (day.rate ?? 0) >= 0.6;

  if (!active) {
    return (
      <span
        className={`grid aspect-square place-items-center rounded-xl text-sm ${
          day.inChallenge ? "border border-dashed border-line text-muted" : "text-muted/50"
        }`}
      >
        {num}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(day.date)}
      aria-label={`${formatLong(day.date)}: ${day.success} berhasil, ${day.fail} gagal`}
      className={`relative grid aspect-square place-items-center rounded-xl text-sm font-semibold transition active:scale-95 ${
        day.isToday ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : ""
      } ${bg ? "" : "bg-surface-2"}`}
      style={{ background: bg, color: bg && strong ? "var(--surface)" : undefined }}
    >
      {num}
      {day.hasNote && <span className="absolute bottom-1 size-1 rounded-full bg-current opacity-70" aria-hidden />}
    </button>
  );
}

function Legend() {
  const swatch = (bg: string) => <span className="inline-block size-3 rounded" style={{ background: bg }} />;
  return (
    <div className="mt-3 flex items-center justify-between px-1 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        {swatch("var(--berry-soft)")} Semua gagal
      </span>
      <span className="flex items-center gap-1">
        Sedikit
        {[0.1, 0.4, 0.7, 1].map((r) => (
          <span key={r}>{swatch(rateColor(r, 0)!)}</span>
        ))}
        Semua berhasil
      </span>
    </div>
  );
}

function Stat({ label, value, big, tone }: { label: string; value: string; big?: boolean; tone?: "pine" | "berry" }) {
  const color = tone === "pine" ? "text-pine" : tone === "berry" ? "text-berry" : "";
  return (
    <div className="bg-surface px-4 py-3.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`font-display font-bold tabular-nums ${big ? "text-[28px] leading-tight" : "text-lg"} ${color}`}>{value}</dd>
    </div>
  );
}

function DayDetailSheet({ date, onClose }: { date: string | null; onClose: () => void }) {
  const day = useDay(date);
  return (
    <Sheet open={!!date} onClose={onClose} title={date ? formatLong(date) : ""}>
      {day.isPending ? (
        <Loading />
      ) : day.error ? (
        <ErrorNote error={day.error} />
      ) : (
        <div className="space-y-4 pb-2">
          <p className="text-sm text-muted">
            Hari ke-{day.data.dayNumber}, <span className="font-semibold text-pine">{day.data.success} berhasil</span>,{" "}
            <span className="font-semibold text-berry">{day.data.fail} gagal</span>
            {day.data.pending > 0 && `, ${day.data.pending} belum`}
          </p>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface-2/60">
            {day.data.items.map((it) => (
              <li key={it.habitId} className="flex items-center gap-3 px-3.5 py-2.5">
                <Emoji native={it.emoji} size={22} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{it.name}</span>
                {it.type === "quantity" && (
                  <span className="text-xs tabular-nums text-muted">
                    {formatNumber(it.value ?? 0)}/{formatNumber(it.target ?? 0)} {it.unit}
                  </span>
                )}
                <StatusMark status={it.status} size={22} />
              </li>
            ))}
          </ul>
          {day.data.note.trim() && (
            <div className="rounded-2xl bg-surface-2/60 p-3.5">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
                <NotebookPen size={13} /> Catatan
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{day.data.note}</p>
            </div>
          )}
          <Link
            to={day.data.isToday ? "/" : `/day/${day.data.date}`}
            className="flex h-12 items-center justify-center rounded-2xl bg-pine text-[15px] font-semibold text-white dark:text-[#0f1a15]"
          >
            Ubah data tanggal ini
          </Link>
        </div>
      )}
    </Sheet>
  );
}
