import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, User, Lock } from "lucide-react";
import logo from "@/assets/logo.png";
import { employeeLogin, getEmployeeSession, type EmployeeRole } from "@/lib/employee-session";

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

  const goHome = (role: EmployeeRole) => {
    if (role === "comptable") navigate({ to: "/employee/accounting" });
    else if (role === "magasinier") navigate({ to: "/employee/stock" });
    else if (role === "gerant" || role === "superviseur") navigate({ to: "/employee/dashboard" });
    else navigate({ to: "/employee/pos" });
  };

  useEffect(() => {
    // Déjà connecté (session valide et non expirée) ?
    const existing = getEmployeeSession();
    if (existing) goHome(existing.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await employeeLogin(name, pin.trim());
      if (!res.ok) {
        toast.error(
          res.error === "too_many_attempts"
            ? "Trop d'essais. Réessayez dans 15 minutes."
            : res.error === "network"
              ? "Connexion impossible. Vérifiez votre réseau."
              : "Nom ou code PIN incorrect",
        );
        return;
      }
      toast.success(`Bienvenue ${res.session.name} !`);
      goHome(res.session.role);
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
                    maxLength={8}
                    inputMode="numeric"
                    autoComplete="current-password"
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
