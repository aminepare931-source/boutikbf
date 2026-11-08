import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: false }),
    // NB : le plugin react (viteReact) est injecté par @lovable.dev/vite-tanstack-config.
    // Ne pas l'ajouter ici, sinon double injection de RefreshRuntime → le HMR se casse
    // et les composants (simulateur, etc.) ne répondent plus.
  ],
});
