import path from "node:path";
import { JsonStorage } from "./jsonStorage";
import { RedisStorage } from "./redisStorage";
import type { Storage } from "./types";

export type { Storage } from "./types";

let instance: Storage | null = null;

/**
 * Pilih penyimpanan berdasarkan environment:
 * - Ada kredensial Upstash  -> Redis (dipakai di Vercel)
 * - Tidak ada & jalan lokal -> file JSON
 */
export function getStorage(): Storage {
  if (instance) return instance;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    instance = new RedisStorage(url, token, process.env.STORAGE_PREFIX || "habit");
  } else if (process.env.VERCEL) {
    throw new Error(
      "Penyimpanan belum dikonfigurasi. Di Vercel, file JSON tidak bisa disimpan permanen — " +
        "set UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN (lihat README).",
    );
  } else {
    const file = process.env.DATA_FILE
      ? path.resolve(process.env.DATA_FILE)
      : path.resolve(__dirname, "../../data/db.json");
    instance = new JsonStorage(file);
  }
  return instance;
}
