import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatNumber, habitMeta } from "../lib/format";
import type { DayItem } from "../lib/types";
import { Emoji } from "./Emoji";
import { StatusMark } from "./ui";

interface Props {
  item: DayItem;
  editable: boolean;
  onChange: (v: { done?: boolean; value?: number }) => void;
}

function subtitle(item: DayItem) {
  const parts = [habitMeta(item)].filter(Boolean);
  if (item.week) parts.push(`minggu ini ${item.week.done}/${item.week.required}`);
  if (item.status === "optional" && item.week && item.week.done >= item.week.required) parts.push("target tercapai");
  return parts.join(", ");
}

export function HabitRow({ item, editable, onChange }: Props) {
  if (item.type === "quantity") return <QuantityRow item={item} editable={editable} onChange={onChange} />;

  return (
    <button
      type="button"
      disabled={!editable}
      aria-pressed={item.done}
      onClick={() => onChange({ done: !item.done })}
      className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition active:bg-surface-2 disabled:cursor-default"
    >
      <Emoji native={item.emoji} size={30} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{item.name}</span>
        {subtitle(item) && <span className="block truncate text-[13px] text-muted">{subtitle(item)}</span>}
      </span>
      <StatusMark key={item.status} status={item.status} />
    </button>
  );
}

/** Kegiatan berbasis jumlah (mis. minum air 2 L): input nilai aktual. */
function QuantityRow({ item, editable, onChange }: Props) {
  const target = item.target ?? 1;
  const step = Number.isInteger(target) && target >= 4 ? 1 : 0.25;
  const [value, setValue] = useState(item.value ?? 0);
  const [editing, setEditing] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // Sinkron dengan data server bila berubah dari luar
  useEffect(() => {
    setValue(item.value ?? 0);
  }, [item.value]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const commit = (next: number) => {
    const v = Math.max(0, Math.round(next * 100) / 100);
    setValue(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange({ value: v }), 450);
  };

  const pct = Math.min(100, (value / target) * 100);

  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <Emoji native={item.emoji} size={30} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[15px] font-semibold">{item.name}</span>
          {editing ? (
            <input
              type="number"
              inputMode="decimal"
              autoFocus
              defaultValue={value}
              min={0}
              step="any"
              aria-label={`Jumlah ${item.name}`}
              onBlur={(e) => {
                setEditing(false);
                commit(Number(e.target.value) || 0);
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="w-20 rounded-lg border border-pine bg-surface px-2 py-0.5 text-right text-sm font-semibold outline-none"
            />
          ) : (
            <button
              type="button"
              disabled={!editable}
              onClick={() => setEditing(true)}
              className="shrink-0 text-sm font-semibold tabular-nums"
              aria-label={`Ubah jumlah ${item.name}`}
            >
              <span className={item.status === "success" ? "text-pine" : item.status === "fail" ? "text-berry" : ""}>
                {formatNumber(value)}
              </span>
              <span className="text-muted"> / {formatNumber(target)} {item.unit}</span>
            </button>
          )}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              item.status === "fail" ? "bg-berry" : "bg-pine"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {item.durationMinutes || item.week || item.schedule.kind !== "daily" ? (
          <span className="mt-1 block truncate text-[13px] text-muted">{subtitle({ ...item, target: null })}</span>
        ) : null}
      </div>
      {editable && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Kurangi ${item.name}`}
            onClick={() => commit(value - step)}
            disabled={value <= 0}
            className="grid size-9 place-items-center rounded-full bg-surface-2 text-ink disabled:opacity-40"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            aria-label={`Tambah ${item.name}`}
            onClick={() => commit(value + step)}
            className="grid size-9 place-items-center rounded-full bg-pine-soft text-pine"
          >
            <Plus size={16} strokeWidth={2.6} />
          </button>
        </div>
      )}
    </div>
  );
}
