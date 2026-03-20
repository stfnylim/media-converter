import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Replace 'media-converter' with your actual GitHub repo name
export default defineConfig({
  base: "/media-converter/",
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
