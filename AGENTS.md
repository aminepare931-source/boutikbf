# BoutikBF — notes projet

## Stack & déploiement (100 % autonome)

- Vite + TanStack Start (SSR) + TanStack Router + Tailwind 4 + Nitro.
- `vite.config.ts` est la configuration complète, sans wrapper éditeur tiers.
- Déploiement : **Vercel** (`vercel.json`, `NITRO_PRESET=vercel`, sortie dans `.output/`,
  démarrable en local avec `npm run build && npm start`).
- Base de données : **Supabase** (projet `boutikbf`, ref `fxjtajofzqfbxojmgrqt`).

## Conventions

- Ne jamais réécrire l'historique git déjà poussé sur `main` (pas de force-push,
  rebase ou amend de commits publiés).
- Les fonctions SQL `admin_*` sont SECURITY DEFINER + `is_super_admin()` : les
  garder en lecture seule sauf besoin explicite, et ne jamais les exposer à `anon`.
- Nouvelles migrations SQL : fichier dans `supabase/migrations/` PUIS application
  réelle avec `supabase db query --remote=fxjtajofzqfbxojmgrqt --yes -f <fichier>`.
- Les fichiers `supabase/APPLIQUER_*.sql` sont des copies pour l'éditeur SQL
  Supabase (méthode historique) ; la CLI est désormais la méthode recommandée.
- `src/routeTree.gen.ts` est généré automatiquement par le plugin TanStack Router
  (dès que `npm run dev` ou `npm run build` tourne) — ne pas le modifier à la main.
