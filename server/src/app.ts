import express, { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { router } from "./routes";
import { HttpError } from "./services/tracker";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use("/api", router);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan." });
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues[0]?.message ?? "Input tidak valid." });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : "Terjadi kesalahan server." });
};
app.use(errorHandler);

export default app;
