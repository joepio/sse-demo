import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const serverUrl = "http://localhost:8000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
  server: {
    proxy: {
      "/events": {
        target: serverUrl,
        changeOrigin: true,
      },
      "/schemas": {
        target: serverUrl,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  assetsInclude: ["**/*.json"],
});
