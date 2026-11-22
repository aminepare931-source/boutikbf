import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/webhooks/geniuspay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleWebhookRequest } = await import("@/lib/payments/http.server");
        return handleWebhookRequest(request);
      },
    },
  },
});
