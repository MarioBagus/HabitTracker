import { Router } from "express";
import { z } from "zod";
import { diffDays, isValidDate } from "./lib/date";
import { getStorage } from "./storage";
import { TrackerService } from "./services/tracker";

const service = () => new TrackerService(getStorage());

// ----- Validasi input -----

const dateSchema = z.string().refine(isValidDate, "Format tanggal harus YYYY-MM-DD.");

const scheduleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("daily") }),
  z.object({
    kind: z.literal("days"),
    days: z
      .array(z.number().int().min(0).max(6))
      .min(1, "Pilih minimal satu hari.")
      .transform((d) => [...new Set(d)].sort()),
  }),
  z.object({ kind: z.literal("weekly"), times: z.number().int().min(1).max(6) }),
]);

const habitSchema = z
  .object({
    name: z.string().trim().min(1, "Nama kegiatan wajib diisi.").max(60),
    emoji: z.string().min(1).max(32),
    type: z.enum(["check", "quantity"]),
    durationMinutes: z.number().int().min(1).max(1440).nullish(),
    target: z.number().positive().max(1_000_000).nullish(),
    unit: z.string().trim().max(20).nullish(),
    schedule: scheduleSchema,
  })
  .superRefine((v, ctx) => {
    if (v.type === "quantity" && !v.target) {
      ctx.addIssue({ code: "custom", path: ["target"], message: "Target jumlah wajib diisi." });
    }
    if (v.type === "quantity" && !v.unit) {
      ctx.addIssue({ code: "custom", path: ["unit"], message: "Satuan wajib diisi." });
    }
  })
  .transform((v) => ({
    name: v.name,
    emoji: v.emoji,
    type: v.type,
    durationMinutes: v.durationMinutes ?? null,
    target: v.type === "quantity" ? (v.target ?? null) : null,
    unit: v.type === "quantity" ? (v.unit ?? null) : null,
    schedule: v.schedule,
  }));

const challengeSchema = z.object({
  startDate: dateSchema,
  totalDays: z.number().int().min(1).max(3650),
});

const rangeSchema = z
  .object({ from: dateSchema, to: dateSchema })
  .refine((r) => r.from <= r.to, "'from' harus sebelum 'to'.")
  .refine((r) => diffDays(r.from, r.to) <= 400, "Rentang maksimal 400 hari.");

const param = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

// ----- Routes -----

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.get("/meta", async (_req, res) => {
  res.json(await service().getMeta());
});

router.post("/setup", async (req, res) => {
  const body = challengeSchema.extend({ useSamples: z.boolean().default(false) }).parse(req.body);
  await service().setup(body);
  res.json(await service().getMeta());
});

router.put("/challenge", async (req, res) => {
  await service().updateChallenge(challengeSchema.parse(req.body));
  res.json(await service().getMeta());
});

router.post("/challenge/extend", async (req, res) => {
  const { days } = z.object({ days: z.number().int().min(1).max(3650) }).parse(req.body);
  await service().extendChallenge(days);
  res.json(await service().getMeta());
});

router.post("/habits", async (req, res) => {
  const startFrom = dateSchema.optional().parse(req.body?.startFrom);
  const id = await service().createHabit(habitSchema.parse(req.body), startFrom);
  res.status(201).json({ id });
});

router.put("/habits/:id", async (req, res) => {
  await service().updateHabit(param(req.params.id), habitSchema.parse(req.body));
  res.json({ ok: true });
});

router.delete("/habits/:id", async (req, res) => {
  await service().deleteHabit(param(req.params.id));
  res.json({ ok: true });
});

router.post("/habits/reorder", async (req, res) => {
  const { ids } = z.object({ ids: z.array(z.string()).max(500) }).parse(req.body);
  await service().reorderHabits(ids);
  res.json({ ok: true });
});

router.get("/days", async (req, res) => {
  const { from, to } = rangeSchema.parse(req.query);
  res.json(await service().getSummaries(from, to));
});

router.get("/days/:date", async (req, res) => {
  res.json(await service().getDay(dateSchema.parse(param(req.params.date))));
});

router.patch("/days/:date/entries/:habitId", async (req, res) => {
  const date = dateSchema.parse(param(req.params.date));
  const entry = z
    .object({ done: z.boolean().optional(), value: z.number().min(0).max(1_000_000).optional() })
    .parse(req.body);
  res.json(await service().setEntry(date, param(req.params.habitId), entry));
});

router.put("/days/:date/note", async (req, res) => {
  const date = dateSchema.parse(param(req.params.date));
  const { note } = z.object({ note: z.string().max(5000) }).parse(req.body);
  await service().setNote(date, note);
  res.json({ ok: true });
});

router.get("/stats", async (req, res) => {
  const { from, to } = rangeSchema.parse(req.query);
  res.json(await service().getStats(from, to));
});
