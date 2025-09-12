import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: "@/",
        replacement: path.resolve(__dirname, "src") + "/",
      },
      {
        find: "@shared/",
        replacement: path.resolve(__dirname, "shared") + "/",
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "src"),
      },
      {
        find: "@shared",
        replacement: path.resolve(__dirname, "shared"),
      },
    ],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
