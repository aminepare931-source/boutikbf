import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { employeeHomePath, getEmployeeSession } from "@/lib/employee-session";

/**
 * Point d'entrée de l'application installée : chaque personne arrive au bon endroit.
 *  - employé déjà connecté  -> son espace
 *  - patron déjà connecté   -> le tableau de bord
 *  - sinon                  -> la bonne page de connexion (patron ou employé,
 *                              selon ce qui a été utilisé en dernier sur cet appareil)
 */
export const Route = createFileRoute("/start")({
  ssr: false,
  head: () => ({ meta: [{ title: "BoutikBF" }, { name: "robots", content: "noindex" }] }),
  component: Start,
});

function Start() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const employee = getEmployeeSession();
      if (employee) {
        navigate({ to: employeeHomePath(employee.role), replace: true });
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      let last: string | null = null;
      try {
        last = localStorage.getItem("boutikbf-last-login");
      } catch {
        /* stockage indisponible */
      }
      navigate({ to: last === "employee" ? "/auth-employee" : "/auth", replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Chargement" />
    </div>
  );
}
