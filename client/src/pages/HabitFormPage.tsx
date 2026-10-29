import { ChevronLeft, Minus, Plus, Trash2 } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Emoji } from "../components/Emoji";
import { EmojiPicker } from "../components/EmojiPicker";
import { Button, ErrorNote, Field, inputClass, Loading, Segmented } from "../components/ui";
import { useDeleteHabit, useMeta, useSaveHabit } from "../hooks/queries";
import { formatMedium, WEEKDAYS } from "../lib/date";
import type { HabitInput, HabitType, Schedule } from "../lib/types";

const UNIT_SUGGESTIONS = ["L", "ml", "gelas", "halaman", "km", "langkah", "kali", "menit"];

const blank: HabitInput = {
  name: "",
  emoji: "✨",
  type: "check",
  durationMinutes: null,
  target: null,
  unit: null,
  schedule: { kind: "daily" },
};

export function HabitFormPage() {
  const { id } = useParams();
  const meta = useMeta();

  if (meta.isPending) return <Loading />;
  if (meta.error) return <ErrorNote error={meta.error} />;

  const existing = id ? meta.data.habits.find((h) => h.id === id) : undefined;
  if (id && !existing) {
    return (
      <div className="pt-16 text-center">
        <p className="font-semibold">Kegiatan tidak ditemukan.</p>
        <Link to="/habits" className="mt-2 inline-block text-sm font-semibold text-pine">
          Kembali ke daftar kegiatan
        </Link>
      </div>
    );
  }

  return (
    <HabitForm
      key={id ?? "new"}
      id={id}
      initial={existing ?? blank}
      today={meta.data.today}
      challengeStart={meta.data.challenge?.startDate ?? meta.data.today}
    />
  );
}

function HabitForm({
  id,
  initial,
  today,
  challengeStart,
}: {
  id?: string;
  initial: HabitInput;
  today: string;
  challengeStart: string;
}) {
  const navigate = useNavigate();
  const save = useSaveHabit();
  const remove = useDeleteHabit();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [form, setForm] = useState<HabitInput>({
    name: initial.name,
    emoji: initial.emoji,
    type: initial.type,
    durationMinutes: initial.durationMinutes,
    target: initial.target,
    unit: initial.unit,
    schedule: initial.schedule,
  });
  const [startFrom, setStartFrom] = useState(today);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof HabitInput>(key: K, value: HabitInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const onSelectEmoji = useCallback((e: string) => setForm((f) => ({ ...f, emoji: e })), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  const setScheduleKind = (kind: Schedule["kind"]) => {
    if (kind === form.schedule.kind) return;
    set(
      "schedule",
      kind === "daily" ? { kind } : kind === "days" ? { kind, days: [1, 3, 5] } : { kind, times: 3 },
    );
  };

  const toggleDay = (d: number) => {
    if (form.schedule.kind !== "days") return;
    const days = form.schedule.days.includes(d)
      ? form.schedule.days.filter((x) => x !== d)
      : [...form.schedule.days, d];
    set("schedule", { kind: "days", days });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Nama kegiatan wajib diisi.");
    if (form.type === "quantity" && !(form.target && form.target > 0)) return setError("Isi target jumlah lebih dari 0.");
    if (form.type === "quantity" && !form.unit?.trim()) return setError("Isi satuan, misalnya L atau halaman.");
    if (form.schedule.kind === "days" && form.schedule.days.length === 0) return setError("Pilih minimal satu hari.");

    save.mutate(
      { id, data: { ...form, name: form.name.trim(), unit: form.unit?.trim() || null }, startFrom: id ? undefined : startFrom },
      { onSuccess: () => navigate("/habits"), onError: (err) => setError(err.message) },
    );
  };

  const onDelete = () => {
    if (!id) return;
    if (!window.confirm(`Hapus "${initial.name}"? Riwayat hari-hari sebelumnya tetap tersimpan.`)) return;
    remove.mutate(id, { onSuccess: () => navigate("/habits"), onError: (err) => setError(err.message) });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 pt-2">
      <header className="flex items-center gap-2">
        <Link to="/habits" aria-label="Kembali" className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-surface">
          <ChevronLeft size={22} />
        </Link>
        <h1 className="font-display text-2xl font-bold">{id ? "Ubah kegiatan" : "Kegiatan baru"}</h1>
      </header>

      {/* Emoji + nama */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Pilih emoji"
          className="grid size-[72px] shrink-0 place-items-center rounded-3xl bg-surface transition active:scale-95"
        >
          <Emoji native={form.emoji} size={44} />
        </button>
        <div className="flex-1">
          <label htmlFor="habit-name" className="mb-1.5 block text-sm font-semibold">
            Nama kegiatan
          </label>
          <input
            id="habit-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Contoh: Minum air"
            maxLength={60}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-5 rounded-3xl bg-surface p-5">
        <Field label="Cara mencatat">
          <Segmented<HabitType>
            label="Cara mencatat"
            value={form.type}
            onChange={(t) => set("type", t)}
            options={[
              { value: "check", label: "Centang selesai" },
              { value: "quantity", label: "Isi jumlah" },
            ]}
          />
        </Field>

        {form.type === "quantity" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Target per hari">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={form.target ?? ""}
                  onChange={(e) => set("target", e.target.value ? Number(e.target.value) : null)}
                  placeholder="2"
                  className={inputClass}
                />
              </Field>
              <Field label="Satuan">
                <input
                  value={form.unit ?? ""}
                  onChange={(e) => set("unit", e.target.value)}
                  placeholder="L"
                  maxLength={20}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {UNIT_SUGGESTIONS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => set("unit", u)}
                  aria-pressed={form.unit === u}
                  className={`h-8 rounded-full px-3 text-sm font-medium transition ${
                    form.unit === u ? "bg-pine-soft text-pine" : "bg-surface-2 text-muted"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">Hari dihitung berhasil jika jumlah mencapai target.</p>
          </div>
        )}

        <Field label="Durasi (opsional)" hint="Ditampilkan sebagai pengingat, misalnya 10 menit.">
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={1440}
              value={form.durationMinutes ?? ""}
              onChange={(e) => set("durationMinutes", e.target.value ? Math.round(Number(e.target.value)) : null)}
              placeholder="10"
              className={`${inputClass} pr-16`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted">menit</span>
          </div>
        </Field>
      </div>

      {/* Jadwal */}
      <div className="space-y-4 rounded-3xl bg-surface p-5">
        <Field label="Jadwal">
          <Segmented<Schedule["kind"]>
            label="Jadwal"
            value={form.schedule.kind}
            onChange={setScheduleKind}
            options={[
              { value: "daily", label: "Setiap hari" },
              { value: "days", label: "Hari tertentu" },
              { value: "weekly", label: "X kali/minggu" },
            ]}
          />
        </Field>

        {form.schedule.kind === "days" && (
          <div>
            <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Pilih hari">
              {WEEKDAYS.map((d) => {
                const on = form.schedule.kind === "days" && form.schedule.days.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    aria-pressed={on}
                    aria-label={d.long}
                    onClick={() => toggleDay(d.value)}
                    className={`h-11 rounded-xl text-sm font-semibold transition ${
                      on ? "bg-pine text-white dark:text-[#0f1a15]" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {d.short}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">Kegiatan hanya muncul dan dihitung di hari yang dipilih.</p>
          </div>
        )}

        {form.schedule.kind === "weekly" && (
          <div>
            <div className="flex items-center justify-between rounded-2xl bg-surface-2 p-2">
              <button
                type="button"
                aria-label="Kurangi"
                disabled={form.schedule.times <= 1}
                onClick={() => form.schedule.kind === "weekly" && set("schedule", { kind: "weekly", times: form.schedule.times - 1 })}
                className="grid size-10 place-items-center rounded-xl bg-surface disabled:opacity-40"
              >
                <Minus size={18} />
              </button>
              <span className="font-display text-xl font-bold">{form.schedule.times}x seminggu</span>
              <button
                type="button"
                aria-label="Tambah"
                disabled={form.schedule.times >= 6}
                onClick={() => form.schedule.kind === "weekly" && set("schedule", { kind: "weekly", times: form.schedule.times + 1 })}
                className="grid size-10 place-items-center rounded-xl bg-surface disabled:opacity-40"
              >
                <Plus size={18} />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">
              Muncul setiap hari dan boleh dilakukan di hari apa saja. Dihitung gagal di hari Minggu jika target minggu itu
              tidak tercapai.
            </p>
          </div>
        )}
      </div>

      {!id && challengeStart < today && (
        <div className="rounded-3xl bg-surface p-5">
          <Field label="Mulai dilacak sejak" hint="Pilih tanggal lebih awal jika ingin mengisi hari-hari yang sudah lewat.">
            <input
              type="date"
              value={startFrom}
              min={challengeStart}
              max={today}
              onChange={(e) => setStartFrom(e.target.value || today)}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {id && (
        <p className="px-1 text-xs text-muted">
          Perubahan berlaku mulai hari ini ({formatMedium(today)}). Riwayat sebelumnya tidak berubah.
        </p>
      )}

      {error && <p className="rounded-2xl bg-berry-soft px-4 py-3 text-sm text-berry">{error}</p>}

      <div className="space-y-2">
        <Button type="submit" disabled={save.isPending} className="w-full">
          {save.isPending ? "Menyimpan…" : id ? "Simpan perubahan" : "Tambah kegiatan"}
        </Button>
        {id && (
          <Button variant="danger" onClick={onDelete} disabled={remove.isPending} className="w-full">
            <Trash2 size={18} /> Hapus kegiatan
          </Button>
        )}
      </div>

      <EmojiPicker open={pickerOpen} onClose={closePicker} onSelect={onSelectEmoji} />
    </form>
  );
}
