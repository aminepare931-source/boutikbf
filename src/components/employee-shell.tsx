import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Warehouse,
  Wallet,
  Settings,
  LogOut,
  Store,
  Search,
  Sun,
  Moon,
  ChevronDown,
  Plus,
  Bell,
  UserCog,
  Receipt,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { useShops } from "@/lib/shop-store";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";

type Role = "cashier" | "manager" | "accountant";

const NAV_ITEMS = [
  {
    to: "/employee/dashboard",
    icon: LayoutDashboard,
    label: "Tableau de bord",
    roles: ["cashier", "manager", "accountant"],
  },
  { to: "/employee/pos", icon: Receipt, label: "Caisse (POS)", roles: ["cashier", "manager"] },
  {
    to: "/employee/sales",
    icon: ShoppingCart,
    label: "Ventes",
    roles: ["cashier", "manager", "accountant"],
  },
  {
    to: "/employee/products",
    icon: Package,
    label: "Produits",
    roles: ["cashier", "manager", "accountant"],
  },
  { to: "/employee/stock", icon: Warehouse, label: "Stock", roles: ["manager", "accountant"] },
  {
    to: "/employee/clients",
    icon: Users,
    label: "Clients",
    roles: ["cashier", "manager", "accountant"],
  },
  { to: "/employee/suppliers", icon: Truck, label: "Fournisseurs", roles: ["manager"] },
  {
    to: "/employee/accounting",
    icon: Wallet,
    label: "Argent entre & sort",
    roles: ["manager", "accountant"],
  },
  {
    to: "/employee/reports",
    icon: BarChart3,
    label: "Mes chiffres",
    roles: ["manager", "accountant"],
  },
  { to: "/employee/team", icon: UserCog, label: "Mon équipe", roles: ["manager"] },
];

export function EmployeeShell({
  children,
  role,
  employeeName,
}: {
  children: ReactNode;
  role: Role;
  employeeName: string;
}) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { current } = useShops();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUser({ email: u?.email, name: (u?.user_metadata as any)?.full_name });
    });
  }, []);

  const roleLabel: Record<Role, string> = {
    cashier: "Caissier / Vendeur",
    manager: "Gérant de boutique",
    accountant: "Comptable",
  };

  const roleBadgeVariant: Record<Role, "default" | "secondary" | "outline"> = {
    cashier: "outline",
    manager: "default",
    accountant: "secondary",
  };

  const handleLogout = () => {
    localStorage.removeItem("boutikbf-employee-session");
    toast.success("Déconnexion réussie");
    navigate({ to: "/auth-employee" });
  };

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <img
            src={logo}
            alt="BoutikBF"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="font-display text-lg font-bold text-sidebar-foreground">BoutikBF</span>
        </div>
        <div className="bf-flag-bar h-1 w-full" />

        {/* Shop info */}
        <div className="p-3">
          <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2.5">
            <Store className="h-4 w-4 text-sidebar-foreground" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-sidebar-foreground">
                {current?.name ?? "Boutique"}
              </div>
              <div className="text-xs text-muted-foreground">{current?.currency ?? "—"}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {filteredNav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
              {employeeName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-sidebar-foreground">
                {employeeName}
              </div>
              <Badge variant={roleBadgeVariant[role]} className="text-[10px]">
                {roleLabel[role]}
              </Badge>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:hidden">
          <Store className="h-5 w-5 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display font-bold">{current?.name ?? "Boutique"}</div>
            <div className="text-xs text-muted-foreground">{roleLabel[role]}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex sticky top-0 z-30 h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-xl">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher..." className="pl-9" />
          </div>
          <Button variant="ghost" size="icon" onClick={toggle}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
