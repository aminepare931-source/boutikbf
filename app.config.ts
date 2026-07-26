import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    preset: "vercel",
  },
  vite: {
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
    },
  },
  head: {
    meta: [
      { name: "description", content: "BoutikBF - Gestion de boutique" },
      { name: "theme-color", content: "#ffffff" },
    ],
    link: [
      { rel: "icon", type: "image/png", href: "/logo.png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
    ],
  },
});
