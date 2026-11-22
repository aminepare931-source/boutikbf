import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/payments/confirm")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleConfirmRequest } = await import("@/lib/payments/http.server");
        return handleConfirmRequest(request);
      },
    },
  },
});
