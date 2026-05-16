import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) can assign the same single-letter alias to imports
        // from different chunks (e.g. `r` from both the JSX-runtime chunk and the
        // main bundle), which produces a duplicate binding — a TDZ error in Firefox.
        // Keeping full export names avoids the collision.
        minifyInternalExports: false,
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/hubs": {
        target: "http://localhost:5000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
