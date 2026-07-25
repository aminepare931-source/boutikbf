import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { sendBarcodeToDesktop } from "@/lib/remote-scanner";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Smartphone, CheckCircle2, XCircle } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/remote-scan")({
  validateSearch: (search: Record<string, string | undefined>) => ({
    session: search.session ?? "",
  }),
  head: () => ({ meta: [{ title: "Scan à distance — BoutikBF" }] }),
  component: RemoteScanPage,
});

function RemoteScanPage() {
  const navigate = useNavigate();
  const { session } = useSearch({ from: "/remote-scan" });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [lastCode, setLastCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startScanning = async () => {
    if (!session) return;
    setScanning(true);
    setError(null);

    try {
      // First, request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      const reader = new BrowserMultiFormatReader();
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const back = devices.find((d) => /back|rear|environment/i.test(d.label));
      const deviceId = back?.deviceId ?? devices[0]?.deviceId;

      if (!deviceId || !videoRef.current) {
        setError("Aucune caméra trouvée");
        setScanning(false);
        return;
      }

      reader.decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
        if (result) {
          const code = result.getText();
          setLastCode(code);
          sendBarcodeToDesktop(session, code);
        }
      });
    } catch (e: unknown) {
      console.error("Camera error:", e);
      if (e instanceof Error) {
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          setError("Permission caméra refusée. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.");
        } else if (e.name === "NotFoundError") {
          setError("Aucune caméra détectée sur cet appareil.");
        } else {
          setError(e.message);
        }
      } else {
        setError("Erreur caméra");
      }
      setScanning(false);
    }
  };

  const stopScanning = () => {
    setScanning(false);
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h1 className="text-xl font-bold">Lien invalide</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Scannez un QR code depuis l'application BoutikBF sur votre ordinateur.
          </p>
          <Button className="mt-6" onClick={() => navigate({ to: "/" })}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="bf-flag-bar h-1.5" />
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <img src={logo} alt="BoutikBF" width={28} height={28} className="h-7 w-7 object-contain" />
        <span className="font-display text-lg font-bold">BoutikBF</span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Connecté
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <Smartphone className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h1 className="text-xl font-bold">Scanner avec ce téléphone</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les codes-barres scannés seront envoyés directement à votre ordinateur.
          </p>

          {/* Camera preview */}
          {scanning ? (
            <div className="relative mx-auto mt-6 overflow-hidden rounded-lg border bg-black">
              <video
                ref={videoRef}
                className="aspect-[4/3] w-full object-cover"
                muted
                playsInline
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-1/2 w-3/4 rounded-lg border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
            </div>
          ) : error ? (
            <div className="mx-auto mt-6 flex flex-col items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm">
              <CameraOff className="h-8 w-8 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          ) : null}

          {/* Last scanned */}
          {lastCode && (
            <div className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-lg border border-green-500/50 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Dernier scan : <strong>{lastCode}</strong>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 flex gap-3">
            {!scanning ? (
              <Button onClick={startScanning} className="flex-1 bg-gradient-primary shadow-elegant">
                <Camera className="mr-2 h-4 w-4" />
                Activer la caméra
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex-1">
                <CameraOff className="mr-2 h-4 w-4" />
                Arrêter le scan
              </Button>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Pointez la caméra vers un code-barres pour le scanner automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
}
