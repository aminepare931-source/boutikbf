import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/payments/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleCheckoutRequest } = await import("@/lib/payments/http.server");
        return handleCheckoutRequest(request);
      },
    },
  },
});
