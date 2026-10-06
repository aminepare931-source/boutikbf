import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminRpc, type AdminUser } from "@/lib/superadmin";

export const Route = createFileRoute("/superadmin/admins")({ component: AdminsPage });

type Log = {
  id: string;
  admin_id: string | null;
  action: string;
  target: string | null;
  details: any;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  set_plan: "Changement de formule",
  extend_trial: "Prolongation d'essai",
  suspend_shop: "Boutique suspendue",
  unsuspend_shop: "Boutique réactivée",
  delete_shop: "Boutique supprimée",
  ban_user: "Compte bloqué",
  unban_user: "Compte débloqué",
  delete_user: "Compte supprimé",
  grant_super_admin: "Super admin ajouté",
  revoke_super_admin: "Super admin retiré",
};

function AdminsPage() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["sa-users"],
    queryFn: () => adminRpc<AdminUser[]>("admin_list_users"),
  });
  const admins = users.filter((u) => u.is_super_admin);
  const emailOf = (id: string | null) =>
    users.find((u) => u.id === id)?.email ?? id?.slice(0, 8) ?? "—";

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["sa-audit"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return data as Log[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["sa-users"] });
    qc.invalidateQueries({ queryKey: ["sa-audit"] });
  };
  const grant = useMutation({
    mutationFn: () => adminRpc("admin_grant_super_admin", { p_email: email }),
    onSuccess: () => {
      toast.success("Super admin ajouté");
      setEmail("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => adminRpc("admin_revoke_super_admin", { p_user_id: id }),
    onSuccess: () => {
      toast.success("Super admin retiré");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Admins & journal"
        description="Qui peut accéder à cet espace, et ce qui a été fait."
      />
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Super admins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {admins.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>{a.email}</span>
              <Button
                size="icon"
                variant="ghost"
                title="Retirer"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(a.id)}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) grant.mutate();
            }}
          >
            <Input
              type="email"
              placeholder="Email d'un compte existant"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={grant.isPending}>
              <UserPlus className="mr-1.5 h-4 w-4" /> Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6 overflow-x-auto">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Journal des actions (100 dernières)
          </CardTitle>
        </CardHeader>
        {isLoading ? (
          <Loader2 className="mx-auto mb-6 h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(l.created_at).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-sm">{emailOf(l.admin_id)}</TableCell>
                  <TableCell className="text-sm">{ACTION_LABELS[l.action] ?? l.action}</TableCell>
                  <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">
                    {l.details ? JSON.stringify(l.details) : l.target}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Aucune action pour le moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
