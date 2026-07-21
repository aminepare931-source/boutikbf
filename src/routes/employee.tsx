import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { EmployeeShell } from "@/components/employee-shell";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/employee")({
  component: EmployeeLayout,
});

function EmployeeLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("boutikbf-employee-session");
      if (!raw) {
        navigate({ to: "/auth-employee" });
        return;
      }
      const s = JSON.parse(raw);
      if (!s.pin || !s.name) {
        navigate({ to: "/auth-employee" });
        return;
      }
      setSession(s);
    } catch {
      navigate({ to: "/auth-employee" });
    } finally {
      setChecking(false);
    }
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <EmployeeShell role={session.role || "cashier"} employeeName={session.name}>
      <Outlet />
    </EmployeeShell>
  );
}
