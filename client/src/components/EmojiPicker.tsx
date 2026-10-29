import { useEffect, useRef, useState } from "react";
import { usePrefs } from "../lib/prefs";
import { Sheet } from "./Sheet";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (native: string) => void;
}

/** emoji-mart dimuat hanya saat dibutuhkan agar bundle awal tetap kecil. */
export function EmojiPicker({ open, onClose, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { emojiSet, isDark } = usePrefs();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [{ Picker }, data] = await Promise.all([import("emoji-mart"), import("@emoji-mart/data")]);
      if (cancelled || !ref.current) return;
      const picker = new Picker({
        data: data.default,
        set: emojiSet,
        theme: isDark ? "dark" : "light",
        previewPosition: "none",
        skinTonePosition: "search",
        maxFrequentRows: 2,
        dynamicWidth: true,
        onEmojiSelect: (e: { native: string }) => {
          onSelect(e.native);
          onClose();
        },
      });
      ref.current.replaceChildren(picker as unknown as Node);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, emojiSet, isDark, onSelect, onClose]);

  return (
    <Sheet open={open} onClose={onClose} title="Pilih emoji">
      {loading && <p className="py-10 text-center text-sm text-muted">Memuat emoji…</p>}
      <div ref={ref} className="pb-2" />
    </Sheet>
  );
}
