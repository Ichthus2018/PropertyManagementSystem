import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  base: "/", //custom domain, always set base: "/".
  // base: "/PropertyManagementSystem/", // is only used if your site is served under https://username.github.io/PropertyManagementSystem/.
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
    outDir: "dist", // build directly to docs/
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@supabase/supabase-js",
          ],
          ui: ["react-icons", "react-responsive-carousel"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
