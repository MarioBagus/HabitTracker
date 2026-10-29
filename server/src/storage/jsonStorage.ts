import { promises as fs } from "node:fs";
import path from "node:path";
import type { DayLog, Meta } from "../types";
import { emptyMeta, type Storage } from "./types";

interface FileShape {
  meta: Meta;
  days: Record<string, DayLog>;
}

/** Penyimpanan file JSON untuk penggunaan lokal (single user). */
export class JsonStorage implements Storage {
  readonly kind = "json" as const;
  private cache: FileShape | null = null;
  private writing: Promise<void> = Promise.resolve();

  constructor(private readonly file: string) {}

  private async load(): Promise<FileShape> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(this.file, "utf8");
      const parsed = JSON.parse(raw) as Partial<FileShape>;
      this.cache = { meta: parsed.meta ?? emptyMeta(), days: parsed.days ?? {} };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      this.cache = { meta: emptyMeta(), days: {} };
    }
    return this.cache;
  }

  /** Tulis atomik (file sementara lalu rename) dan berurutan. */
  private persist(): Promise<void> {
    this.writing = this.writing.then(async () => {
      const data = this.cache ?? { meta: emptyMeta(), days: {} };
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
      await fs.rename(tmp, this.file);
    });
    return this.writing;
  }

  async getMeta() {
    return structuredClone((await this.load()).meta);
  }

  async saveMeta(meta: Meta) {
    (await this.load()).meta = structuredClone(meta);
    await this.persist();
  }

  async getDay(date: string) {
    const day = (await this.load()).days[date];
    return day ? structuredClone(day) : null;
  }

  async getAllDays() {
    return structuredClone((await this.load()).days);
  }

  async saveDay(day: DayLog) {
    (await this.load()).days[day.date] = structuredClone(day);
    await this.persist();
  }
}
