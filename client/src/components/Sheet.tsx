import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Bottom sheet modal untuk mobile. */
export function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] max-w-md flex-col rounded-t-[28px] bg-surface pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line" aria-hidden />
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="-mr-2 grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
