import { defineConfig, loadEnv, type UserConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// Configuration Vite 100 % autonome (TanStack Start + Nitro, sans wrapper éditeur).
// NB : le plugin react doit rester APRÈS tanstackStart(), sinon double injection
// du RefreshRuntime → le HMR se casse et les composants ne répondent plus.

export default defineConfig(({ command, mode }) => {
  const plugins = [];

  if (mode === "development") {
    plugins.push(
      devtools({
        logging: false,
        eventBusConfig: { enabled: false },
        enhancedLogs: { enabled: false },
        consolePiping: { enabled: false },
        removeDevtoolsOnBuild: false,
        injectSource: { enabled: true },
      }),
    );
  }

  plugins.push(
    tailwindcss(),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
  );

  // Build serveur : Nitro. `defaultPreset` n'est utilisé que si aucun
  // hébergeur n'est auto-détecté ; sur Vercel, NITRO_PRESET=vercel (vercel.json)
  // et la détection automatique prennent le relais.
  if (command === "build") {
    plugins.push(nitro({ defaultPreset: "vercel" }));
  }

  plugins.push(viteReact());

  // Variables VITE_* injectées aussi côté serveur.
  const envDefine: Record<string, string> = {};
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
  for (const [key, value] of Object.entries(loadedEnv)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  const config: UserConfig = {
    define: envDefine,
    css: { transformer: "lightningcss" },
    resolve: {
      tsconfigPaths: true, // natif depuis Vite 8 (remplace vite-tsconfig-paths)
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
    },
    plugins,
  };

  // `npm run build:dev` : build en mode development (mêmes garantissants qu'en prod).
  // (Le `esbuild.keepNames` de l'ancien wrapper est inutile : Vite 8/rolldown
  // conserve déjà les noms par défaut.)
  if (command === "build" && mode === "development") {
    config.environments = {
      client: { define: { "process.env.NODE_ENV": JSON.stringify("development") } },
    };
  }

  return config;
});
