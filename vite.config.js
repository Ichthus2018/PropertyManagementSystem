// component 2 (vite.config.js) - OPTIMIZED

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep your existing chunks
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@supabase/supabase-js",
          ],
          // Add new chunks for specific libraries
          ui: ["react-icons", "react-responsive-carousel"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
