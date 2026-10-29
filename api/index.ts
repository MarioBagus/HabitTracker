// Entry point Vercel Serverless Function.
// Semua request /api/* di-rewrite ke sini (lihat vercel.json) lalu ditangani Express.
import app from "../server/src/app";

export default app;
