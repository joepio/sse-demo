import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/events": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/issues": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/cloudevents": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
