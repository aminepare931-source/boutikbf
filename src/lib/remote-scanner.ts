import { supabase } from "@/integrations/supabase/client";

const CHANNEL_PREFIX = "remote-scan";

export type ScanEvent = {
  sessionId: string;
  barcode: string;
  timestamp: number;
};

/**
 * Génère un ID de session unique pour un scan à distance.
 */
export function createScanSession(): string {
  return crypto.randomUUID();
}

/**
 * Crée l'URL à mettre dans le QR code.
 * Le téléphone ouvre cette page et active la caméra.
 */
export function buildScanUrl(sessionId: string): string {
  const base = window.location.origin;
  return `${base}/remote-scan?session=${sessionId}`;
}

/**
 * Côté ORDINATEUR : écoute les codes-barres envoyés par le téléphone.
 * Retourne une fonction unsubscribe.
 */
export function listenForRemoteScan(sessionId: string, onBarcode: (barcode: string) => void) {
  const channel = supabase.channel(`${CHANNEL_PREFIX}:${sessionId}`);

  channel
    .on("broadcast", { event: "barcode" }, (payload: { payload: ScanEvent }) => {
      if (payload.payload.sessionId === sessionId) {
        onBarcode(payload.payload.barcode);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Côté TÉLÉPHONE : envoie un code-barres scanné vers l'ordinateur.
 */
export async function sendBarcodeToDesktop(sessionId: string, barcode: string) {
  const channel = supabase.channel(`${CHANNEL_PREFIX}:${sessionId}`);

  await channel.subscribe();

  channel.send({
    type: "broadcast",
    event: "barcode",
    payload: {
      sessionId,
      barcode,
      timestamp: Date.now(),
    },
  });
}
