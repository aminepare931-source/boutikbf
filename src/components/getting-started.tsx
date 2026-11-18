import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInstall, wasInstalled } from "@/lib/install";

type Step = {
  id: string;
  label: string;
  hint: string;
  done: boolean;
  optional?: boolean;
  to: "/products" | "/pos" | "/employees" | "/installer";
  cta: string;
};

const hiddenKey = (shopId: string) => `boutikbf-start-hidden-${shopId}`;

/**
 * Liste « Pour bien démarrer » du tableau de bord : le chemin le plus court entre
 * l'inscription et la première vente. Elle se coche toute seule d'après les données
 * réelles de la boutique, et peut être masquée.
 */
export function GettingStarted({ shopId }: { shopId: string }) {
  const { standalone } = useInstall();
  const [hidden, setHidden] = useState(true);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(hiddenKey(shopId)) === "1");
    } catch {
      setHidden(false);
    }
    setInstalled(wasInstalled());
  }, [shopId]);

  const { data } = useQuery({
    queryKey: ["getting-started", shopId],
    queryFn: async () => {
      const count = async (table: "products" | "sales" | "employees") => {
        const { count: n } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId);
        return n ?? 0;
      };
      const [products, sales, employees] = await Promise.all([
        count("products"),
        count("sales"),
        count("employees"),
      ]);
      return { products, sales, employees };
    },
    staleTime: 30_000,
  });

  if (hidden || !data) return null;

  const steps: Step[] = [
    {
      id: "products",
      label: "Ajoutez vos premiers produits",
      hint: "Importez votre liste depuis Excel ou ajoutez-les un par un.",
      done: data.products > 0,
      to: "/products",
      cta: "Ajouter des produits",
    },
    {
      id: "sale",
      label: "Faites votre première vente",
      hint: "Ouvrez la caisse, touchez un produit et encaissez.",
      done: data.sales > 0,
      to: "/pos",
      cta: "Ouvrir la caisse",
    },
    {
      id: "install",
      label: "Installez l'application sur votre téléphone",
      hint: "Elle s'ouvre en plein écran et la caisse marche même sans réseau.",
      done: standalone || installed,
      optional: true,
      to: "/installer",
      cta: "Comment faire",
    },
    {
      id: "employee",
      label: "Ajoutez un employé de caisse",
      hint: "Il vend avec son code PIN, sans accès à vos chiffres.",
      done: data.employees > 0,
      optional: true,
      to: "/employees",
      cta: "Ajouter un employé",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const next = steps.find((s) => !s.done);

  const hide = () => {
    try {
      localStorage.setItem(hiddenKey(shopId), "1");
    } catch {
      /* stockage indisponible */
    }
    setHidden(true);
  };

  return (
    <section
      aria-label="Pour bien démarrer"
      className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold">Pour bien démarrer</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {doneCount} étape{doneCount > 1 ? "s" : ""} sur {steps.length}
          </p>
        </div>
        <button
          type="button"
          onClick={hide}
          aria-label="Masquer cette liste"
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-background"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={doneCount}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="mt-4 space-y-2.5">
        {steps.map((s) => (
          <li
            key={s.id}
            className={`flex items-center gap-3 rounded-xl bg-background p-3 ${s.done ? "opacity-60" : ""}`}
          >
            {s.done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Fait" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-label="À faire" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${s.done ? "line-through" : ""}`}>
                {s.label}
                {s.optional && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">facultatif</span>
                )}
              </p>
              {!s.done && <p className="text-xs text-muted-foreground">{s.hint}</p>}
            </div>
            {!s.done && s.id === next?.id && (
              <Link
                to={s.to}
                className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
              >
                {s.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
