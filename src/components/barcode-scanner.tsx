import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDetected: (code: string) => void;
  title?: string;
  continuous?: boolean;
};

export function BarcodeScanner({
  open,
  onOpenChange,
  onDetected,
  title = "Scanner un code-barres",
  continuous = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        // First, request camera permission explicitly
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop the stream immediately, we just needed permission
        stream.getTracks().forEach(track => track.stop());
        
        // Now list devices
        const list = await BrowserMultiFormatReader.listVideoInputDevices();
        if (cancelled) return;
        setDevices(list);
        // Prefer the back camera
        const back = list.find((d) => /back|rear|environment/i.test(d.label));
        setDeviceId(back?.deviceId ?? list[0]?.deviceId);
      } catch (e: any) {
        console.error("Camera error:", e);
        if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
          setError("Permission caméra refusée. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.");
        } else if (e?.name === "NotFoundError") {
          setError("Aucune caméra détectée sur cet appareil.");
        } else {
          setError(e?.message ?? "Caméra indisponible");
        }
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !deviceId || !videoRef.current) return;
    
    // Use MultiFormatReader for better detection (QR, barcodes, etc.)
    const reader = new BrowserMultiFormatReader();
    let stopped = false;
    let lastCode = "";
    let lastAt = 0;
    let attempts = 0;
    const maxAttempts = 3; // Try multiple times for better accuracy

    reader
      .decodeFromVideoDevice(deviceId, videoRef.current, (result, _err, controls) => {
        if (stopped) return;
        controlsRef.current = controls;
        
        if (result) {
          const text = result.getText();
          const now = Date.now();
          
          // Faster detection - reduce debounce to 800ms
          if (continuous) {
            if (text === lastCode && now - lastAt < 800) return;
            lastCode = text;
            lastAt = now;
            onDetected(text);
          } else {
            // For single scan, verify the code multiple times for accuracy
            attempts++;
            if (attempts >= maxAttempts || text === lastCode) {
              controls.stop();
              stopped = true;
              onDetected(text);
              onOpenChange(false);
            } else {
              lastCode = text;
            }
          }
        }
      })
      .catch((e) => {
        console.error("Scanner error:", e);
        setError(e?.message ?? "Impossible de démarrer la caméra");
      });

    return () => {
      stopped = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, deviceId, onDetected, onOpenChange, continuous]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Camera className="h-5 w-5" /> {title}
          </DialogTitle>
          <DialogDescription>
            Placez le code-barres au centre de la caméra. La détection est automatique.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-sm">
            <CameraOff className="h-10 w-10 text-destructive" />
            <p className="text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground">
              Vérifiez que vous avez autorisé l'accès à la caméra.
            </p>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-lg border border-border bg-black">
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
            {devices.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {devices.map((d) => (
                  <Button
                    key={d.deviceId}
                    size="sm"
                    variant={d.deviceId === deviceId ? "default" : "outline"}
                    onClick={() => setDeviceId(d.deviceId)}
                  >
                    {d.label || `Caméra ${d.deviceId.slice(0, 4)}`}
                  </Button>
                ))}
              </div>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Astuce : depuis un smartphone, utilisez la caméra arrière pour un meilleur scan.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Optional helper for callers */
export function scannerToast() {
  toast.info("Ouvrez le scanner et pointez la caméra vers le code-barres.");
}
