import { defineConfig } from "vite";

// Builds the popup page and the background service worker into dist/ (load that folder in chrome://extensions).
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    modulePreload: false,
    target: "chrome110",
    rollupOptions: {
      input: {
        popup: "popup.html",
        welcome: "welcome.html",
        background: "src/background.ts",
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
