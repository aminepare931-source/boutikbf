import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Store, Users, ShieldCheck, ArrowLeft, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/superadmin")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Super Admin — BoutikBF" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) throw redirect({ to: "/auth" });
    const { data: ok } = await (supabase as any).rpc("is_super_admin");
    if (ok !== true) throw redirect({ to: "/dashboard" });
  },
  component: SuperAdminLayout,
});

const NAV = [
  { to: "/superadmin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { to: "/superadmin/shops", label: "Boutiques", icon: Store },
  { to: "/superadmin/users", label: "Utilisateurs", icon: Users },
  { to: "/superadmin/admins", label: "Admins & journal", icon: ShieldCheck },
] as const;

function SuperAdminLayout() {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };
  return (
    <div className="min-h-screen bg-secondary/10">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <img src={logo} alt="BoutikBF" className="h-8 w-auto" />
          <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-destructive">
            Super Admin
          </span>
          <nav className="ml-2 flex flex-1 flex-wrap gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: "exact" in n && n.exact }}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                activeProps={{
                  className: "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                }}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </nav>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Mon app
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
