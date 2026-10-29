import { useState } from "react";
import { usePrefs, type EmojiSet } from "../lib/prefs";

// Gambar emoji dari emoji-datasource (versi yang sama dengan data emoji-mart)
const VERSION = "15.1.2";

export function emojiUrl(native: string, set: EmojiSet) {
  const unified = Array.from(native)
    .map((c) => c.codePointAt(0)!.toString(16))
    .join("-");
  return `https://cdn.jsdelivr.net/npm/emoji-datasource-${set}@${VERSION}/img/${set}/64/${unified}.png`;
}

interface Props {
  native: string;
  size?: number;
  set?: EmojiSet;
  className?: string;
}

/** Emoji dengan tampilan seragam di semua perangkat; kembali ke emoji bawaan jika gambar tidak ada. */
export function Emoji({ native, size = 24, set, className = "" }: Props) {
  const prefs = usePrefs();
  const activeSet = set ?? prefs.emojiSet;
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const src = emojiUrl(native, activeSet);

  if (failedFor === src) {
    return (
      <span
        role="img"
        aria-label={native}
        className={`inline-flex items-center justify-center leading-none ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.85 }}
      >
        {native}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={native}
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      onError={() => setFailedFor(src)}
      className={`inline-block shrink-0 select-none ${className}`}
    />
  );
}
