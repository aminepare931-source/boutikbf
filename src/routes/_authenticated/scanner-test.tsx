import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-parts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanLine, CheckCircle2, XCircle, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/scanner-test")({
  head: () => ({ meta: [{ title: "Test douchette — BoutikBF" }] }),
  component: ScannerTestPage,
});

type Hit = { code: string; via: "auto" | "champ"; ms: number; ok: boolean };

/**
 * Utilitaire : branche ta douchette USB/Bluetooth et scanne n'importe quel
 * code-barres. Deux détections testées :
 *  1) automatique (émulation clavier rapide, sans champ actif) — c'est ce que
 *     la caisse utilise en production ;
 *  2) via le champ (mode « clavier + Tab » classique).
 */
function ScannerTestPage() {
  const [hits, setHits] = useState<Hit[]>([]);
  const [fieldValue, setFieldValue] = useState("");
  const [autoLast, setAutoLast] = useState<string | null>(null);
  const fieldRef = useRef<HTMLInputElement>(null);

  // Détection auto (même logique que la caisse)
  useEffect(() => {
    let buf = "";
    let t0 = 0;
    let last = 0;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inField =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (inField) return;
      const now = Date.now();
      if (now - last > 120) {
        buf = "";
        t0 = now;
      }
      last = now;
      if (e.key === "Enter") {
        if (buf.length >= 3) {
          const ms = now - t0;
          setAutoLast(buf);
          setHits((h) =>
            [{ code: buf, via: "auto" as const, ms, ok: ms < 800 }, ...h].slice(0, 20),
          );
        }
        buf = "";
      } else if (e.key.length === 1 && /[0-9A-Za-z-]/.test(e.key)) {
        if (!buf) t0 = now;
        buf += e.key;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Détection via champ : l'Entrée du scanner valide
  const onFieldEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const code = fieldValue.trim();
    if (code) {
      setHits((h) => [{ code, via: "champ" as const, ms: 0, ok: true }, ...h].slice(0, 20));
      setFieldValue("");
    }
  };

  const okCount = hits.filter((h) => h.ok).length;

  return (
    <div>
      <PageHeader
        title="Test de douchette code-barres"
        description="Vérifie que ton scanner USB/Bluetooth fonctionne en émulation clavier, comme à la caisse."
        actions={
          hits.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => setHits([])}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Vider le journal
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-5">
            <h3 className="font-semibold">1. Détection automatique (utilisée par la caisse)</h3>
            <p className="text-sm text-muted-foreground">
              Clique n'importe où sur la page (hors champ), puis scanne. Si un code apparaît ici, ta
              douchette est compatible avec BoutikBF sans rien installer.
            </p>
            <div className="rounded-xl border border-dashed border-border p-4 text-center">
              {autoLast ? (
                <div className="font-mono text-2xl font-bold text-success">{autoLast}</div>
              ) : (
                <div className="text-sm text-muted-foreground">…en attente d'un scan</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <h3 className="font-semibold">2. Détection via champ (mode classique)</h3>
            <p className="text-sm text-muted-foreground">
              Certaines douchettes envoient le code dans le champ actif suivi d'Entrée.
            </p>
            <Input
              ref={fieldRef}
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              onKeyDown={onFieldEnter}
              placeholder="Clique ici puis scanne…"
              className="h-12 text-lg font-mono"
            />
            <Button variant="outline" size="sm" onClick={() => fieldRef.current?.focus()}>
              <ScanLine className="mr-1.5 h-4 w-4" /> Re-focaliser le champ
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Journal des scans ({hits.length})</h3>
            {hits.length > 0 && (
              <Badge variant={okCount === hits.length ? "default" : "secondary"}>
                {okCount}/{hits.length} rapides
              </Badge>
            )}
          </div>
          {hits.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Scannez un code-barres pour commencer.
            </p>
          ) : (
            <div className="space-y-1.5">
              {hits.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  {h.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-warning" />
                  )}
                  <span className="font-mono font-semibold">{h.code}</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {h.via === "auto" ? "détection auto" : "champ"}
                  </Badge>
                  {h.via === "auto" && h.ms > 0 && (
                    <span className="text-xs text-muted-foreground">{h.ms} ms</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Astuce : si la détection auto ne marche pas mais que le champ oui, ta douchette est
            en mode « clavier lent » — dans la caisse, garde simplement le champ recherche actif (il
            est sélectionné automatiquement à l'ouverture).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
