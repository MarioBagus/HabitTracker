import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { DayChain } from "../components/DayChain";
import { HabitRow } from "../components/HabitRow";
import { NotesBox } from "../components/NotesBox";
import { RecentDays } from "../components/RecentDays";
import { SetupPanel } from "../components/SetupPanel";
import { Button, ErrorNote, Loading } from "../components/ui";
import { useDay, useDays, useExtendChallenge, useMeta, useSetEntry } from "../hooks/queries";
import { addDays, diffDays, formatLong, formatMedium, maxOf } from "../lib/date";
import type { ChallengeView, DayDetail } from "../lib/types";

export function TodayPage() {
  const params = useParams();
  const meta = useMeta();

  if (meta.isPending) return <Loading />;
  if (meta.error) return <ErrorNote error={meta.error} />;

  const { today, challenge } = meta.data;
  if (!challenge) return <SetupPanel today={today} />;

  const date = params.date && params.date <= today ? params.date : today;
  return <DayView key={date} date={date} today={today} challenge={challenge} hasHabits={meta.data.habits.length > 0} />;
}

function DayView({
  date,
  today,
  challenge,
  hasHabits,
}: {
  date: string;
  today: string;
  challenge: ChallengeView;
  hasHabits: boolean;
}) {
  const navigate = useNavigate();
  const day = useDay(date);
  const chainFrom = maxOf(challenge.startDate, addDays(challenge.endDate, -399));
  const chain = useDays(chainFrom, challenge.endDate);
  const setEntry = useSetEntry(date);

  const isToday = date === today;
  const canPrev = date > challenge.startDate;
  const go = (d: string) => navigate(d === today ? "/" : `/day/${d}`);

  const recent = (chain.data ?? [])
    .filter((d) => d.date < today && d.date >= addDays(today, -10))
    .reverse();

  return (
    <div className="space-y-7">
      {/* Kepala: tanggal + navigasi hari */}
      <header className="pt-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted">
            {day.data?.dayNumber
              ? `Hari ke-${day.data.dayNumber} dari ${challenge.totalDays}`
              : date < challenge.startDate
                ? `Challenge mulai ${formatMedium(challenge.startDate)}`
                : "Di luar periode challenge"}
          </p>
          <div className="-mr-2 flex items-center">
            {!isToday && (
              <Link to="/" className="mr-1 rounded-full px-3 py-1.5 text-xs font-semibold text-pine hover:bg-pine-soft">
                Hari ini
              </Link>
            )}
            <button
              type="button"
              aria-label="Hari sebelumnya"
              disabled={!canPrev}
              onClick={() => go(addDays(date, -1))}
              className="grid size-10 place-items-center rounded-full text-ink hover:bg-surface disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Hari berikutnya"
              disabled={isToday}
              onClick={() => go(addDays(date, 1))}
              className="grid size-10 place-items-center rounded-full text-ink hover:bg-surface disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <h1 className="mt-1 font-display text-[32px] font-bold leading-[1.1] tracking-tight">{formatLong(date)}</h1>

        <div className="mt-5">
          {chain.data && <DayChain days={chain.data} selected={date} />}
          <p className="mt-3 text-sm text-muted">
            Progress{" "}
            <span className="font-semibold text-ink">
              {Math.min(Math.max(0, diffDays(challenge.startDate, today) + 1), challenge.totalDays)}/{challenge.totalDays} hari
            </span>
            , selesai {formatMedium(challenge.endDate)}
          </p>
        </div>
      </header>

      {today > challenge.endDate && isToday && <ChallengeDone challenge={challenge} />}

      {/* Daftar kegiatan */}
      {day.isPending ? (
        <Loading />
      ) : day.error ? (
        <ErrorNote error={day.error} />
      ) : (
        day.data.inChallenge && (
          <>
            <section>
              {day.data.items.length > 0 ? (
                <>
                  <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-surface">
                    {day.data.items.map((item) => (
                      <li key={item.habitId}>
                        <HabitRow
                          item={item}
                          editable={day.data.editable}
                          onChange={(v) => setEntry.mutate({ habitId: item.habitId, ...v })}
                        />
                      </li>
                    ))}
                  </ul>
                  <Tally day={day.data} />
                </>
              ) : (
                <EmptyHabits hasHabits={hasHabits} />
              )}
            </section>

            <NotesBox date={date} initial={day.data.note} editable={day.data.editable} />
          </>
        )
      )}

      {isToday && (
        <section>
          <h2 className="mb-2 px-1 font-display text-lg font-bold">10 hari terakhir</h2>
          <RecentDays days={recent} />
        </section>
      )}
    </div>
  );
}

function Tally({ day }: { day: DayDetail }) {
  return (
    <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 px-1 text-sm">
      <span>
        <span className="font-display text-xl font-bold text-pine">{day.success}</span>{" "}
        <span className="text-muted">berhasil</span>
      </span>
      <span>
        <span className="font-display text-xl font-bold text-berry">{day.fail}</span>{" "}
        <span className="text-muted">gagal</span>
      </span>
      {day.pending > 0 && (
        <span>
          <span className="font-display text-xl font-bold text-honey">{day.pending}</span>{" "}
          <span className="text-muted">belum</span>
        </span>
      )}
    </p>
  );
}

function EmptyHabits({ hasHabits }: { hasHabits: boolean }) {
  return (
    <div className="rounded-3xl bg-surface p-6 text-center">
      <p className="font-semibold">{hasHabits ? "Tidak ada kegiatan terjadwal hari ini." : "Belum ada kegiatan."}</p>
      <p className="mt-1 text-sm text-muted">
        {hasHabits ? "Nikmati hari bebasmu." : "Tambahkan kegiatan yang ingin kamu lacak setiap hari."}
      </p>
      {!hasHabits && (
        <Link
          to="/habits/new"
          className="mt-4 inline-flex h-11 items-center rounded-2xl bg-pine px-5 text-sm font-semibold text-white dark:text-[#0f1a15]"
        >
          Tambah kegiatan
        </Link>
      )}
    </div>
  );
}

function ChallengeDone({ challenge }: { challenge: ChallengeView }) {
  const extend = useExtendChallenge();
  return (
    <div className="rounded-3xl bg-pine-soft p-5">
      <p className="font-display text-xl font-bold">Challenge {challenge.totalDays} hari selesai</p>
      <p className="mt-1 text-sm text-muted">Tambah hari untuk melanjutkan tracking tanpa memutus riwayat.</p>
      <div className="mt-4 flex gap-2">
        {[7, 14, 30].map((n) => (
          <Button key={n} variant="primary" className="flex-1 whitespace-nowrap px-2" disabled={extend.isPending} onClick={() => extend.mutate(n)}>
            +{n} hari
          </Button>
        ))}
      </div>
    </div>
  );
}
