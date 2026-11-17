import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      "Cache-Control": "max-age=3600",
    },
    warmup: {
      clientFiles: [
        "./src/main.jsx",
        "./src/App.jsx",
        "./src/components/HeartIntro.jsx",
        "./src/pages/FullLetter.jsx",
        "./src/pages/Home.jsx",
        "./src/pages/Memories.jsx",
      ],
    },
    watch: {
      usePolling: false,
      ignored: [
        "**/scratch/**",
        "**/dist/**",
        "**/node_modules/**",
        "**/def-reference/**",
        "**/.cursor/**",
        "**/.git/**",
      ],
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
      "firebase/app",
      "firebase/firestore",
    ],
  },
  build: {
    target: "esnext",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/firebase")) return "firebase";
          if (id.includes("node_modules/lucide-react")) return "lucide";
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router")
          ) {
            return "vendor";
          }
        },
      },
    },
  },
});
