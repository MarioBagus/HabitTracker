import { useState } from "react";
import { useSetup } from "../hooks/queries";
import { addDays, formatMedium } from "../lib/date";
import { Button, Field, inputClass } from "./ui";

const PRESETS = [7, 14, 21, 30, 60, 90];

/** Tampil saat challenge belum dibuat. */
export function SetupPanel({ today }: { today: string }) {
  const [startDate, setStartDate] = useState(today);
  const [totalDays, setTotalDays] = useState(30);
  const [useSamples, setUseSamples] = useState(true);
  const setup = useSetup();

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="font-display text-[34px] font-bold leading-tight">Mulai challenge baru</h1>
        <p className="mt-2 text-[15px] text-muted">
          Tentukan berapa hari kamu ingin konsisten. Durasi bisa diperpanjang kapan saja.
        </p>
      </div>

      <form
        className="space-y-5 rounded-3xl bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setup.mutate({ startDate, totalDays, useSamples });
        }}
      >
        <Field label="Tanggal mulai">
          <input
            type="date"
            required
            value={startDate}
            max={today}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-semibold">Durasi</span>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTotalDays(n)}
                aria-pressed={totalDays === n}
                className={`h-11 rounded-2xl text-sm font-semibold transition ${
                  totalDays === n ? "bg-pine text-white dark:text-[#0f1a15]" : "bg-surface-2"
                }`}
              >
                {n} hari
              </button>
            ))}
          </div>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={3650}
            value={totalDays}
            onChange={(e) => setTotalDays(Math.max(1, Number(e.target.value) || 1))}
            aria-label="Durasi custom (hari)"
            className={`${inputClass} mt-2`}
          />
          <p className="mt-1.5 text-xs text-muted">
            Berakhir {formatMedium(addDays(startDate, totalDays - 1))}
          </p>
        </div>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={useSamples}
            onChange={(e) => setUseSamples(e.target.checked)}
            className="mt-0.5 size-5 accent-[var(--pine)]"
          />
          <span className="text-sm">
            <span className="font-semibold">Tambahkan contoh kegiatan</span>
            <span className="block text-muted">Duolingo, lari, baca buku, journaling, dan lainnya. Bisa diubah nanti.</span>
          </span>
        </label>

        {setup.error && <p className="text-sm text-berry">{setup.error.message}</p>}
        <Button type="submit" disabled={setup.isPending} className="w-full">
          {setup.isPending ? "Menyiapkan…" : "Mulai challenge"}
        </Button>
      </form>
    </div>
  );
}
