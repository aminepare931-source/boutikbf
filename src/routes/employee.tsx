import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { EmployeeShell } from "@/components/employee-shell";
import { useEffect, useState } from "react";
import { getEmployeeSession, employeeLogout, type EmployeeSession } from "@/lib/employee-session";
import { useShops } from "@/lib/shop-store";

export const Route = createFileRoute("/employee")({
  ssr: false,
  component: EmployeeLayout,
});

function EmployeeLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [checking, setChecking] = useState(true);
  const { current } = useShops();

  useEffect(() => {
    const s = getEmployeeSession();
    if (!s) {
      navigate({ to: "/auth-employee" });
    } else {
      setSession(s);
    }
    setChecking(false);

    // Si la session expire pendant l'utilisation, retour à la connexion
    const timer = window.setInterval(() => {
      if (!getEmployeeSession()) navigate({ to: "/auth-employee" });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  if (current?.is_suspended) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-bold">Boutique suspendue</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          L&apos;accès à {current.name} est temporairement suspendu. Contactez votre gérant.
        </p>
        <button
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
          onClick={async () => {
            await employeeLogout();
            navigate({ to: "/auth-employee" });
          }}
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  return (
    <EmployeeShell role={session.role} employeeName={session.name}>
      <Outlet />
    </EmployeeShell>
  );
}
