import { Redis } from "@upstash/redis";
import type { DayLog, Meta } from "../types";
import { emptyMeta, type Storage } from "./types";

/**
 * Penyimpanan Upstash Redis (REST) — cocok untuk serverless Vercel, ada free tier.
 * Struktur key:
 *   <prefix>:meta  -> JSON challenge + kegiatan
 *   <prefix>:days  -> HASH { "YYYY-MM-DD": DayLog }
 */
export class RedisStorage implements Storage {
  readonly kind = "redis" as const;
  private readonly redis: Redis;

  constructor(url: string, token: string, private readonly prefix = "habit") {
    this.redis = new Redis({ url, token });
  }

  private get metaKey() {
    return `${this.prefix}:meta`;
  }
  private get daysKey() {
    return `${this.prefix}:days`;
  }

  async getMeta() {
    return (await this.redis.get<Meta>(this.metaKey)) ?? emptyMeta();
  }

  async saveMeta(meta: Meta) {
    await this.redis.set(this.metaKey, meta);
  }

  async getDay(date: string) {
    return (await this.redis.hget<DayLog>(this.daysKey, date)) ?? null;
  }

  async getAllDays() {
    return (await this.redis.hgetall<Record<string, DayLog>>(this.daysKey)) ?? {};
  }

  async saveDay(day: DayLog) {
    await this.redis.hset(this.daysKey, { [day.date]: day });
  }
}
