import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Saat development, request /api diteruskan ke server Express lokal
    proxy: { "/api": "http://localhost:4000" },
  },
});
