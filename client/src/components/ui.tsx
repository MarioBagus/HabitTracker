import { Check, X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Status } from "../lib/types";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "soft" }) {
  const styles = {
    primary: "bg-pine text-white dark:text-[#0f1a15] hover:brightness-110",
    soft: "bg-surface-2 text-ink hover:bg-line",
    ghost: "text-ink hover:bg-surface-2",
    danger: "text-berry hover:bg-berry-soft",
  }[variant];
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-semibold transition disabled:opacity-50 ${styles} ${className}`}
    />
  );
}

/** Kontrol pilihan bersebelahan. */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-2xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition ${
            o.value === value ? "bg-surface text-ink shadow-sm" : "text-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StatusMark({ status, size = 30 }: { status: Status; size?: number }) {
  const icon = Math.round(size * 0.55);
  if (status === "success")
    return (
      <span className="animate-pop grid shrink-0 place-items-center rounded-full bg-pine text-white dark:text-[#0f1a15]" style={{ width: size, height: size }}>
        <Check size={icon} strokeWidth={3} />
      </span>
    );
  if (status === "fail")
    return (
      <span className="grid shrink-0 place-items-center rounded-full bg-berry-soft text-berry" style={{ width: size, height: size }}>
        <X size={icon} strokeWidth={3} />
      </span>
    );
  return (
    <span
      className={`shrink-0 rounded-full border-2 ${status === "optional" ? "border-dashed border-line" : "border-line"}`}
      style={{ width: size, height: size }}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[15px] outline-none transition placeholder:text-muted/70 focus:border-pine";

export function Loading() {
  return <p className="py-16 text-center text-sm text-muted">Memuat…</p>;
}

export function ErrorNote({ error }: { error: unknown }) {
  return (
    <p className="rounded-2xl bg-berry-soft px-4 py-3 text-sm text-berry">
      {error instanceof Error ? error.message : "Terjadi kesalahan."} Periksa koneksi ke server lalu muat ulang halaman.
    </p>
  );
}
