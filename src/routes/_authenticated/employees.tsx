import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/page-parts";
import {
  UserCog,
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Share2,
  Trash2,
  User,
  Phone,
  Shield,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Clock,
  Activity,
  Mail,
  MapPin,
  BadgeCheck,
  XCircle,
  Edit3,
  RefreshCw,
  BarChart3,
  DollarSign,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useShops } from "@/lib/shop-store";
import { toast } from "sonner";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({ meta: [{ title: "Mon équipe — BoutikBF" }] }),
  component: EmployeesPage,
});

type Role = "caissier" | "gerant" | "comptable" | "magasinier" | "commercial" | "superviseur";
type Draft = { name: string; phone: string; role: Role };
type Employee = Draft & { id: string; pin: string; created_at: string; is_active: boolean };

const ROLES: { value: Role; label: string; desc: string }[] = [
  {
    value: "caissier",
    label: "Caissier / Vendeur",
    desc: "Peut vendre à la caisse et voir les produits.",
  },
  {
    value: "gerant",
    label: "Gérant de boutique",
    desc: "Peut tout gérer sauf supprimer la boutique.",
  },
  { value: "comptable", label: "Comptable", desc: "Voit les chiffres et l'argent, ne vend pas." },
  {
    value: "magasinier",
    label: "Magasinier / Stock",
    desc: "Gère les stocks, réceptions et inventaires.",
  },
  {
    value: "commercial",
    label: "Commercial / Vendeur terrain",
    desc: "Peut vendre et gérer les clients, pas la caisse.",
  },
  {
    value: "superviseur",
    label: "Superviseur",
    desc: "Supervise les équipes, voit tous les rapports.",
  },
];

// Limites selon le plan
const PLAN_LIMITS: Record<string, number> = {
  essentiel: 3,
  essentiel_paid: 5,
  pro: 10,
  "sur-mesure": 999,
};

function EmployeesPage() {
  const { current } = useShops();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeStats, setEmployeeStats] = useState<{
    totalSales: number;
    totalRevenue: number;
    lastSale: string | null;
    paymentMethods: Record<string, number>;
    sales: Array<{ id: string; total: number; created_at: string; payment_method: string }>;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [draft, setDraft] = useState<Draft>({ name: "", phone: "", role: "caissier" });
  const [generatedPin, setGeneratedPin] = useState("");

  const loadEmployees = async () => {
    if (!current) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("shop_id", current.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement des employés");
      console.error(error);
    } else {
      setEmployees((data ?? []) as Employee[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const loadEmployeeStats = async (employeeId: string) => {
    if (!current) return;
    setStatsLoading(true);
    try {
      // Ventes de l'employé
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("id, total, created_at, payment_method")
        .eq("shop_id", current.id)
        .eq("employee_name", selectedEmployee?.name)
        .order("created_at", { ascending: false });

      if (salesError) throw salesError;

      const totalSales = sales?.length || 0;
      const totalRevenue = sales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0;
      const lastSale = sales?.[0]?.created_at || null;
      const paymentMethods = sales?.reduce((acc: Record<string, number>, s) => {
        acc[s.payment_method] = (acc[s.payment_method] || 0) + 1;
        return acc;
      }, {});

      setEmployeeStats({
        totalSales,
        totalRevenue,
        lastSale,
        paymentMethods,
        sales,
      });
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    }
    setStatsLoading(false);
  };

  const save = async (employee: Employee) => {
    if (!current) return;
    const { error } = await supabase.from("employees").insert({
      shop_id: current.id,
      name: employee.name,
      phone: employee.phone,
      role: employee.role,
      pin: employee.pin,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    } else {
      toast.success(`${employee.name} a été ajouté(e) à l'équipe`);
      loadEmployees();
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Employé supprimé");
      if (selectedEmployee?.id === id) {
        setDetailOpen(false);
        setSelectedEmployee(null);
      }
      loadEmployees();
    }
  };

  const toggleActive = async (emp: Employee) => {
    const { error } = await supabase
      .from("employees")
      .update({ is_active: !emp.is_active })
      .eq("id", emp.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success(emp.is_active ? "Employé désactivé" : "Employé activé");
      loadEmployees();
      if (selectedEmployee?.id === emp.id) {
        setSelectedEmployee({ ...emp, is_active: !emp.is_active });
      }
    }
  };

  const reset = () => {
    setStep(1);
    setDraft({ name: "", phone: "", role: "caissier" });
    setGeneratedPin("");
  };
  const openWizard = () => {
    reset();
    setOpen(true);
  };

  const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

  const finish = async () => {
    try {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const pin = generatePin();
      setGeneratedPin(pin);

      const employee: Employee = {
        ...draft,
        id,
        pin,
        created_at: new Date().toISOString(),
        is_active: true,
      };

      await save(employee);
      setStep(4);
    } catch {
      toast.error("Erreur lors de l'ajout. Veuillez réessayer.");
    }
  };

  const getEmployeeLink = (role?: string) => {
    switch (role) {
      case "caissier":
        return "/employee/pos";
      case "gerant":
        return "/employee/dashboard";
      case "comptable":
        return "/employee/accounting";
      default:
        return "/employee/dashboard";
    }
  };
  const inviteLink = `${typeof window !== "undefined" ? window.location.origin : ""}${getEmployeeLink(selectedEmployee?.role)}`;
  const smsText = `Bonjour ${draft.name || ""}, vous êtes invité(e) à rejoindre l'équipe de ${current?.name ?? "la boutique"} sur BoutikBF. Votre code PIN : ${generatedPin}. Connectez-vous sur : ${inviteLink}`;

  const copy = async (t: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(t);
        toast.success("Copié !");
        return;
      }
    } catch {
      // Fallback silencieux
    }
    // Fallback : sélection + copie
    try {
      const textarea = document.createElement("textarea");
      textarea.value = t;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (success) {
        toast.success("Copié !");
      } else {
        // Dernier recours : sélection manuelle
        window.getSelection()?.removeAllRanges();
        const range = document.createRange();
        const temp = document.createElement("div");
        temp.textContent = t;
        temp.style.position = "fixed";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        range.selectNodeContents(temp);
        window.getSelection()?.addRange(range);
        document.body.removeChild(temp);
        toast.success("Texte sélectionné — utilisez Ctrl+C");
      }
    } catch {
      toast.error("Impossible de copier. Sélectionnez le texte manuellement.");
    }
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: smsText });
      } catch {
        // Silently fail
      }
    } else {
      copy(smsText);
    }
  };

  const roleLabel = (r: Role) => ROLES.find((x) => x.value === r)?.label ?? r;

  const roleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    if (role === "gerant") return "default";
    if (role === "comptable") return "secondary";
    return "outline";
  };

  const openDetail = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEmployeeStats(null);
    setDetailOpen(true);
    loadEmployeeStats(emp.id);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <PageHeader
        title="Mon équipe"
        description="Ajoutez les personnes qui travaillent avec vous : caissiers, gérants, comptables."
        actions={
          <Button onClick={openWizard} className="bg-gradient-primary shadow-elegant">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter quelqu'un
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Personne pour l'instant"
          description="Ajoutez votre premier employé en 3 étapes simples. On vous guide."
          action={
            <Button onClick={openWizard} className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter mon premier employé
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => openDetail(emp)}
              className="group relative cursor-pointer"
            >
              <Card className="shadow-soft transition hover:border-primary hover:shadow-elegant">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-gradient-primary text-primary-foreground flex-shrink-0">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base truncate">{emp.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {roleLabel(emp.role)} · {emp.phone}
                    </div>
                  </div>
                  {!emp.is_active && (
                    <Badge variant="outline" className="text-destructive border-destructive">
                      Inactif
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Dialogue Détail Employé */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg sm:text-xl">
              Détail de l'employé
            </DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              {/* En-tête avec statut */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="grid h-12 w-12 sm:h-16 sm:w-16 place-items-center rounded-full bg-gradient-primary text-primary-foreground flex-shrink-0">
                    <User className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl sm:text-2xl font-bold truncate">
                      {selectedEmployee.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant={roleBadgeVariant(selectedEmployee.role)}>
                        {roleLabel(selectedEmployee.role)}
                      </Badge>
                      <Badge
                        variant={selectedEmployee.is_active ? "default" : "outline"}
                        className={
                          selectedEmployee.is_active
                            ? "bg-success text-success-foreground"
                            : "text-destructive border-destructive"
                        }
                      >
                        {selectedEmployee.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActive(selectedEmployee)}
                  className="w-full sm:w-auto h-9"
                >
                  {selectedEmployee.is_active ? (
                    <XCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  {selectedEmployee.is_active ? "Désactiver" : "Activer"}
                </Button>
              </div>

              {/* Informations personnelles */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <User className="h-4 w-4" /> Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">Téléphone</div>
                        <div className="font-medium truncate">
                          {selectedEmployee.phone || "Non renseigné"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground">Code PIN</div>
                        <div className="font-mono text-lg font-bold tracking-wider">
                          {selectedEmployee.pin}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copy(selectedEmployee.pin)}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copier
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3 sm:col-span-2">
                      <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground">Lien de connexion</div>
                        <div className="text-sm truncate font-mono">
                          {window.location.origin}
                          {getEmployeeLink(selectedEmployee?.role)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copy(
                            `${window.location.origin}${getEmployeeLink(selectedEmployee?.role)}`,
                          )
                        }
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copier
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Membre depuis</div>
                        <div className="font-medium text-sm">
                          {formatDate(selectedEmployee.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <Activity className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Dernière activité</div>
                        <div className="font-medium text-sm">
                          {employeeStats?.lastSale
                            ? formatDate(employeeStats.lastSale)
                            : "Aucune activité"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiques de vente */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Statistiques de vente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                    </div>
                  ) : employeeStats ? (
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                      <div className="text-center p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-primary" />
                        <div className="text-xl sm:text-2xl font-bold">
                          {employeeStats.totalSales}
                        </div>
                        <div className="text-xs text-muted-foreground">Ventes réalisées</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 rounded-lg bg-success/5 border border-success/20">
                        <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-success" />
                        <div className="text-xl sm:text-2xl font-bold">
                          {fmtMoney(employeeStats.totalRevenue, current?.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">Chiffre d'affaires</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 rounded-lg bg-warning/5 border border-warning/20">
                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-warning" />
                        <div className="text-xl sm:text-2xl font-bold">
                          {employeeStats.totalSales > 0
                            ? fmtMoney(
                                Math.round(employeeStats.totalRevenue / employeeStats.totalSales),
                                current?.currency,
                              )
                            : "0"}
                        </div>
                        <div className="text-xs text-muted-foreground">Panier moyen</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Aucune donnée de vente disponible
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Méthodes de paiement */}
              {employeeStats?.paymentMethods &&
                Object.keys(employeeStats.paymentMethods).length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="font-display text-base flex items-center gap-2">
                        <Package className="h-4 w-4" /> Méthodes de paiement utilisées
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(employeeStats.paymentMethods).map(([method, count]) => (
                          <Badge key={method} variant="secondary" className="text-sm px-3 py-1.5">
                            {method === "cash"
                              ? "💵 Espèces"
                              : method === "mobile"
                                ? "📱 Mobile Money"
                                : "💳 Carte"}
                            <span className="ml-2 font-bold">{count}</span>
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full h-11 justify-start"
                    onClick={() => {
                      const message = `Bonjour ${selectedEmployee.name}, votre code PIN pour BoutikBF est : ${selectedEmployee.pin}. Connectez-vous sur : ${window.location.origin}${getEmployeeLink(selectedEmployee?.role)}`;
                      copy(message);
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Copier le message d'invitation
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteEmployee(selectedEmployee.id)}
                    className="w-full h-11 justify-start"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer l'employé
                  </Button>
                </CardContent>
              </Card>

              {/* Avertissement */}
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                <p className="text-xs text-muted-foreground">
                  ⚠️ Ne partagez pas ce PIN publiquement. L'employé en a besoin pour se connecter à
                  son espace de travail.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue Ajout Employé */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg sm:text-xl">
              {step === 4 ? "🎉 C'est fait !" : `Ajouter — étape ${step}/3`}
            </DialogTitle>
          </DialogHeader>

          {step < 4 && (
            <div className="mb-4 flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-gradient-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Comment s'appelle-t-il/elle ?
              </p>
              <div className="space-y-2">
                <Label className="text-sm">Prénom et nom</Label>
                <Input
                  placeholder="Ex : Aïcha Ouédraogo"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  autoFocus
                  className="h-10 sm:h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Numéro de téléphone</Label>
                <Input
                  placeholder="Ex : +226 70 00 00 00"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  className="h-10 sm:h-11"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  disabled={!draft.name.trim() || !draft.phone.trim()}
                  onClick={() => setStep(2)}
                  className="h-10 sm:h-11"
                >
                  Continuer <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Que va faire {draft.name} dans la boutique ?
              </p>
              <RadioGroup
                value={draft.role}
                onValueChange={(v) => setDraft({ ...draft, role: v as Role })}
                className="space-y-2"
              >
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    htmlFor={r.value}
                    className="flex cursor-pointer gap-2 sm:gap-3 rounded-lg border border-border p-3 hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value={r.value} id={r.value} className="mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm sm:text-base">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="h-10 sm:h-11">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button onClick={() => setStep(3)} className="h-10 sm:h-11">
                  Continuer <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Vérifiez que tout est correct :
              </p>
              <div className="rounded-lg border border-border p-3 sm:p-4 space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nom :</span> <b>{draft.name}</b>
                </div>
                <div>
                  <span className="text-muted-foreground">Téléphone :</span> <b>{draft.phone}</b>
                </div>
                <div>
                  <span className="text-muted-foreground">Rôle :</span>{" "}
                  <b>{roleLabel(draft.role)}</b>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)} className="h-10 sm:h-11">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button onClick={finish} className="bg-gradient-primary h-10 sm:h-11">
                  <Check className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-success/30 bg-success/5 p-3 sm:p-4 text-xs sm:text-sm">
                <b>{draft.name}</b> est ajouté(e) comme <b>{roleLabel(draft.role)}</b>. Envoyez-lui
                ce message pour qu'il/elle rejoigne votre boutique :
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs sm:text-sm">
                {smsText}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => copy(smsText)} className="h-10 sm:h-11">
                  <Copy className="mr-2 h-4 w-4" />
                  Copier
                </Button>
                <Button onClick={share} className="bg-gradient-primary h-10 sm:h-11">
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager
                </Button>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="ghost" onClick={() => setOpen(false)} className="h-10 sm:h-11">
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
