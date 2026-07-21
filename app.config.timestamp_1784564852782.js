// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
var app_config_default = defineConfig({
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
    ],
    server: {
      host: "0.0.0.0",
      port: 3e3,
      strictPort: true,
    },
  },
});
export { app_config_default as default };
