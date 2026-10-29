import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type EmojiSet = "apple" | "google" | "twitter";

interface Prefs {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  emojiSet: EmojiSet;
  setEmojiSet: (s: EmojiSet) => void;
  isDark: boolean;
}

const PrefsContext = createContext<Prefs | null>(null);

const read = <T extends string>(key: string, fallback: T): T => {
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* abaikan (mode privat dll.) */
  }
};

const media = () => window.matchMedia("(prefers-color-scheme: dark)");

/** Preferensi tampilan disimpan per perangkat (localStorage). */
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => read("ht-theme", "system"));
  const [emojiSet, setEmojiSetState] = useState<EmojiSet>(() => read("ht-emoji-set", "apple"));
  const [systemDark, setSystemDark] = useState(() => media().matches);

  useEffect(() => {
    const m = media();
    const onChange = () => setSystemDark(m.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  const isDark = theme === "dark" || (theme === "system" && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute("content", isDark ? "#121715" : "#F3F5F2"));
  }, [isDark]);

  const value: Prefs = {
    theme,
    setTheme: (t) => {
      setThemeState(t);
      write("ht-theme", t);
    },
    emojiSet,
    setEmojiSet: (s) => {
      setEmojiSetState(s);
      write("ht-emoji-set", s);
    },
    isDark,
  };

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs harus di dalam PrefsProvider");
  return ctx;
}
