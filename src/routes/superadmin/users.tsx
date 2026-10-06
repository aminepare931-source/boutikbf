import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Ban, CheckCircle2, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminRpc, type AdminUser } from "@/lib/superadmin";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/users")({ component: UsersPage });

function UsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sa-users"],
    queryFn: () => adminRpc<AdminUser[]>("admin_list_users"),
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t
      ? users.filter((u) =>
          [u.email, u.full_name, u.phone].some((v) => v?.toLowerCase().includes(t)),
        )
      : users;
  }, [users, q]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["sa-users"] });
  const onError = (e: Error) => toast.error(e.message);

  const ban = useMutation({
    mutationFn: (v: { id: string; banned: boolean }) =>
      adminRpc("admin_set_user_banned", { p_user_id: v.id, p_banned: v.banned }),
    onSuccess: (_d, v) => {
      toast.success(v.banned ? "Compte bloqué" : "Compte débloqué");
      refresh();
    },
    onError,
  });
  const del = useMutation({
    mutationFn: (id: string) => adminRpc("admin_delete_user", { p_user_id: id }),
    onSuccess: () => {
      toast.success("Compte supprimé");
      setToDelete(null);
      refresh();
    },
    onError,
  });

  const sendReset = async (email: string | null) => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error(error.message);
    else toast.success(`Email de réinitialisation envoyé à ${email}`);
  };

  const isBanned = (u: AdminUser) => !!u.banned_until && new Date(u.banned_until) > new Date();

  return (
    <>
      <PageHeader title="Utilisateurs" description={`${users.length} compte(s) enregistré(s).`} />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Email, nom, téléphone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-muted-foreground" />
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Boutiques</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">{fmtDate(u.created_at)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.last_sign_in_at ? fmtDate(u.last_sign_in_at) : "Jamais"}
                  </TableCell>
                  <TableCell className="text-right">{u.shops_count}</TableCell>
                  <TableCell>
                    {u.is_super_admin && <Badge className="mr-1">Super admin</Badge>}
                    {isBanned(u) ? (
                      <Badge variant="destructive">Bloqué</Badge>
                    ) : (
                      <Badge variant="secondary">Actif</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Envoyer un lien de nouveau mot de passe"
                        onClick={() => sendReset(u.email)}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={isBanned(u) ? "Débloquer" : "Bloquer"}
                        disabled={ban.isPending}
                        onClick={() => ban.mutate({ id: u.id, banned: !isBanned(u) })}
                      >
                        {isBanned(u) ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Supprimer"
                        onClick={() => setToDelete(u)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.email} sera supprimé définitivement, avec ses boutiques et leurs données.
              Irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && del.mutate(toDelete.id)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
