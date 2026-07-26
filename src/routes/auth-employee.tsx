import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, User, Lock } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth-employee")({
  head: () => ({
    meta: [{ title: "Connexion Employé — BoutikBF" }, { name: "robots", content: "noindex" }],
  }),
  component: EmployeeAuthPage,
});

function EmployeeAuthPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Vérifier si l'employé est déjà connecté
    const employeeSession = localStorage.getItem("boutikbf-employee-session");
    if (employeeSession) {
      try {
        const session = JSON.parse(employeeSession);
        if (session.pin && session.name) {
          navigate({ to: "/employee/dashboard" });
        }
      } catch {
        localStorage.removeItem("boutikbf-employee-session");
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Récupérer l'employé depuis Supabase par PIN
      const { data: employees, error } = await supabase
        .from("employees" as any)
        .select("*")
        .eq("pin", pin)
        .eq("is_active", true)
        .limit(1);

      if (error || !employees || employees.length === 0) {
        toast.error("Nom ou code PIN incorrect");
        setLoading(false);
        return;
      }

      const employee = employees[0];

      // Vérifier le nom (insensible à la casse)
      if (employee.name.toLowerCase() !== name.toLowerCase().trim()) {
        toast.error("Nom ou code PIN incorrect");
        setLoading(false);
        return;
      }

      // Créer la session employé
      const session = {
        name: (employee as any).name,
        role: (employee as any).role,
        pin: (employee as any).pin,
        employeeId: employee.id,
        shopId: (employee as any).shop_id,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem("boutikbf-employee-session", JSON.stringify(session));
      toast.success(`Bienvenue ${(employee as any).name} !`);

      // Rediriger selon le rôle
      setTimeout(() => {
        const role = (employee as any).role;
        if (role === "gerant" || role === "manager") {
          navigate({ to: "/employee/dashboard" });
        } else if (role === "comptable" || role === "accountant") {
          navigate({ to: "/employee/accounting" });
        } else if (role === "superviseur") {
          navigate({ to: "/employee/dashboard" });
        } else if (role === "magasinier") {
          navigate({ to: "/employee/stock" });
        } else if (role === "commercial") {
          navigate({ to: "/employee/pos" });
        } else {
          navigate({ to: "/employee/pos" });
        }
      }, 500);
    } catch (error) {
      toast.error("Erreur de connexion");
      console.error("Erreur login employé:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img
            src={logo}
            alt="BoutikBF"
            width={60}
            height={60}
            className="h-16 w-16 object-contain mb-4"
          />
          <h1 className="font-display text-3xl font-bold">BoutikBF</h1>
          <p className="text-muted-foreground mt-2">Accès employé</p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Connexion
            </CardTitle>
            <CardDescription>
              Entrez votre nom et votre code PIN fourni par l'administrateur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ex: Aïcha Ouédraogo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">Code PIN</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pin"
                    type="password"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pl-9 h-11"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Le code PIN vous a été fourni par l'administrateur
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-primary shadow-elegant"
                disabled={loading || !name.trim() || !pin.trim()}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground text-center">
                Accès réservé aux employés autorisés.
                <br />
                Contactez votre administrateur si vous n'avez pas de code PIN.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
            ← Retour à la connexion administrateur
          </Link>
        </div>
      </div>
    </div>
  );
}
