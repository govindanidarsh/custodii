import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"], // other images are already matched by globPatterns (listing them twice breaks precaching)
      manifest: {
        id: "/",
        name: "CUSTODI — Your Personal Digital Bodyguard",
        short_name: "CUSTODI",
        description: "Check suspicious placement, internship and recruiter messages and links. Analysis runs on your device.",
        start_url: "/scan?source=pwa",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0a1222",
        theme_color: "#0a1222",
        categories: ["security", "education", "utilities"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        // Lets Android users "Share" a message from another app into CUSTODI (installed PWA only).
        share_target: {
          action: "/scan",
          method: "GET",
          params: { title: "title", text: "text", url: "url" },
        },
        shortcuts: [
          { name: "Scan a message", url: "/scan?tab=message", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Check a website", url: "/website", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Only Vite's content-hashed bundles skip revisioning; brand images in /assets get a revision so they update.
        dontCacheBustURLsMatching: /assets\/.+-[A-Za-z0-9_-]{8}\.(?:js|css|woff2)$/,
        // The intro videos are deliberately NOT precached (large, only needed once); offline the intro falls back to the code animation.
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
