import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Emoji } from "../components/Emoji";
import { Button, ErrorNote, Field, inputClass, Loading, Segmented } from "../components/ui";
import { useExtendChallenge, useMeta, useUpdateChallenge } from "../hooks/queries";
import { addDays, diffDays, formatMedium } from "../lib/date";
import { usePrefs, type EmojiSet, type ThemeMode } from "../lib/prefs";
import type { ChallengeView } from "../lib/types";

export function SettingsPage() {
  const meta = useMeta();
  const { theme, setTheme, emojiSet, setEmojiSet } = usePrefs();

  return (
    <div className="space-y-7 pt-2">
      <h1 className="font-display text-[32px] font-bold leading-tight tracking-tight">Pengaturan</h1>

      <section className="space-y-3">
        <h2 className="px-1 font-display text-lg font-bold">Tampilan</h2>
        <div className="space-y-5 rounded-3xl bg-surface p-5">
          <Field label="Tema">
            <Segmented<ThemeMode>
              label="Tema"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "light", label: <><Sun size={16} /> Terang</> },
                { value: "dark", label: <><Moon size={16} /> Gelap</> },
                { value: "system", label: <><Monitor size={16} /> Sistem</> },
              ]}
            />
          </Field>
          <Field label="Gaya emoji" hint="Tampilan emoji sama di semua perangkat.">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Gaya emoji">
              {(["apple", "google", "twitter"] as EmojiSet[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={emojiSet === s}
                  onClick={() => setEmojiSet(s)}
                  className={`rounded-2xl border-2 p-3 transition ${
                    emojiSet === s ? "border-pine bg-pine-soft" : "border-transparent bg-surface-2"
                  }`}
                >
                  <span className="flex justify-center gap-1">
                    {["🦉", "📚", "🌅"].map((e) => (
                      <Emoji key={e} native={e} set={s} size={22} />
                    ))}
                  </span>
                  <span className="mt-1.5 block text-sm font-semibold capitalize">{s}</span>
                </button>
              ))}
            </div>
          </Field>
        </div>
      </section>

      {meta.isPending ? (
        <Loading />
      ) : meta.error ? (
        <ErrorNote error={meta.error} />
      ) : (
        meta.data.challenge && (
          <ChallengeSettings key={JSON.stringify(meta.data.challenge)} challenge={meta.data.challenge} today={meta.data.today} />
        )
      )}

      {meta.data && (
        <p className="px-1 text-xs text-muted">
          Data tersimpan di {meta.data.storage === "redis" ? "Upstash Redis (cloud)" : "file JSON di server lokal"}.
          Tema dan gaya emoji disimpan di perangkat ini.
        </p>
      )}
    </div>
  );
}

function ChallengeSettings({ challenge, today }: { challenge: ChallengeView; today: string }) {
  const [startDate, setStartDate] = useState(challenge.startDate);
  const [totalDays, setTotalDays] = useState(challenge.totalDays);
  const [extra, setExtra] = useState(10);
  const update = useUpdateChallenge();
  const extend = useExtendChallenge();

  const elapsed = Math.min(Math.max(0, diffDays(challenge.startDate, today) + 1), challenge.totalDays);
  const dirty = startDate !== challenge.startDate || totalDays !== challenge.totalDays;

  return (
    <section className="space-y-3">
      <h2 className="px-1 font-display text-lg font-bold">Challenge</h2>

      <div className="rounded-3xl bg-surface p-5">
        <p className="font-display text-[28px] font-bold leading-tight">
          {elapsed}/{challenge.totalDays} hari
        </p>
        <p className="text-sm text-muted">
          {formatMedium(challenge.startDate)} sampai {formatMedium(challenge.endDate)}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-pine" style={{ width: `${(elapsed / challenge.totalDays) * 100}%` }} />
        </div>

        <p className="mb-2 mt-6 text-sm font-semibold">Perpanjang challenge</p>
        <div className="grid grid-cols-3 gap-2">
          {[7, 14, 30].map((n) => (
            <Button key={n} variant="soft" className="whitespace-nowrap px-2" disabled={extend.isPending} onClick={() => extend.mutate(n)}>
              +{n} hari
            </Button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={extra}
            onChange={(e) => setExtra(Math.max(1, Math.round(Number(e.target.value)) || 1))}
            aria-label="Jumlah hari tambahan"
            className={inputClass}
          />
          <Button disabled={extend.isPending} onClick={() => extend.mutate(extra)} className="shrink-0">
            Tambah {extra} hari
          </Button>
        </div>
        {extend.error && <p className="mt-2 text-sm text-berry">{extend.error.message}</p>}
      </div>

      <form
        className="space-y-4 rounded-3xl bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate({ startDate, totalDays });
        }}
      >
        <p className="text-sm font-semibold">Ubah periode</p>
        <div className="grid grid-cols-2 gap-3">
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
          <Field label="Total hari">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={3650}
              value={totalDays}
              onChange={(e) => setTotalDays(Math.max(1, Math.round(Number(e.target.value)) || 1))}
              className={inputClass}
            />
          </Field>
        </div>
        <p className="text-xs text-muted">Berakhir {formatMedium(addDays(startDate, totalDays - 1))}. Data harian yang sudah dicatat tidak terhapus.</p>
        {update.error && <p className="text-sm text-berry">{update.error.message}</p>}
        <Button type="submit" disabled={!dirty || update.isPending} className="w-full">
          {update.isPending ? "Menyimpan…" : "Simpan periode"}
        </Button>
      </form>
    </section>
  );
}
