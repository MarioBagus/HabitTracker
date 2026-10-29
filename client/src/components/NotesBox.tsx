import { useEffect, useRef, useState } from "react";
import { useSetNote } from "../hooks/queries";

/** Catatan harian dengan simpan otomatis. */
export function NotesBox({ date, initial, editable }: { date: string; initial: string; editable: boolean }) {
  const [text, setText] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saved = useRef(initial);
  const timer = useRef<number | undefined>(undefined);
  const setNote = useSetNote(date);

  const save = (value: string) => {
    window.clearTimeout(timer.current);
    if (value === saved.current) return;
    setState("saving");
    setNote.mutate(value, {
      onSuccess: () => {
        saved.current = value;
        setState("saved");
      },
      onError: () => setState("error"),
    });
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const status = { idle: "", saving: "Menyimpan…", saved: "Tersimpan", error: "Gagal menyimpan, coba lagi" }[state];

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="font-display text-lg font-bold">Catatan</h2>
        <span className={`text-xs ${state === "error" ? "text-berry" : "text-muted"}`} aria-live="polite">
          {status}
        </span>
      </div>
      <textarea
        value={text}
        readOnly={!editable}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => save(v), 800);
        }}
        onBlur={() => save(text)}
        rows={4}
        maxLength={5000}
        placeholder={editable ? "Bagaimana hari ini? Apa yang membantu, apa yang menghambat?" : "Tidak ada catatan."}
        className="w-full resize-none rounded-3xl bg-surface p-4 text-[15px] leading-relaxed outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-pine"
      />
    </section>
  );
}
