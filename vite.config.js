import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo-icon.png"],
      manifest: {
        name: "Tallynote",
        short_name: "Jurnal",
        start_url: "/",
        display: "standalone",
        background_color: "#f7f2eb",
        theme_color: "#6a7850",
        // icons: [
        //   { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
        //   { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
        //   { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        // ],
      },
    }),
  ],
  server: { port: 5173 },
});