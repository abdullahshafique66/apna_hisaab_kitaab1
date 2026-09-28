import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";

// `npm run build` → normal multi-file PWA build (dist/)
// `npm run build:single` → one self-contained HTML file (dist-single/) used for the hosted preview
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "single" ? [viteSingleFile()] : [])],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // `npm run dev` forwards /api to the FastAPI server, so VITE_API_URL=/api/v1 works on laptop *and* phone.
  server: { proxy: { "/api": "http://127.0.0.1:8000" } },
  preview: { proxy: { "/api": "http://127.0.0.1:8000" } },
  optimizeDeps: { entries: ["index.html"] },
  define: {
    __SINGLE__: JSON.stringify(mode === "single"),
  },
  build: {
    outDir: mode === "single" ? "dist-single" : "dist",
    chunkSizeWarningLimit: 900,
  },
}));
