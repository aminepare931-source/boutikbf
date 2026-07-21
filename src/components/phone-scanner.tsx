import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Smartphone, QrCode, ScanLine, CheckCircle2, X, Loader2 } from "lucide-react";
import { createScanSession, buildScanUrl, listenForRemoteScan } from "@/lib/remote-scanner";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDetected: (code: string) => void;
};

/**
 * Affiche un QR code que l'utilisateur scanne avec son téléphone.
 * Le téléphone ouvre la caméra et envoie les codes-barres à l'ordinateur en temps réel.
 */
export function PhoneScanner({ open, onOpenChange, onDetected }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [status, setStatus] = useState<"waiting" | "connected" | "scanning">("waiting");
  const [lastCode, setLastCode] = useState("");

  // Générer la session et écouter
  useEffect(() => {
    if (!open) {
      setStatus("waiting");
      setLastCode("");
      return;
    }

    const sid = createScanSession();
    setSessionId(sid);
    setQrUrl(buildScanUrl(sid));
    setStatus("waiting");

    const unsubscribe = listenForRemoteScan(sid, (barcode) => {
      setLastCode(barcode);
      setStatus("scanning");
      onDetected(barcode);
      toast.success(`Code scanné : ${barcode}`);
    });

    return () => {
      unsubscribe();
    };
  }, [open, onDetected]);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Smartphone className="h-5 w-5" /> Scanner avec le téléphone
          </DialogTitle>
          <DialogDescription>
            Scannez le QR code avec votre téléphone pour utiliser sa caméra comme scanner.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code */}
          {qrUrl && (
            <div className="relative rounded-xl border-2 border-primary/20 bg-white p-4 shadow-sm">
              <QRCodeSVG value={qrUrl} size={200} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2 text-sm">
            {status === "waiting" && (
              <>
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-muted-foreground">En attente du scan du QR code...</span>
              </>
            )}
            {status === "connected" && (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-600">Téléphone connecté !</span>
              </>
            )}
            {status === "scanning" && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-green-600">
                  Code reçu : <strong>{lastCode}</strong>
                </span>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="w-full space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium flex items-center gap-2">
              <ScanLine className="h-4 w-4" /> Comment faire ?
            </p>
            <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
              <li>Prenez votre téléphone</li>
              <li>Ouvrez l'appareil photo ou une application de scan de QR code</li>
              <li>Scannez le QR code ci-dessus</li>
              <li>La caméra du téléphone s'activera automatiquement</li>
              <li>Pointez-la vers un code-barres pour le scanner</li>
            </ol>
          </div>

          <Button variant="outline" onClick={handleClose} className="w-full">
            <X className="mr-2 h-4 w-4" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
